<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()

    const isLoading = ref(true)
    const isValidToken = ref(false)
    const isResetting = ref(false)
    const error = ref('')
    const success = ref(false)
    const user = ref(null)
    const password = ref('')
    const confirmPassword = ref('')
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)

    const verifyToken = async () => {
      const token = route.query.token

      if (!token) {
        error.value = 'Invalid reset link'
        isLoading.value = false
        return
      }

      try {
        const result = await authStore.verifyResetToken(token)

        if (result.success) {
          isValidToken.value = true
          user.value = result.user
        } else {
          error.value = result.error || 'Invalid or expired reset token'
        }
      } catch (err) {
        error.value = 'Something went wrong. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const handleSubmit = async () => {
      error.value = ''

      if (!password.value) {
        error.value = 'Please enter a new password'
        return
      }

      if (password.value.length < 8) {
        error.value = 'Password must be at least 8 characters'
        return
      }
      if (!/[A-Z]/.test(password.value)) {
        error.value = 'Password must contain at least one uppercase letter'
        return
      }
      if (!/[a-z]/.test(password.value)) {
        error.value = 'Password must contain at least one lowercase letter'
        return
      }
      if (!/[0-9]/.test(password.value)) {
        error.value = 'Password must contain at least one number'
        return
      }
      if (!/[^A-Za-z0-9]/.test(password.value)) {
        error.value = 'Password must contain at least one special character'
        return
      }

      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match'
        return
      }

      isResetting.value = true

      try {
        const token = route.query.token
        const result = await authStore.resetPassword(token, password.value)

        if (result.success) {
          success.value = true
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            router.push('/')
          }, 3000)
        } else {
          error.value = result.error || 'Failed to reset password'
        }
      } catch (err) {
        error.value = 'Something went wrong. Please try again.'
      } finally {
        isResetting.value = false
      }
    }

    const goHome = () => {
      router.push('/')
    }

    onMounted(() => {
      verifyToken()
    })

    return {
      isLoading,
      isValidToken,
      isResetting,
      error,
      success,
      user,
      password,
      confirmPassword,
      showPassword,
      showConfirmPassword,
      handleSubmit,
      goHome
    }
  }
}
</script>

<template>
  <div class="reset-password-page">
    <div class="reset-container">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <h2>Verifying reset link...</h2>
        <p>Please wait while we verify your password reset token.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="success-state">
        <div class="success-icon">✅</div>
        <h2>Password Reset Successfully!</h2>
        <p class="success-message">Your password has been updated successfully.</p>
        <p>You will be redirected to the home page in a few seconds, or you can click the button below to sign in.</p>
        <button @click="goHome" class="home-button">
          Go to Home Page
        </button>
      </div>

      <!-- Reset Form -->
      <div v-else-if="isValidToken" class="reset-form-container">
        <div class="form-header">
          <h2>Reset Your Password</h2>
          <p>Hi {{ user?.name }}, please enter your new password below.</p>
        </div>

        <form @submit.prevent="handleSubmit" class="reset-form">
          <div class="form-group password-group">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="New Password (min. 8 characters)"
              required
              minlength="8"
              :disabled="isResetting"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>

          <div class="form-group password-group">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm New Password"
              required
              minlength="8"
              :disabled="isResetting"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
              tabindex="-1"
            >
              <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isResetting"
            class="reset-button"
          >
            <span v-if="isResetting">Resetting Password...</span>
            <span v-else>Reset Password</span>
          </button>
        </form>

        <div class="form-footer">
          <button @click="goHome" class="link-button">
            Back to Home Page
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="error-state">
        <div class="error-icon">❌</div>
        <h2>Invalid Reset Link</h2>
        <p class="error-message">{{ error }}</p>
        <p>This password reset link may have expired or is invalid. Please request a new one.</p>
        <button @click="goHome" class="home-button">
          Go to Home Page
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/abstracts/color";

.reset-password-page {
  min-height: 100vh;
  background: color.$gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.reset-container {
  background: rgba(color.$white, 0.95);
  border-radius: 1rem;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(color.$dark, 0.15);
}

.loading-state, .success-state, .error-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.reset-form-container {
  text-align: center;
}

.form-header {
  margin-bottom: 2rem;
}

.form-header h2 {
  color: color.$dark-medium;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.form-header p {
  color: color.$dark50;
  font-size: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid color.$light;
  border-top: 4px solid color.$blue-violet;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-icon, .error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h2 {
  color: color.$dark-medium;
  margin: 1rem 0;
  font-size: 1.8rem;
}

p {
  color: color.$dark50;
  line-height: 1.6;
  margin: 0.5rem 0;
}

.success-message {
  color: color.$success;
  font-weight: 600;
}

.error-message {
  color: color.$danger-text;
  font-weight: 600;
  background: rgba(color.$danger-text, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(color.$danger-text, 0.3);
  margin: 1rem 0;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  text-align: left;
}

.form-group.password-group {
  position: relative;
}

.form-group.password-group input {
  padding-right: 2.5rem;
}

.toggle-password {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: color.$dark50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 50%;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: color.$dark-medium;
}

.form-group input {
  width: 100%;
  padding: 1rem;
  border: 2px solid color.$border-medium;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: color.$blue-violet;
  box-shadow: 0 0 0 3px rgba(color.$blue-violet, 0.1);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-button {
  background: color.$gradient;
  color: color.$white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.reset-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(color.$blue-violet, 0.3);
}

.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.home-button {
  background: color.$gradient;
  color: color.$white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
}

.home-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(color.$blue-violet, 0.3);
}

.form-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid color.$border-medium;
}

.link-button {
  background: none;
  border: none;
  color: color.$blue-violet;
  cursor: pointer;
  text-decoration: underline;
  font-size: 1rem;
}

.link-button:hover {
  color: color.$blue-violet-deeper;
}
</style>