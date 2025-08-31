import { defineStore } from 'pinia'
import { useAuthStore } from './AuthStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useCartStore = defineStore('cartStore', {
  state: () => ({
    cartItems: [],
    isLoading: false,
  }),

  getters: {
    favs() {
      return (this.cartItems || []).filter(t => t.isFav)
    },
    favCount() {
      return (this.cartItems || []).reduce((count, item) => item.isFav ? count + 1 : count, 0)
    },
    totalCount(state) {
      return (state.cartItems || []).length
    },
  },

  actions: {
    async wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    async getCartItems() {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        this.cartItems = []
        return
      }

      this.isLoading = true
      try {
        const res = await fetch(`${API_BASE_URL}/cart-items`, {
          headers: authStore.getAuthHeaders()
        })
        
        if (!res.ok) {
          if (res.status === 401) {
            // Token expired or invalid
            authStore.logout()
            return
          }
          console.error('API Error:', res.status, res.statusText)
          this.cartItems = []
          return
        }

        const data = await res.json()
        await this.wait(800)
        this.cartItems = data
      } catch (err) {
        console.error("Failed to fetch cart items:", err)
        this.cartItems = []
      } finally {
        this.isLoading = false
      }
    },

    async addCartItem(cartItem) {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
        return
      }

      this.isLoading = true
      try {
        const res = await fetch(`${API_BASE_URL}/cart-items`, {
          method: 'POST',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify(cartItem)
        })

        if (!res.ok) {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          console.error('API Error:', res.status, res.statusText)
          return
        }

        await this.wait(800)
        await this.getCartItems()
      } catch (err) {
        console.error("Error adding cart item:", err)
      } finally {
        this.isLoading = false
      }
    },

    async toggleFav(id) {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
        return
      }

      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return

      cartItem.isFav = !cartItem.isFav
      this.isLoading = true

      try {
        const res = await fetch(`${API_BASE_URL}/cart-items/${id}`, {
          method: 'PATCH',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({ isFav: cartItem.isFav })
        })

        await this.wait(800)

        if (!res.ok) {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          console.error("Failed to toggle fav status")
          // Revert the change
          cartItem.isFav = !cartItem.isFav
        }
      } catch (err) {
        console.error("Error toggling fav:", err)
        // Revert the change
        cartItem.isFav = !cartItem.isFav
      } finally {
        this.isLoading = false
      }
    },

    async deleteCartItem(id) {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
        return
      }

      this.isLoading = true
      
      // Optimistically remove from UI
      const originalItems = [...this.cartItems]
      this.cartItems = this.cartItems.filter(t => t._id !== id)

      try {
        const res = await fetch(`${API_BASE_URL}/cart-items/${id}`, {
          method: 'DELETE',
          headers: authStore.getAuthHeaders()
        })

        await this.wait(800)

        if (!res.ok) {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          console.error("Failed to delete cart item")
          // Revert the change
          this.cartItems = originalItems
        }
      } catch (err) {
        console.error("Error deleting cart item:", err)
        // Revert the change
        this.cartItems = originalItems
      } finally {
        this.isLoading = false
      }
    },

    async deleteAllCartItems() {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
        return
      }

      if (!confirm('Are you sure you want to delete all items?')) {
        return
      }

      this.isLoading = true
      
      // Store original items in case we need to revert
      const originalItems = [...this.cartItems]
      
      try {
        const res = await fetch(`${API_BASE_URL}/cart-items`, {
          method: 'DELETE',
          headers: authStore.getAuthHeaders()
        })

        await this.wait(800)

        if (res.ok) {
          this.cartItems = []
        } else {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          console.error("Failed to delete all cart items")
          this.cartItems = originalItems
        }
      } catch (err) {
        console.error("Error deleting cart items:", err)
        this.cartItems = originalItems
      } finally {
        this.isLoading = false
      }
    },

    // Clear cart items when user logs out
    clearCart() {
      this.cartItems = []
    }
  }
})