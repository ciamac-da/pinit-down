import { defineStore } from 'pinia'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
  }),

  getters: {
    userName: (state) => state.user?.name || '',
    userEmail: (state) => state.user?.email || '',
  },

  actions: {
    // Initialize auth from localStorage
    initAuth() {
      const token = localStorage.getItem('pinit_token')
      const user = localStorage.getItem('pinit_user')
      
      if (token && user) {
        try {
          this.token = token
          this.user = JSON.parse(user)
          this.isAuthenticated = true
        } catch (error) {
          console.error('Error parsing user data:', error)
          this.logout()
        }
      }
    },

    // Register new user
    async register(userData) {
      this.isLoading = true
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed')
        }

        // Store auth data
        this.token = data.token
        this.user = data.user
        this.isAuthenticated = true
        
        localStorage.setItem('pinit_token', data.token)
        localStorage.setItem('pinit_user', JSON.stringify(data.user))

        return { success: true }
      } catch (error) {
        console.error('Registration error:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Login user
    async login(credentials) {
      this.isLoading = true
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Login failed')
        }

        // Store auth data
        this.token = data.token
        this.user = data.user
        this.isAuthenticated = true
        
        localStorage.setItem('pinit_token', data.token)
        localStorage.setItem('pinit_user', JSON.stringify(data.user))

        return { success: true }
      } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Logout user
    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      
      localStorage.removeItem('pinit_token')
      localStorage.removeItem('pinit_user')
    },

    // Get auth headers for API calls
    getAuthHeaders() {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    }
  },
})