import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { body, validationResult } from 'express-validator'
import { User } from './models/User.js'

function isValidObjectId(id) {
    return (
      typeof id === 'string' &&
      ObjectId.isValid(id) &&
      id.length === 24 &&
      /^[a-fA-F0-9]{24}$/.test(id)
    )
}

dotenv.config({ path: '.env.local' })

const app = express()
const PORT = 3000
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@pinitdown.com'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://pinit-down.vercel.app',
    process.env.CORS_ORIGIN || '*'
  ],
  credentials: true
}))

app.use(express.json())

if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in .env.local')
}

const client = new MongoClient(process.env.MONGODB_URI)
const dbName = 'pinit-down'
let cartItems

// Configure nodemailer transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }
  
  // Default to console logging for development
  return {
    sendMail: async (mailOptions) => {
      console.log('Email would be sent:', mailOptions)
      return { messageId: 'test-message-id' }
    }
  }
}

const transporter = createTransporter()

// Helper function - JWT Token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const db = client.db(dbName)
    const user = await User.findById(db, decoded.userId)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

async function startServer() {
  await client.connect()
  const db = client.db(dbName)
  cartItems = db.collection('cartItems')

  console.log('Connected to MongoDB')

  app.listen(PORT, () => {
    console.log(`API is live at http://localhost:${PORT}`)
  })
}

startServer()

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Pinit Down API is running!' })
})

// POST /auth/register - User Registration without Email Verification
app.post('/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password, name } = req.body
    const db = client.db(dbName)

    // Check if user already exists
    const existingUser = await User.findByEmail(db, email)
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user (email verification disabled)
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    })

    const result = await newUser.save(db)
    const userId = result.insertedId

    // Generate token for immediate authentication
    const token = generateToken(userId)

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email,
        name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/verify-email - Verify Email Address
app.post('/auth/verify-email', [
  body('token').exists()
], async (req, res) => {
  try {
    const { token } = req.body
    const db = client.db(dbName)

    // Find user by verification token
    const user = await User.findByVerificationToken(db, token)
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' })
    }

    // Verify the email
    await User.verifyEmail(db, user._id)

    res.json({ 
      success: true,
      message: 'Email verified successfully! You can now log in.' 
    })
  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/resend-verification - Resend Verification Email
app.post('/auth/resend-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body
    const db = client.db(dbName)

    // Find user
    const user = await User.findByEmail(db, email)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' })
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 3600000) // 24 hours

    await User.updateVerificationToken(db, email, verificationToken, verificationExpires)

    // Send verification email
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'Please verify your email - Pinit Down',
      html: `
        <h2>Email Verification</h2>
        <p>Hi ${user.name},</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #8a2be2; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Pinit Down Team</p>
      `
    }

    await transporter.sendMail(mailOptions)

    res.json({ 
      success: true,
      message: 'Verification email sent! Please check your inbox.' 
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/login - User Login
app.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body
    const db = client.db(dbName)

    // Find user
    const user = await User.findByEmail(db, email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/forgot-password - Request password reset
app.post('/auth/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email } = req.body
    const db = client.db(dbName)

    // Find user
    const user = await User.findByEmail(db, email)
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If the email exists, a password reset link has been sent.' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to user
    await User.updateResetToken(db, email, resetToken, resetTokenExpiry)

    // Send reset email
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - Pinit Down',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #8a2be2; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Pinit Down Team</p>
      `
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: 'If the email exists, a password reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/verify-reset-token - Verify reset token
app.post('/auth/verify-reset-token', [
  body('token').exists()
], async (req, res) => {
  try {
    const { token } = req.body
    const db = client.db(dbName)

    const user = await User.findByResetToken(db, token)
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    res.json({ 
      success: true,
      user: {
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/reset-password - Reset password
app.post('/auth/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { token, password } = req.body
    const db = client.db(dbName)

    // Find user by reset token
    const user = await User.findByResetToken(db, token)
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password and clear reset token
    await User.updatePassword(db, user._id, hashedPassword)

    res.json({ 
      success: true,
      message: 'Password reset successfully' 
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Cart routes with authentication (user-specific)
app.get('/cart-items', authenticateToken, async (req, res) => {
  try {
    // Only get cart items for the authenticated user
    const userCartItems = await cartItems.find({ userId: req.user._id }).toArray()
    res.json(userCartItems)
  } catch (error) {
    console.error('Error fetching cart items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/cart-items', authenticateToken, async (req, res) => {
  try {
    const cartItem = {
      ...req.body,
      userId: req.user._id, // Associate with authenticated user
      createdAt: new Date()
    }
    const result = await cartItems.insertOne(cartItem)
    
    // Return the created item
    const newItem = await cartItems.findOne({ _id: result.insertedId })
    res.json(newItem)
  } catch (error) {
    console.error("Failed to insert cart item:", error)
    res.status(500).json({ error: "Failed to insert cart item" })
  }
})

app.patch('/cart-items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params
  const update = req.body

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' })
  }

  try {
    // Only update if the item belongs to the authenticated user
    const result = await cartItems.updateOne(
      { 
        _id: new ObjectId(id),
        userId: req.user._id // Ensure user owns this item
      },
      { $set: { ...update, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' })
    }
    
    res.json(result)
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/cart-items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' })
  }

  try {
    const result = await cartItems.deleteOne({ 
      _id: new ObjectId(id),
      userId: req.user._id
    })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' })
    }
    
    res.json(result)
  } catch (error) {
    console.error('Error deleting cart item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/cart-items', authenticateToken, async (req, res) => {
  try {
    const result = await cartItems.deleteMany({ userId: req.user._id })
    res.json(result)
  } catch (error) {
    console.error('Failed to delete all cart items:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})