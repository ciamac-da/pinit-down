import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

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

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))

app.use(express.json())

if (!process.env.MONGODB_URI) {
    throw new Error('❌ Missing MONGODB_URI in .env.local')
  }

  const client = new MongoClient(process.env.MONGODB_URI)
const dbName = 'pinit-down'
let cartItems

async function startServer() {
  await client.connect()
  const db = client.db(dbName)
  cartItems = db.collection('cartItems')

  app.listen(PORT, () => {
    console.log(`✅ API is live at http://localhost:${PORT}`)
  })
}

startServer()

// GET all cart items
app.get('/cart-items', async (req, res) => {
  const all = await cartItems.find().toArray()
  res.json(all)
})

// POST new cart item
app.post('/cart-items', async (req, res) => {
  const cartItem = req.body
  try {
    const result = await cartItems.insertOne(cartItem)
    res.json(result)
  } catch (error) {
    console.error("Failed to insert cart item:", error)
    res.status(500).json({ error: "Failed to insert cart item" })
  }
})

// PATCH update cart item
app.patch('/cart-items/:id', async (req, res) => {
    const { id } = req.params
    const update = req.body
  
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ID format' })
    }
  
    const result = await cartItems.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    )
    res.json(result)
  })
  

// DELETE cart item
app.delete('/cart-items/:id', async (req, res) => {
    const { id } = req.params
  
    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      
    const result = await cartItems.deleteOne({ _id: new ObjectId(id) })
    res.json(result)
  })

// DELETE all cart items
app.delete('/cart-items', async (req, res) => {
    try {
      const result = await cartItems.deleteMany({})
      res.json(result)
    } catch (err) {
      console.error('Failed to delete all cart items:', err)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  })
  