import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
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

const app = express() // MUST BE DECLARED BEFORE USING app.post()
const PORT = 3000
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

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

// Helper function - JWT Token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
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

// POST /auth/register - User Registration
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

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name
    })

    const result = await newUser.save(db)
    const userId = result.insertedId

    // Generate JWT token
    const token = generateToken(userId)

    res.status(201).json({
      message: 'User created successfully',
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

// Cart routes (your existing ones)
app.get('/cart-items', async (req, res) => {
  try {
    const all = await cartItems.find().toArray()
    res.json(all)
  } catch (error) {
    console.error('Error fetching cart items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/cart-items', async (req, res) => {
  try {
    const cartItem = {
      ...req.body,
      createdAt: new Date()
    }
    const result = await cartItems.insertOne(cartItem)
    res.json(result)
  } catch (error) {
    console.error("Failed to insert cart item:", error)
    res.status(500).json({ error: "Failed to insert cart item" })
  }
})

app.patch('/cart-items/:id', async (req, res) => {
  const { id } = req.params
  const update = req.body

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' })
  }

  try {
    const result = await cartItems.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date() } }
    )
    res.json(result)
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/cart-items/:id', async (req, res) => {
  const { id } = req.params

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' })
  }

  try {
    const result = await cartItems.deleteOne({ _id: new ObjectId(id) })
    res.json(result)
  } catch (error) {
    console.error('Error deleting cart item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/cart-items', async (req, res) => {
  try {
    const result = await cartItems.deleteMany({})
    res.json(result)
  } catch (error) {
    console.error('Failed to delete all cart items:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})