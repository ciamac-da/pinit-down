<script>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'

export default {
  emits: ['close', 'switch-to-login'],

  setup(props, { emit }) {
    const authStore = useAuthStore()

    const email = ref('')
    const isLoading = ref(false)
    const error = ref('')
    const success = ref(false)
    const successMessage = ref('')

    const handleSubmit = async () => {
      error.value = ''
      
      if (!email.value) {
        error.value = 'Please enter your email address'
        return
      }

      isLoading.value = true
      
      try {
        const result = await authStore.forgotPassword(email.value)
        
        if (result.success) {
          successMessage.value = result.message || 'Password reset email sent successfully.'
          success.value = true
        } else {
          error.value = result.error || 'Failed to send reset email'
        }
      } catch (err) {
        error.value = 'Something went wrong. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const handleBackToLogin = () => {
      emit('switch-to-login')
    }

    return {
      email,
      isLoading,
      error,
      success,
      successMessage,
      handleSubmit,
      handleBackToLogin
    }
  }
}
</script>

<template>
  <div class="auth-modal" @click.stop>
    <button class="close-btn" @click="$emit('close')">&times;</button>
    
    <div v-if="!success" class="auth-form">
      <h2>Reset Password</h2>
      <p class="auth-subtitle">Enter your email to receive a password reset link</p>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <input
            v-model="email"
            type="email"
            placeholder="Email Address"
            required
            :disabled="isLoading"
            autocomplete="email"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button
          type="submit"
          :disabled="isLoading"
          class="auth-button"
        >
          <span v-if="isLoading">Sending...</span>
          <span v-else>Send Reset Link</span>
        </button>
      </form>
      
      <p class="auth-switch">
        Remember your password?
        <button
          type="button"
          @click="handleBackToLogin"
          class="link-button"
        >
          Back to Sign In
        </button>
      </p>
    </div>
    
    <div v-else class="auth-form success-state">
      <div class="success-icon">✉️</div>
      <h2>Check Your Email</h2>
      <p class="auth-subtitle">
        {{ successMessage }}
      </p>
      <p class="success-message">
        Please check your inbox (including spam and promotions folders) and follow the instructions to reset your password.
        The link will expire in 1 hour.
      </p>
      <button
        type="button"
        @click="handleBackToLogin"
        class="auth-button"
      >
        Back to Sign In
      </button>
    </div>
  </div>
</template>

<style scoped>
.success-state {
  text-align: center;
  padding: 2rem;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-message {
  color: #f2f2f2;
  margin: 1.5rem 0;
  line-height: 1.6;
  font-size: 0.95rem;
}
</style>