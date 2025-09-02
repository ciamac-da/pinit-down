<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import EmailVerificationModal from '@/components/EmailVerificationModal.vue'

export default {
  components: {
    EmailVerificationModal
  },
  emits: ['close', 'switch-to-login', 'authenticated'],

  setup(props, { emit }) {
    const authStore = useAuthStore()

    const isLoading = ref(false)
    const error = ref('')
    const showVerificationModal = ref(false)
    const userEmail = ref('')

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

      if (formData.password.length < 6) {
        error.value = 'Password must be at least 6 characters'
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
            userEmail.value = formData.email
            showVerificationModal.value = true
          } else {
            // Old flow - direct authentication (shouldn't happen now)
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

    const closeVerificationModal = () => {
      showVerificationModal.value = false
      emit('close')
    }

    const onVerified = () => {
      showVerificationModal.value = false
      emit('authenticated')
    }

    return {
      isLoading,
      error,
      formData,
      handleSubmit,
      showVerificationModal,
      userEmail,
      closeVerificationModal,
      onVerified
    }
  }
}
</script>

<template>
  <div>
    <!-- Registration Form -->
    <div v-if="!showVerificationModal" class="auth-modal" @click.stop>
      <button class="close-btn" @click="$emit('close')">&times;</button>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
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
        
        <div class="form-group">
          <input
            v-model="formData.password"
            type="password"
            placeholder="Password (min. 6 characters)"
            required
            minlength="6"
            :disabled="isLoading"
            autocomplete="new-password"
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

    <!-- Email Verification Modal -->
    <EmailVerificationModal
      v-if="showVerificationModal"
      :email="userEmail"
      @close="closeVerificationModal"
      @verified="onVerified"
    />
  </div>
</template>