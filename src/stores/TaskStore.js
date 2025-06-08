import { defineStore } from 'pinia'

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: [],
    isLoading: false,
  }),

  getters: {
    favs() {
      return this.tasks.filter(t => t.isFav)
    },

    favCount() {
      return this.tasks.reduce((count, task) => task.isFav ? count + 1 : count, 0)
    },

    totalCount(state) {
      return state.tasks.length
    },
  },

  actions: {
    // Global delay helper
    async wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    async getTasks() {
      this.isLoading = true
      try {
        const res = await fetch("http://localhost:3000/tasks")
        const data = await res.json()

        await this.wait(800) // ⏱️ Delay
        this.tasks = data
      } catch (err) {
        console.error("Failed to fetch tasks:", err)
      } finally {
        this.isLoading = false
      }
    },

    async addTask(task) {
      this.isLoading = true
      try {
        const res = await fetch("http://localhost:3000/tasks", {
          method: 'POST',
          body: JSON.stringify(task),
          headers: { 'Content-Type': 'application/json' }
        })

        const result = await res.json()
        await this.wait(800) // ⏱️ Delay

        if (res.ok) {
          await this.getTasks()
        } else {
          console.error("Failed to add task:", result)
        }
      } catch (err) {
        console.error("Error adding task:", err)
      } finally {
        this.isLoading = false
      }
    },

    async toggleFav(id) {
      const task = this.tasks.find(t => t._id === id)
      if (!task) return

      task.isFav = !task.isFav
      this.isLoading = true

      try {
        const res = await fetch(`http://localhost:3000/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isFav: task.isFav }),
          headers: { 'Content-Type': 'application/json' }
        })

        await this.wait(800) // ⏱️ Delay

        if (!res.ok) {
          console.error("Failed to toggle fav status")
        }
      } catch (err) {
        console.error("Error toggling fav:", err)
      } finally {
        this.isLoading = false
      }
    },

    async deleteTask(id) {
      this.isLoading = true
      this.tasks = this.tasks.filter(t => t._id !== id)

      try {
        const res = await fetch(`http://localhost:3000/tasks/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })

        await this.wait(800) // ⏱️ Delay

        if (!res.ok) {
          console.error("Failed to delete task")
        }
      } catch (err) {
        console.error("Error deleting task:", err)
      } finally {
        this.isLoading = false
      }
    },

    async deleteAllTasks() {
      this.isLoading = true
      try {
        const res = await fetch("http://localhost:3000/tasks", {
          method: 'DELETE'
        })
    
        await this.wait(800) // optional delay
    
        if (res.ok) {
          this.tasks = []
        } else {
          console.error("Failed to delete all tasks")
        }
      } catch (err) {
        console.error("Error deleting tasks:", err)
      } finally {
        this.isLoading = false
      }
    }
    
  }
})
