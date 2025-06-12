import { defineStore } from 'pinia'

export const useCartStore = defineStore('cartStore', {
  state: () => ({
    cartItems: [],
    isLoading: false,
  }),

  getters: {
    favs() {
      return this.cartItems.filter(t => t.isFav)
    },

    favCount() {
      return this.cartItems.reduce((count, item) => item.isFav ? count + 1 : count, 0)
    },

    totalCount(state) {
      return state.cartItems.length
    },
  },

  actions: {
    // Global delay helper
    async wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    async getCartItems() {
      this.isLoading = true
      try {
        const res = await fetch("http://localhost:3000/cart-items")
        const data = await res.json()

        await this.wait(800) // ⏱️ Delay
        this.cartItems = data
      } catch (err) {
        console.error("Failed to fetch cart items:", err)
      } finally {
        this.isLoading = false
      }
    },

    async addCartItem(cartItem) {
      this.isLoading = true
      try {
        const res = await fetch("http://localhost:3000/cart-items", {
          method: 'POST',
          body: JSON.stringify(cartItem),
          headers: { 'Content-Type': 'application/json' }
        })

        const result = await res.json()
        await this.wait(800) // ⏱️ Delay

        if (res.ok) {
          await this.getCartItems()
        } else {
          console.error("Failed to add cart item:", result)
        }
      } catch (err) {
        console.error("Error adding cart item:", err)
      } finally {
        this.isLoading = false
      }
    },

    async toggleFav(id) {
      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return

      cartItem.isFav = !cartItem.isFav
      this.isLoading = true

      try {
        const res = await fetch(`http://localhost:3000/cart-items/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isFav: cartItem.isFav }),
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

    async deleteCartItem(id) {
      this.isLoading = true
      this.cartItems = this.cartItems.filter(t => t._id !== id)

      try {
        const res = await fetch(`http://localhost:3000/cart-items/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })

        await this.wait(800) // ⏱️ Delay

        if (!res.ok) {
          console.error("Failed to delete cart item")
        }
      } catch (err) {
        console.error("Error deleting cart item:", err)
      } finally {
        this.isLoading = false
      }
    },

    async deleteAllCartItems() {
      this.isLoading = true
      try {
        const res = await fetch("http://localhost:3000/cart-items", {
          method: 'DELETE'
        })
    
        await this.wait(800) // optional delay
    
        if (res.ok) {
          this.cartItems = []
        } else {
          console.error("Failed to delete all cart items")
        }
      } catch (err) {
        console.error("Error deleting cart items:", err)
      } finally {
        this.isLoading = false
      }
    }
    
  }
})
