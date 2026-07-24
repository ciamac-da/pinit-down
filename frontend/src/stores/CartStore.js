import { defineStore } from 'pinia'
import { useAuthStore } from './AuthStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useCartStore = defineStore('cartStore', {
  state: () => ({
    cartItems: [],
    isLoading: false,
    customGroups: JSON.parse(localStorage.getItem('pinit_custom_groups') || '[]'),
    groupOrder: JSON.parse(localStorage.getItem('pinit_group_order') || '[]'),
  }),

  getters: {
    savedItems() {
      return (this.cartItems || []).filter(t => t.isSaved)
    },
    savedCount() {
      return (this.cartItems || []).reduce((count, item) => item.isSaved ? count + 1 : count, 0)
    },
    totalCount(state) {
      return (state.cartItems || []).filter(t => !t.isSaved).length
    },
    groups() {
      const fromItems = (this.cartItems || []).filter(i => !i.isSaved).map(item => item.group || 'General')
      const all = [...new Set([...this.customGroups, ...fromItems])]
      // Sort by stored order, then alphabetically for any new groups
      const order = this.groupOrder
      return all.sort((a, b) => {
        const ia = order.indexOf(a)
        const ib = order.indexOf(b)
        if (ia === -1 && ib === -1) return a.localeCompare(b)
        if (ia === -1) return 1
        if (ib === -1) return 1
        return ia - ib
      })
    },
    itemsByGroup() {
      const grouped = {}
      const sorted = [...(this.cartItems || [])].filter(i => !i.isSaved).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      for (const item of sorted) {
        const g = item.group || 'General'
        if (!grouped[g]) grouped[g] = []
        grouped[g].push(item)
      }
      return grouped
    },
    savedByGroup() {
      const grouped = {}
      const sorted = [...(this.cartItems || [])].filter(i => i.isSaved).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      for (const item of sorted) {
        const g = item.group || 'General'
        if (!grouped[g]) grouped[g] = []
        grouped[g].push(item)
      }
      return grouped
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
          body: JSON.stringify({
            ...cartItem,
            group: cartItem.group || 'General',
            order: cartItem.order ?? Date.now()
          })
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

    async saveItem(id) {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
        return
      }

      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return

      // Create a copy marked as saved
      try {
        const res = await fetch(`${API_BASE_URL}/cart-items`, {
          method: 'POST',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({
            title: cartItem.title,
            group: cartItem.group || 'General',
            isSaved: true,
            savedFrom: id,
            isPurchased: false,
            order: Date.now()
          })
        })

        if (!res.ok) {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          console.error("Failed to save item")
          return
        }

        const newItem = await res.json()
        this.cartItems.push(newItem)
      } catch (err) {
        console.error("Error saving item:", err)
      }
    },

    async editCartItem(id, { title, group }) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return

      const oldTitle = cartItem.title
      const oldGroup = cartItem.group

      if (title !== undefined) cartItem.title = title
      if (group !== undefined) cartItem.group = group

      try {
        const body = {}
        if (title !== undefined) body.title = title
        if (group !== undefined) body.group = group

        const res = await fetch(`${API_BASE_URL}/cart-items/${id}`, {
          method: 'PATCH',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify(body)
        })

        if (!res.ok) {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          cartItem.title = oldTitle
          cartItem.group = oldGroup
        }
      } catch (err) {
        console.error("Error editing cart item:", err)
        cartItem.title = oldTitle
        cartItem.group = oldGroup
      }
    },

    async togglePurchased(id) {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
        return
      }

      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return

      cartItem.isPurchased = !cartItem.isPurchased

      try {
        const res = await fetch(`${API_BASE_URL}/cart-items/${id}`, {
          method: 'PATCH',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({ isPurchased: cartItem.isPurchased })
        })

        if (!res.ok) {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          console.error("Failed to toggle purchased status")
          cartItem.isPurchased = !cartItem.isPurchased
        }
      } catch (err) {
        console.error("Error toggling purchased:", err)
        cartItem.isPurchased = !cartItem.isPurchased
      }
    },

    async deleteCartItem(id) {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
        return
      }

      // Optimistically remove from UI
      const originalItems = [...this.cartItems]
      this.cartItems = this.cartItems.filter(t => t._id !== id)

      try {
        const res = await fetch(`${API_BASE_URL}/cart-items/${id}`, {
          method: 'DELETE',
          headers: authStore.getAuthHeaders()
        })

        if (!res.ok) {
          if (res.status === 401) {
            authStore.logout()
            return
          }
          console.error("Failed to delete cart item")
          this.cartItems = originalItems
        }
      } catch (err) {
        console.error("Error deleting cart item:", err)
        this.cartItems = originalItems
      }
    },

    async deleteAllCartItems() {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        console.error('User not authenticated')
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
          this.cartItems = this.cartItems.filter(i => i.isSaved)
          this.customGroups = []
          this.groupOrder = []
          localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))
          localStorage.setItem('pinit_group_order', JSON.stringify(this.groupOrder))
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

    addCustomGroup(name) {
      const trimmed = name.trim()
      if (trimmed && !this.customGroups.includes(trimmed)) {
        this.customGroups.push(trimmed)
        localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))
      }
    },

    async renameGroup(oldName, newName) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return
      const trimmed = newName.trim()
      if (!trimmed || trimmed === oldName) return

      // Update all items in this group locally
      this.cartItems.forEach(item => {
        if ((item.group || 'General') === oldName) {
          item.group = trimmed
        }
      })

      // Update customGroups
      const idx = this.customGroups.indexOf(oldName)
      if (idx !== -1) {
        this.customGroups[idx] = trimmed
      } else {
        this.customGroups.push(trimmed)
      }
      localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))

      // Update groupOrder
      const orderIdx = this.groupOrder.indexOf(oldName)
      if (orderIdx !== -1) {
        this.groupOrder[orderIdx] = trimmed
      }
      localStorage.setItem('pinit_group_order', JSON.stringify(this.groupOrder))

      // Persist group change for each item in DB
      const itemsToUpdate = this.cartItems.filter(i => i.group === trimmed)
      try {
        await Promise.all(itemsToUpdate.map(item =>
          fetch(`${API_BASE_URL}/cart-items/${item._id}`, {
            method: 'PATCH',
            headers: authStore.getAuthHeaders(),
            body: JSON.stringify({ group: trimmed })
          })
        ))
      } catch (err) {
        console.error('Error renaming group:', err)
      }
    },

    async deleteSavedGroup(groupName) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      const toDelete = this.cartItems.filter(i => i.isSaved && (i.group || 'General') === groupName)
      this.cartItems = this.cartItems.filter(i => !(i.isSaved && (i.group || 'General') === groupName))

      try {
        await Promise.all(toDelete.map(item =>
          fetch(`${API_BASE_URL}/cart-items/${item._id}`, {
            method: 'DELETE',
            headers: authStore.getAuthHeaders()
          })
        ))
      } catch (err) {
        console.error('Error deleting saved group items:', err)
      }
    },

    async deleteGroup(groupName) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      // Remove non-saved items in this group from local state immediately
      const toDelete = this.cartItems.filter(i => !i.isSaved && (i.group || 'General') === groupName)
      this.cartItems = this.cartItems.filter(i => i.isSaved || (i.group || 'General') !== groupName)

      // Remove from customGroups
      this.customGroups = this.customGroups.filter(g => g !== groupName)
      localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))

      // Delete each item from DB
      try {
        await Promise.all(toDelete.map(item =>
          fetch(`${API_BASE_URL}/cart-items/${item._id}`, {
            method: 'DELETE',
            headers: authStore.getAuthHeaders()
          })
        ))
      } catch (err) {
        console.error('Error deleting group items:', err)
      }
    },

    async reorderItems(updates) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return
      // Update local state immediately
      updates.forEach(({ id, order }) => {
        const item = this.cartItems.find(i => i._id === id)
        if (item) item.order = order
      })
      try {
        await fetch(`${API_BASE_URL}/cart-items/reorder`, {
          method: 'POST',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({ items: updates })
        })
      } catch (err) {
        console.error('Error reordering items:', err)
      }
    },

    async moveItemToGroup(itemId, newGroup) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      const item = this.cartItems.find(i => i._id === itemId)
      if (!item) return

      const oldGroup = item.group || 'General'
      if (oldGroup === newGroup) return

      // Update locally
      item.group = newGroup

      // Persist to server
      try {
        await fetch(`${API_BASE_URL}/cart-items/${itemId}`, {
          method: 'PATCH',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({ group: newGroup })
        })
      } catch (err) {
        console.error('Error moving item to group:', err)
        item.group = oldGroup
      }
    },

    reorderGroups(orderedGroups) {
      this.groupOrder = orderedGroups
      localStorage.setItem('pinit_group_order', JSON.stringify(orderedGroups))
    },

    // Clear cart items when user logs out
    clearCart() {
      this.cartItems = []
      this.customGroups = []
      this.groupOrder = []
      localStorage.removeItem('pinit_custom_groups')
      localStorage.removeItem('pinit_group_order')
    }
  }
})