<script>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'

export default {
  props: {
    email: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'verified'],

  setup(props, { emit }) {
    const authStore = useAuthStore()

    const isResending = ref(false)
    const message = ref('')
    const error = ref('')

    const resendVerification = async () => {
      error.value = ''
      message.value = ''
      isResending.value = true
      
      try {
        const result = await authStore.resendVerification(props.email)
        
        if (result.success) {
          message.value = result.message
        } else {
          error.value = result.error || 'Failed to resend verification email'
        }
      } catch (err) {
        error.value = 'Something went wrong. Please try again.'
      } finally {
        isResending.value = false
      }
    }

    return {
      isResending,
      message,
      error,
      resendVerification
    }
  }
}
</script>

<template>
  <div class="auth-modal" @click.stop>
    <button class="close-btn" @click="$emit('close')">&times;</button>
    
    <div class="auth-form verification-form">
      <div class="verification-icon">📧</div>
      <h2>Check Your Email</h2>
      <p class="auth-subtitle">
        We've sent a verification link to <strong>{{ email }}</strong>
      </p>
      <p class="verification-message">
        Please check your inbox and click the verification link to activate your account.
        The link will expire in 24 hours.
      </p>
      <p class="verification-message" style="font-size: 0.85rem; opacity: 0.8;">
        Can't find it? Check your spam or junk folder.
      </p>
      
      <div v-if="message" class="success-message">
        {{ message }}
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <button
        type="button"
        @click="resendVerification"
        :disabled="isResending"
        class="auth-button resend-button"
      >
        <span v-if="isResending">Sending...</span>
        <span v-else>Resend Verification Email</span>
      </button>
      
      <p class="auth-switch">
        Already verified?
        <button
          type="button"
          @click="$emit('close')"
          class="link-button"
        >
          Try logging in
        </button>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/abstracts/color";

.verification-form {
  text-align: center;
  padding: 2rem;
}

.verification-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.verification-message {
  color: color.$light;
  margin: 1.5rem 0;
  line-height: 1.6;
  font-size: 0.95rem;
}

.resend-button {
  margin: 1.5rem 0;
  background-color: color.$gold !important;
}

.resend-button:hover:not(:disabled) {
  background-color: color.$gold-hover !important;
}

.success-message {
  background: rgba(color.$success-alt, 0.2);
  color: color.$success-alt;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid color.$success-alt;
  font-weight: 500;
}
</style>