<script>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/AuthStore'
  
  export default {
    setup() {
      const router = useRouter()
      const route = useRoute()
      const authStore = useAuthStore()
  
      const isVerifying = ref(true)
      const tokenValid = ref(false)
      const tokenError = ref('')
      const userName = ref('')
      const userEmail = ref('')
      
      const password = ref('')
      const confirmPassword = ref('')
      const isLoading = ref(false)
      const error = ref('')
      const resetComplete = ref(false)
  
      const resetToken = computed(() => route.query.token)
  
      const canSubmit = computed(() => {
        return password.value.length >= 6 && 
               password.value === confirmPassword.value &&
               !isLoading.value
      })
  
      const passwordStrength = computed(() => {
        const pwd = password.value
        if (pwd.length === 0) return 0
        
        let strength = 0
        if (pwd.length >= 6) strength += 1
        if (pwd.length >= 8) strength += 1
        if (/[A-Z]/.test(pwd)) strength += 1
        if (/[a-z]/.test(pwd)) strength += 1
        if (/[0-9]/.test(pwd)) strength += 1
        if (/[^A-Za-z0-9]/.test(pwd)) strength += 1
        
        return strength
      })
  
      const passwordStrengthClass = computed(() => {
        const strength = passwordStrength.value
        if (strength <= 2) return 'weak'
        if (strength <= 4) return 'medium'
        return 'strong'
      })
  
      const passwordStrengthWidth = computed(() => {
        return `${(passwordStrength.value / 6) * 100}%`
      })
  
      const passwordStrengthText = computed(() => {
        const strength = passwordStrength.value
        if (password.value.length === 0) return ''
        if (strength <= 2) return 'Weak password'
        if (strength <= 4) return 'Good password'
        return 'Strong password'
      })
  
      const verifyToken = async () => {
        if (!resetToken.value) {
          tokenValid.value = false
          tokenError.value = 'No reset token provided.'
          isVerifying.value = false
          return
        }
  
        try {
          const result = await authStore.verifyResetToken(resetToken.value)
          
          if (result.success) {
            tokenValid.value = true
            userName.value = result.user.name
            userEmail.value = result.user.email
          } else {
            tokenValid.value = false
            tokenError.value = result.error || 'The reset link is invalid or has expired.'
          }
        } catch (err) {
          tokenValid.value = false
          tokenError.value = 'Failed to verify reset token. Please try again.'
        } finally {
          isVerifying.value = false
        }
      }
  
      const handleSubmit = async () => {
        error.value = ''
  
        if (password.value.length < 6) {
          error.value = 'Password must be at least 6 characters long.'
          return
        }
  
        if (password.value !== confirmPassword.value) {
          error.value = 'Passwords do not match.'
          return
        }
  
        isLoading.value = true
  
        try {
          const result = await authStore.resetPassword(resetToken.value, password.value)
          
          if (result.success) {
            resetComplete.value = true
          } else {
            error.value = result.error || 'Failed to reset password. Please try again.'
          }
        } catch (err) {
          error.value = 'Something went wrong. Please try again.'
        } finally {
          isLoading.value = false
        }
      }
  
      const goToLogin = () => {
        window.location.href = '/'
      }
  
      onMounted(() => {
        verifyToken()
      })
  
      return {
        isVerifying,
        tokenValid,
        tokenError,
        userName,
        userEmail,
        password,
        confirmPassword,
        isLoading,
        error,
        resetComplete,
        canSubmit,
        passwordStrengthClass,
        passwordStrengthWidth,
        passwordStrengthText,
        handleSubmit,
        goToLogin
      }
    }
  }
  </script>
<template>
    <div class="reset-container">
      <div class="reset-card">
        <div v-if="isVerifying" class="loading-state">
          <div class="spinner"></div>
          <h2>Verifying Reset Link...</h2>
          <p>Please wait while we verify your password reset token.</p>
        </div>
        <div v-else-if="!tokenValid" class="error-state">
          <div class="error-icon">❌</div>
          <h2>Invalid Reset Link</h2>
          <p>{{ tokenError }}</p>
          <button @click="goToLogin" class="auth-button">
            Back to Sign In
          </button>
        </div>
        <div v-else-if="!resetComplete" class="reset-form">
          <h2>Reset Your Password 🔐</h2>
          <p class="reset-subtitle">
            Hi {{ userName }}! Enter your new password below.
          </p>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <input
                v-model="password"
                type="password"
                placeholder="New Password (min. 6 characters)"
                required
                minlength="6"
                :disabled="isLoading"
                autocomplete="new-password"
              />
            </div>
            <div class="form-group">
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Confirm New Password"
                required
                :disabled="isLoading"
                autocomplete="new-password"
              />
            </div>
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
            <div class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="passwordStrengthClass"
                  :style="{ width: passwordStrengthWidth }"
                ></div>
              </div>
              <p class="strength-text">{{ passwordStrengthText }}</p>
            </div>
            <button
              type="submit"
              :disabled="isLoading || !canSubmit"
              class="auth-button"
            >
              <span v-if="isLoading">Resetting Password...</span>
              <span v-else>Reset Password</span>
            </button>
          </form>
        </div>
        <div v-else class="success-state">
          <div class="success-icon">🎉</div>
          <h2>Password Reset Complete!</h2>
          <p class="success-message">
            Your password has been successfully updated. 
            You can now sign in with your new password.
          </p>
          <button @click="goToLogin" class="auth-button">
            Sign In Now
          </button>
        </div>
      </div>
    </div>
  </template>

<style scoped>
  .reset-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .reset-card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 500px;
    overflow: hidden;
  }
  
  .loading-state,
  .error-state,
  .reset-form,
  .success-state {
    padding: 3rem;
    text-align: center;
  }
  
  /* Loading State */
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 2rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-state h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  
  .loading-state p {
    color: #666;
    font-size: 0.95rem;
  }
  
  /* Error State */
  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .error-state h2 {
    color: #dc3545;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  
  .error-state p {
    color: #666;
    margin-bottom: 2rem;
    line-height: 1.5;
  }
  
  /* Reset Form */
  .reset-form {
    text-align: left;
  }
  
  .reset-form h2 {
    text-align: center;
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 1.8rem;
    font-weight: 600;
  }
  
  .reset-subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.875rem;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: #f8f9fa;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error-message {
    background: #fff5f5;
    color: #e53e3e;
    padding: 0.875rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    text-align: center;
    border: 1px solid #feb2b2;
    font-size: 0.9rem;
  }
  
  /* Password Strength Indicator */
  .password-strength {
    margin-bottom: 2rem;
  }
  
  .strength-bar {
    width: 100%;
    height: 6px;
    background: #e1e5e9;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 3px;
  }
  
  .strength-fill.weak {
    background: #dc3545;
  }
  
  .strength-fill.medium {
    background: #ffc107;
  }
  
  .strength-fill.strong {
    background: #28a745;
  }
  
  .strength-text {
    font-size: 0.85rem;
    margin: 0;
    text-align: center;
  }
  
  .strength-text {
    color: #666;
  }
  
  /* Buttons */
  .auth-button {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.875rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .auth-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  
  .auth-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  /* Success State */
  .success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .success-state h2 {
    color: #28a745;
    margin-bottom: 1rem;
    font-size: 1.8rem;
    font-weight: 600;
  }
  
  .success-message {
    color: #666;
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  
  /* Responsive Design */
  @media (max-width: 600px) {
    .reset-container {
      padding: 1rem;
    }
    
    .loading-state,
    .error-state,
    .reset-form,
    .success-state {
      padding: 2rem 1.5rem;
    }
    
    .reset-form h2,
    .success-state h2 {
      font-size: 1.5rem;
    }
    
    .error-icon,
    .success-icon {
      font-size: 3rem;
    }
  }
  
  @media (max-width: 480px) {
    .reset-container {
      padding: 0.5rem;
    }
    
    .loading-state,
    .error-state,
    .reset-form,
    .success-state {
      padding: 1.5rem 1rem;
    }
  }
  </style>