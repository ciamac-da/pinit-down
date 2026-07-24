<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const isLoading = ref(true)
    const isVerified = ref(false)
    const error = ref('')

    onMounted(async () => {
      const token = route.query.token

      if (!token) {
        isLoading.value = false
        error.value = 'No verification token found in the link.'
        return
      }

      const result = await authStore.verifyEmail(token)
      isLoading.value = false

      if (result.success) {
        isVerified.value = true
        setTimeout(() => router.push('/'), 3000)
      } else {
        error.value = result.error || 'Verification failed.'
      }
    })

    return {
      isLoading,
      isVerified,
      error,
      goHome: () => router.push('/')
    }
  }
}
</script>

<template>
  <div class="verification-page">
    <div class="verification-container">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <h2>Verifying your email...</h2>
        <p>Please wait while we verify your account.</p>
      </div>

      <div v-else-if="isVerified" class="success-state">
        <div class="success-icon">✅</div>
        <h2>Email Verified!</h2>
        <p class="success-message">Your account is now active. You can sign in.</p>
        <p>Redirecting to home in a few seconds...</p>
        <button @click="goHome" class="home-button">
          Go to Home Page
        </button>
      </div>

      <div v-else class="error-state">
        <div class="error-icon">❌</div>
        <h2>Verification Failed</h2>
        <p class="error-message">{{ error }}</p>
        <p>This verification link may have expired or is invalid.</p>
        <button @click="goHome" class="home-button">
          Go to Home Page
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/abstracts/color";

.verification-page {
  min-height: 100vh;
  background: color.$gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.verification-container {
  background: rgba(color.$white, 0.95);
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(color.$dark, 0.15);
}

.loading-state, .success-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
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
</style>