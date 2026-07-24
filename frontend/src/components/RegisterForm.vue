<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'

export default {
  emits: ['close', 'switch-to-login', 'authenticated'],

  setup(props, { emit }) {
    const authStore = useAuthStore()

    const isLoading = ref(false)
    const error = ref('')
    const successEmail = ref('')

    const showPassword = ref(false)

    const formData = reactive({
      name: '',
      email: '',
      password: ''
    })

    const handleSubmit = async () => {
      error.value = ''
      
      if (!formData.name || !formData.email || !formData.password) {
        error.value = 'Please fill in all fields'
        return
      }

      if (formData.password.length < 8) {
        error.value = 'Password must be at least 8 characters'
        return
      }
      if (!/[A-Z]/.test(formData.password)) {
        error.value = 'Password must contain at least one uppercase letter'
        return
      }
      if (!/[a-z]/.test(formData.password)) {
        error.value = 'Password must contain at least one lowercase letter'
        return
      }
      if (!/[0-9]/.test(formData.password)) {
        error.value = 'Password must contain at least one number'
        return
      }
      if (!/[^A-Za-z0-9]/.test(formData.password)) {
        error.value = 'Password must contain at least one special character'
        return
      }

      isLoading.value = true
      
      try {
        const result = await authStore.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })

        if (result.success) {
          if (result.requiresVerification) {
            successEmail.value = formData.email
          } else {
            emit('authenticated')
          }
        } else {
          error.value = result.error || 'Registration failed'
        }
      } catch (err) {
        error.value = 'Something went wrong. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    return {
      isLoading,
      error,
      successEmail,
      showPassword,
      formData,
      handleSubmit
    }
  }
}
</script>

<template>
  <div class="auth-modal" @click.stop>
    <button class="close-btn" @click="$emit('close')">&times;</button>

    <div v-if="successEmail" class="auth-form">
      <h2>Check your email</h2>
      <p class="auth-subtitle">
        We sent a verification link to <strong>{{ successEmail }}</strong>.
        Click the link in the email to activate your account.
      </p>
      <p class="auth-subtitle" style="font-size: 0.85rem; opacity: 0.8;">
        Can't find it? Check your spam or junk folder.
      </p>
      <button type="button" class="auth-button" @click="$emit('switch-to-login')">
        Go to Sign In
      </button>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="auth-form">
      <h2>Join Pinit Down</h2>
      <p class="auth-subtitle">Create your personal account</p>

      <div class="form-group">
        <input
          v-model="formData.name"
          type="text"
          placeholder="Name"
          required
          :disabled="isLoading"
          autocomplete="name"
        />
      </div>

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
          placeholder="Password (min. 6 characters)"
          required
          minlength="8"
          :disabled="isLoading"
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

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="auth-button"
      >
        <span v-if="isLoading">Creating Account...</span>
        <span v-else>Create Account</span>
      </button>

      <p class="auth-switch">
        Already have an account?
        <button
          type="button"
          @click="$emit('switch-to-login')"
          class="link-button"
        >
          Sign In
        </button>
      </p>
    </form>
  </div>
</template>