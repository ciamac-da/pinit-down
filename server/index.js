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

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' })

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@pinitdown.com'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
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
let transporterPromise

const initializeTransporter = async () => {
  try {
    if (process.env.EMAIL_SERVICE === 'gmail') {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('EMAIL_USER and EMAIL_PASSWORD must be set when EMAIL_SERVICE is gmail')
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      })

      await transporter.verify()
      console.log('Gmail email transporter verified and ready.')
      return transporter
    }

    if (process.env.EMAIL_SERVICE === 'ethereal' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      })

      await transporter.verify()
      console.log('Ethereal email transporter (env credentials) verified and ready.')
      console.log('View test emails at https://ethereal.email/messages')
      return transporter
    }

    if (process.env.EMAIL_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: process.env.EMAIL_USER && process.env.EMAIL_PASSWORD ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        } : undefined
      })

      await transporter.verify()
      console.log('Custom email transporter verified and ready.')
      return transporter
    }

    const testAccount = await nodemailer.createTestAccount()
    console.log('Created Ethereal test account for email delivery.')
    console.log(`Ethereal credentials — user: ${testAccount.user}, pass: ${testAccount.pass}`)
    console.log('View test emails at https://ethereal.email/messages')

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    })

    await transporter.verify()
    console.log('Ethereal email transporter verified and ready.')
    return transporter
  } catch (error) {
    console.error('Failed to initialize email transporter:', error)
    return null
  }
}

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = initializeTransporter()
  }

  const transporter = await transporterPromise

  if (!transporter) {
    transporterPromise = null
  }

  return transporter
}

// Kick off transporter initialization on startup so configuration issues surface immediately
transporterPromise = initializeTransporter()

// Helper function - JWT Token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

// Strong password validation
const isStrongPassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.'
  return null
}

const validateStrongPassword = (field = 'password') => {
  return body(field).custom((value) => {
    const error = isStrongPassword(value)
    if (error) throw new Error(error)
    return true
  })
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

// POST /auth/register - User Registration with Email Verification
app.post('/auth/register', [
  body('email').isEmail().normalizeEmail(),
  validateStrongPassword('password'),
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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 3600000) // 24 hours

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    })

    await newUser.save(db)

    // Send verification email
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`

    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify your email - Pinit Down',
      html: `
        <h2>Welcome to Pinit Down, ${name}!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #8a2be2; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Pinit Down Team</p>
      `
    }

    const transporter = await getTransporter()
    if (transporter) {
      const info = await transporter.sendMail(mailOptions)
      const previewUrl = nodemailer.getTestMessageUrl?.(info)
      if (previewUrl) console.log(`Verification email preview URL: ${previewUrl}`)
    } else {
      console.error('Email transporter unavailable — verification email not sent for:', email)
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true
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

    const transporter = await getTransporter()

    if (!transporter) {
      console.error('Email transporter is unavailable. Cannot send verification email.')
      return res.status(500).json({ error: 'Email service is currently unavailable. Please try again later.' })
    }

    const info = await transporter.sendMail(mailOptions)

    const previewUrl = nodemailer.getTestMessageUrl?.(info)
    if (previewUrl) {
      console.log(`Verification email preview URL: ${previewUrl}`)
    }

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

    // Block unverified accounts
    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' })
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
      return res.status(404).json({ error: 'No account found with that email address.' })
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

    const transporter = await getTransporter()

    if (!transporter) {
      console.error('Email transporter is unavailable. Cannot send reset email.')
      return res.status(500).json({ error: 'Email service is currently unavailable. Please try again later.' })
    }

    const info = await transporter.sendMail(mailOptions)

    const previewUrl = nodemailer.getTestMessageUrl?.(info)
    if (previewUrl) {
      console.log(`Password reset email preview URL: ${previewUrl}`)
    }

    res.json({ message: 'Password reset email sent successfully.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Unable to send password reset email. Please try again later.' })
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
  validateStrongPassword('password')
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

// POST /cart-items/reorder - Bulk update item order
app.post('/cart-items/reorder', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' })
    }
    const validItems = items.filter(({ id }) => isValidObjectId(id))
    if (validItems.length === 0) {
      return res.status(400).json({ error: 'No valid item IDs provided' })
    }
    const bulk = validItems.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: new ObjectId(id), userId: req.user._id },
        update: { $set: { order, updatedAt: new Date() } }
      }
    }))
    await cartItems.bulkWrite(bulk)
    res.json({ success: true })
  } catch (error) {
    console.error('Error reordering cart items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/cart-items', authenticateToken, async (req, res) => {
  try {
    const userCartItems = await cartItems
      .find({ userId: req.user._id })
      .sort({ order: 1, createdAt: 1 })
      .toArray()
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
    
    const updatedItem = await cartItems.findOne({ _id: new ObjectId(id), userId: req.user._id })
    res.json(updatedItem)
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

// PATCH /auth/change-password - Change password for authenticated user
app.patch('/auth/change-password', [
  body('currentPassword').exists(),
  validateStrongPassword('newPassword')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }
    const { currentPassword, newPassword } = req.body
    const db = client.db(dbName)
    const user = await User.findById(db, req.user._id)
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' })
    }
    const hashed = await bcrypt.hash(newPassword, 12)
    await User.updatePassword(db, req.user._id, hashed)
    res.json({ success: true, message: 'Password changed successfully.' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /auth/account - Delete user account and all their data
app.delete('/auth/account', authenticateToken, async (req, res) => {
  try {
    const db = client.db(dbName)
    // Delete all cart items belonging to the user
    await cartItems.deleteMany({ userId: req.user._id })
    // Delete the user document
    await User.deleteById(db, req.user._id)
    res.json({ success: true, message: 'Account deleted successfully.' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /auth/update-name - Update user display name
app.patch('/auth/update-name', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { name } = req.body
    const db = client.db(dbName)
    const { ObjectId } = await import('mongodb')

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: { name, updatedAt: new Date() } }
    )

    res.json({ success: true, name })
  } catch (error) {
    console.error('Update name error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
