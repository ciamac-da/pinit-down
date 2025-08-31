import express from 'express'
import { ObjectId } from 'mongodb'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const cartItems = req.app.locals.cartItems
    const userItems = await cartItems.find({ userId: req.user._id }).toArray()
    res.json(userItems)
  } catch (error) {
    console.error('Error fetching cart items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const cartItem = {
      ...req.body,
      userId: req.user._id,
      createdAt: new Date()
    }
    
    const cartItems = req.app.locals.cartItems
    const result = await cartItems.insertOne(cartItem)
    res.json(result)
  } catch (error) {
    console.error('Error adding cart item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const update = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' })
    }

    const cartItems = req.app.locals.cartItems
    const result = await cartItems.updateOne(
      { 
        _id: new ObjectId(id),
        userId: req.user._id
      },
      { $set: { ...update, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json(result)
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' })
    }

    const cartItems = req.app.locals.cartItems
    const result = await cartItems.deleteOne({
      _id: new ObjectId(id),
      userId: req.user._id
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json(result)
  } catch (error) {
    console.error('Error deleting cart item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/', authenticateToken, async (req, res) => {
  try {
    const cartItems = req.app.locals.cartItems
    const result = await cartItems.deleteMany({ userId: req.user._id })
    res.json(result)
  } catch (error) {
    console.error('Error deleting all cart items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router