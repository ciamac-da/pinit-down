import { ObjectId } from 'mongodb'

export class User {
  constructor(userData) {
    this.email = userData.email
    this.password = userData.password
    this.name = userData.name
    this.resetPasswordToken = userData.resetPasswordToken || null
    this.resetPasswordExpires = userData.resetPasswordExpires || null
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  async save(db) {
    const users = db.collection('users')
    const result = await users.insertOne(this)
    return result
  }

  static async findByEmail(db, email) {
    const users = db.collection('users')
    return await users.findOne({ email })
  }

  static async findById(db, id) {
    const users = db.collection('users')
    return await users.findOne({ _id: new ObjectId(id) })
  }

  static async findByResetToken(db, token) {
    const users = db.collection('users')
    return await users.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    })
  }

  static async updateResetToken(db, email, token, expires) {
    const users = db.collection('users')
    return await users.updateOne(
      { email },
      { 
        $set: { 
          resetPasswordToken: token,
          resetPasswordExpires: expires,
          updatedAt: new Date()
        }
      }
    )
  }

  static async updatePassword(db, userId, hashedPassword) {
    const users = db.collection('users')
    return await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: ""
        }
      }
    )
  }
}