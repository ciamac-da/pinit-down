<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import EmailVerificationModal from '@/components/EmailVerificationModal.vue'

export default {
  components: {
    EmailVerificationModal
  },
  emits: ['close', 'switch-to-register', 'authenticated', 'switch-to-forgot-password'],

  setup(props, { emit }) {
    const authStore = useAuthStore()

    const isLoading = ref(false)
    const error = ref('')
    const showVerificationModal = ref(false)
    const verificationEmail = ref('')

    const formData = reactive({
      email: '',
      password: ''
    })

    const handleSubmit = async () => {
      error.value = ''
      
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
        } else if (result.requiresVerification) {
          verificationEmail.value = result.email || formData.email
          showVerificationModal.value = true
        } else {
          error.value = result.error || 'Login failed'
        }
      } catch (err) {
        error.value = 'Something went wrong. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const closeVerificationModal = () => {
      showVerificationModal.value = false
      verificationEmail.value = ''
    }

    const onVerified = () => {
      showVerificationModal.value = false
      // User needs to try logging in again after verification
      error.value = ''
      verificationEmail.value = ''
    }

    return {
      isLoading,
      error,
      formData,
      handleSubmit,
      showVerificationModal,
      verificationEmail,
      closeVerificationModal,
      onVerified
    }
  }
}
</script>

<template>
  <div>
    <!-- Login Form -->
    <div v-if="!showVerificationModal" class="auth-modal" @click.stop>
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
        <div class="form-group">
          <input
            v-model="formData.password"
            type="password"
            placeholder="Password"
            required
            :disabled="isLoading"
            autocomplete="current-password"
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

    <!-- Email Verification Modal -->
    <EmailVerificationModal
      v-if="showVerificationModal"
      :email="verificationEmail"
      @close="closeVerificationModal"
      @verified="onVerified"
    />
  </div>
</template>