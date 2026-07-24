<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'

export default {
  emits: ['close', 'switch-to-register', 'authenticated', 'switch-to-forgot-password'],

  setup(props, { emit }) {
    const authStore = useAuthStore()

    const isLoading = ref(false)
    const error = ref('')
    const unverifiedEmail = ref('')

    const showPassword = ref(false)

    const formData = reactive({
      email: '',
      password: ''
    })

    const handleSubmit = async () => {
      error.value = ''
      unverifiedEmail.value = ''
      
      if (!formData.email || !formData.password) {
        error.value = 'Please fill in all fields'
        return
      }

      isLoading.value = true
      
      try {
        const result = await authStore.login({
          email: formData.email,
          password: formData.password
        })

        if (result.success) {
          emit('authenticated')
        } else {
          if (result.error && result.error.includes('verify your email')) {
            unverifiedEmail.value = formData.email
          }
          error.value = result.error || 'Login failed'
        }
      } catch (err) {
        error.value = 'Something went wrong. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const resendVerification = async () => {
      if (!unverifiedEmail.value) return
      isLoading.value = true
      const result = await authStore.resendVerification(unverifiedEmail.value)
      isLoading.value = false
      if (result.success) {
        error.value = ''
        unverifiedEmail.value = ''
        // Show brief confirmation in the error slot
        error.value = 'Verification email resent! Check your inbox.'
      } else {
        error.value = result.error || 'Failed to resend verification email.'
      }
    }

    return {
      isLoading,
      error,
      unverifiedEmail,
      showPassword,
      formData,
      handleSubmit,
      resendVerification
    }
  }
}
</script>

<template>
  <div class="auth-modal" @click.stop>
    <button class="close-btn" @click="$emit('close')">&times;</button>
    <form @submit.prevent="handleSubmit" class="auth-form">
      <h2>Welcome Back</h2>
      <p class="auth-subtitle">Sign in to your Pinit Down account</p>
      <div class="form-group">
        <input
          v-model="formData.email"
          type="email"
          placeholder="Email Address"
          required
          :disabled="isLoading"
          autocomplete="email"
        />
      </div>
      <div class="form-group password-group">
        <input
          v-model="formData.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Password"
          required
          :disabled="isLoading"
          autocomplete="current-password"
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
      <div v-if="error" class="error-message">
        {{ error }}
        <button
          v-if="unverifiedEmail"
          type="button"
          class="link-button"
          :disabled="isLoading"
          @click="resendVerification"
        >
          Resend verification email
        </button>
      </div>
      <button
        type="submit"
        :disabled="isLoading"
        class="auth-button"
      >
        <span v-if="isLoading">Signing In...</span>
        <span v-else>Sign In</span>
      </button>
      <div class="forgot-password">
        <button
          type="button"
          @click="$emit('switch-to-forgot-password')"
          class="link-button"
        >
          Forgot your password?
        </button>
      </div>
      <p class="auth-switch">
        Don't have an account?
        <button
          type="button"
          @click="$emit('switch-to-register')"
          class="link-button"
        >
          Create Account
        </button>
      </p>
    </form>
  </div>
</template>