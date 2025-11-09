<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()

    const isLoading = ref(false)
    const isVerified = ref(true)
    const error = ref('')
    const message = ref('Email verification is no longer required. You can sign in with your credentials immediately after registering.')

    onMounted(() => {
      // Redirect to home page after a short delay to keep prior UX similar
      setTimeout(() => {
        router.push('/')
      }, 3000)
    })

    const goHome = () => {
      router.push('/')
    }

    return {
      isLoading,
      isVerified,
      error,
      message,
      goHome
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
        <h2>Email Verification Not Required</h2>
        <p class="success-message">{{ message }}</p>
        <p>You will be redirected to the home page in a few seconds, or you can click the button below.</p>
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

<style scoped>
.verification-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #8a2be2 0%, #ecb732 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.verification-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
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
  border: 4px solid #f3f3f3;
  border-top: 4px solid #8a2be2;
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
  color: #333;
  margin: 1rem 0;
  font-size: 1.8rem;
}

p {
  color: #666;
  line-height: 1.6;
  margin: 0.5rem 0;
}

.success-message {
  color: #2e7d32;
  font-weight: 600;
}

.error-message {
  color: #d32f2f;
  font-weight: 600;
}

.home-button {
  background: linear-gradient(135deg, #8a2be2 0%, #ecb732 100%);
  color: white;
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
  box-shadow: 0 8px 25px rgba(138, 43, 226, 0.3);
}
</style>