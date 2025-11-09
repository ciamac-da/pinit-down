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

    // Register new user (email verification disabled)
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

        if (data.token && data.user) {
          this.token = data.token
          this.user = data.user
          this.isAuthenticated = true

          localStorage.setItem('pinit_token', data.token)
          localStorage.setItem('pinit_user', JSON.stringify(data.user))
        }

        return {
          success: true,
          message: data.message
        }
      } catch (error) {
        console.error('Registration error:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Verify email address
    async verifyEmail(token) {
      this.isLoading = true
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Email verification failed')
        }

        return { success: true, message: data.message }
      } catch (error) {
        console.error('Email verification error:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Resend verification email
    async resendVerification(email) {
      this.isLoading = true
      try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to resend verification email')
        }

        return { success: true, message: data.message }
      } catch (error) {
        console.error('Resend verification error:', error)
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

    // Request password reset
    async forgotPassword(email) {
      this.isLoading = true
      try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send reset email')
        }

        return { success: true, message: data.message }
      } catch (error) {
        console.error('Forgot password error:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Verify reset token
    async verifyResetToken(token) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Invalid reset token')
        }

        return { success: true, user: data.user }
      } catch (error) {
        console.error('Verify reset token error:', error)
        return { success: false, error: error.message }
      }
    },

    // Reset password
    async resetPassword(token, password) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to reset password')
        }

        return { success: true }
      } catch (error) {
        console.error('Reset password error:', error)
        return { success: false, error: error.message }
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