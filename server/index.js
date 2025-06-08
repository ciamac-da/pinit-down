import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
}

dotenv.config({ path: '.env.local' })


const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URI)
const dbName = 'pinit-down'
let tasks

async function startServer() {
  await client.connect()
  const db = client.db(dbName)
  tasks = db.collection('tasks')

  app.listen(PORT, () => {
    console.log(`✅ API is live at http://localhost:${PORT}`)
  })
}

startServer()

// GET all tasks
app.get('/tasks', async (req, res) => {
  const all = await tasks.find().toArray()
  res.json(all)
})

// POST new task
app.post('/tasks', async (req, res) => {
  const task = req.body
  const result = await tasks.insertOne(task)
  res.json(result)
})

// PATCH update task
app.patch('/tasks/:id', async (req, res) => {
    const { id } = req.params
    const update = req.body
  
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ID format' })
    }
  
    const result = await tasks.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    )
    res.json(result)
  })
  

// DELETE task
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params
  
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ID format' })
    }
  
    const result = await tasks.deleteOne({ _id: new ObjectId(id) })
    res.json(result)
  })

// DELETE all tasks
app.delete('/tasks', async (req, res) => {
    try {
      const result = await tasks.deleteMany({})
      res.json(result)
    } catch (err) {
      console.error('Failed to delete all tasks:', err)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  })
  