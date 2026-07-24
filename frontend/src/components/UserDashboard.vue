<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'

export default {
  emits: ['close', 'logout', 'delete-account'],

  setup(_, { emit }) {
    const authStore = useAuthStore()

    // Change password
    const showChangePassword = ref(false)
    const pwForm = reactive({ current: '', newPw: '', confirm: '' })
    const pwLoading = ref(false)
    const pwError = ref('')
    const pwSuccess = ref('')
    const showCurrentPw = ref(false)
    const showNewPw = ref(false)
    const showConfirmPw = ref(false)

    // Edit name
    const editingName = ref(false)
    const editName = ref('')
    const nameLoading = ref(false)
    const nameError = ref('')

    const startEditName = () => {
      editName.value = authStore.userName
      editingName.value = true
      nameError.value = ''
    }

    const cancelEditName = () => {
      editingName.value = false
      nameError.value = ''
    }

    const saveEditName = async () => {
      const trimmed = editName.value.trim()
      if (!trimmed || trimmed.length < 2) {
        nameError.value = 'Name must be at least 2 characters.'
        return
      }
      if (trimmed === authStore.userName) {
        editingName.value = false
        return
      }
      nameLoading.value = true
      const result = await authStore.updateName(trimmed)
      nameLoading.value = false
      if (result.success) {
        editingName.value = false
      } else {
        nameError.value = result.error
      }
    }

    const toggleChangePassword = () => {
      showChangePassword.value = !showChangePassword.value
      pwError.value = ''
      pwSuccess.value = ''
      pwForm.current = pwForm.newPw = pwForm.confirm = ''
    }

    const submitChangePassword = async () => {
      pwError.value = ''
      pwSuccess.value = ''
      if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
        pwError.value = 'All fields are required.'
        return
      }
      if (pwForm.newPw.length < 8) {
        pwError.value = 'Password must be at least 8 characters.'
        return
      }
      if (!/[A-Z]/.test(pwForm.newPw)) {
        pwError.value = 'Password must contain at least one uppercase letter.'
        return
      }
      if (!/[a-z]/.test(pwForm.newPw)) {
        pwError.value = 'Password must contain at least one lowercase letter.'
        return
      }
      if (!/[0-9]/.test(pwForm.newPw)) {
        pwError.value = 'Password must contain at least one number.'
        return
      }
      if (!/[^A-Za-z0-9]/.test(pwForm.newPw)) {
        pwError.value = 'Password must contain at least one special character.'
        return
      }
      if (pwForm.newPw !== pwForm.confirm) {
        pwError.value = 'New passwords do not match.'
        return
      }
      pwLoading.value = true
      const result = await authStore.changePassword(pwForm.current, pwForm.newPw)
      pwLoading.value = false
      if (result.success) {
        pwSuccess.value = result.message
        pwForm.current = pwForm.newPw = pwForm.confirm = ''
        showChangePassword.value = false
      } else {
        pwError.value = result.error
      }
    }

    // Delete account confirmation
    const confirmingDelete = ref(false)

    return {
      authStore,
      showChangePassword,
      pwForm,
      pwLoading,
      pwError,
      pwSuccess,
      showCurrentPw,
      showNewPw,
      showConfirmPw,
      toggleChangePassword,
      submitChangePassword,
      confirmingDelete,
      editingName,
      editName,
      nameLoading,
      nameError,
      startEditName,
      cancelEditName,
      saveEditName,
    }
  }
}
</script>

<template>
  <div class="dashboard-overlay" @click.self="$emit('close')">
    <div class="dashboard-panel">
      <button class="close-btn" @click="$emit('close')">&times;</button>

      <h2 class="panel-title">My Account</h2>

      <!-- User info -->
      <div class="user-card">
        <div class="avatar">{{ authStore.userName?.charAt(0).toUpperCase() }}</div>
        <div class="user-details">
          <div v-if="editingName" class="edit-name-row">
            <input
              v-model="editName"
              class="edit-name-input"
              placeholder="Your name..."
              @keyup.enter="saveEditName"
              @keyup.escape="cancelEditName"
              :disabled="nameLoading"
              autofocus
            />
            <i class="material-icons edit-name-save" @click="saveEditName">check</i>
            <i class="material-icons edit-name-cancel" @click="cancelEditName">close</i>
          </div>
          <div v-else class="name-row">
            <p class="user-name">{{ authStore.userName }}</p>
            <i class="material-icons edit-name-icon" @click="startEditName" title="Edit name">edit</i>
          </div>
          <p v-if="nameError" class="name-error">{{ nameError }}</p>
          <p class="user-email">{{ authStore.userEmail }}</p>
        </div>
      </div>

      <div class="divider" />

      <!-- Actions -->
      <div class="actions">

        <!-- Change Password -->
        <button class="action-btn" @click="toggleChangePassword">
          <i class="material-icons">lock</i>
          Change Password
          <i class="material-icons chevron">{{ showChangePassword ? 'expand_less' : 'expand_more' }}</i>
        </button>

        <form v-if="showChangePassword" class="pw-form" @submit.prevent="submitChangePassword">
          <div class="pw-input-group">
            <input
              v-model="pwForm.current"
              :type="showCurrentPw ? 'text' : 'password'"
              placeholder="Current password"
              autocomplete="current-password"
              :disabled="pwLoading"
            />
            <button type="button" class="toggle-password" @click="showCurrentPw = !showCurrentPw" tabindex="-1">
              <svg v-if="showCurrentPw" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="pw-input-group">
            <input
              v-model="pwForm.newPw"
              :type="showNewPw ? 'text' : 'password'"
              placeholder="New password (min 8, A-z, 0-9, !@#)"
              autocomplete="new-password"
              :disabled="pwLoading"
            />
            <button type="button" class="toggle-password" @click="showNewPw = !showNewPw" tabindex="-1">
              <svg v-if="showNewPw" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="pw-input-group">
            <input
              v-model="pwForm.confirm"
              :type="showConfirmPw ? 'text' : 'password'"
              placeholder="Confirm new password"
              autocomplete="new-password"
              :disabled="pwLoading"
            />
            <button type="button" class="toggle-password" @click="showConfirmPw = !showConfirmPw" tabindex="-1">
              <svg v-if="showConfirmPw" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <p v-if="pwError" class="pw-error">{{ pwError }}</p>
          <p v-if="pwSuccess" class="pw-success">{{ pwSuccess }}</p>
          <button type="submit" class="submit-pw-btn" :disabled="pwLoading">
            {{ pwLoading ? 'Saving…' : 'Save New Password' }}
          </button>
        </form>

        <div class="divider" />

        <!-- Logout -->
        <button class="action-btn" @click="$emit('logout')">
          <i class="material-icons">logout</i>
          Sign Out
        </button>

        <div class="divider" />

        <!-- Delete Account -->
        <div v-if="confirmingDelete" class="confirm-delete">
          <p class="confirm-text">This will permanently delete your account and all items. Are you sure?</p>
          <div class="confirm-btns">
            <button class="confirm-yes" @click="$emit('delete-account')">Yes, delete my account</button>
            <button class="confirm-no" @click="confirmingDelete = false">Cancel</button>
          </div>
        </div>
        <button v-else class="action-btn danger" @click="confirmingDelete = true">
          <i class="material-icons">person_remove</i>
          Delete Account
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/abstracts/color";

.dashboard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.55);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
  backdrop-filter: blur(4px);
}

.dashboard-panel {
  background: color.$white;
  width: min(380px, 92vw);
  height: 100%;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  position: relative;
  box-shadow: -4px 0 24px rgba(color.$dark, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: color.$muted;
  line-height: 1;
  &:hover { color: color.$dark-medium; }
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: color.$dark-medium;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.25rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: color.$gradient;
  color: color.$white;
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  color: color.$dark-deep;
  margin: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.edit-name-icon {
  font-size: 0.95rem;
  color: color.$muted;
  cursor: pointer;
  &:hover { color: color.$dark; }
}

.edit-name-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.edit-name-input {
  padding: 0.25rem 0.4rem;
  border: 1.5px solid color.$border;
  border-radius: 5px;
  font-size: 0.95rem;
  font-weight: 600;
  width: 140px;
  outline: none;
  &:focus { border-color: color.$blue-violet; }
}

.edit-name-save {
  font-size: 1.2rem;
  color: color.$success;
  cursor: pointer;
  &:hover { color: color.$success-alt; }
}

.edit-name-cancel {
  font-size: 1.2rem;
  color: color.$muted;
  cursor: pointer;
  &:hover { color: color.$dark; }
}

.name-error {
  font-size: 0.78rem;
  color: color.$danger;
  margin: 0.15rem 0 0;
}

.user-email {
  font-size: 0.82rem;
  color: color.$muted;
  margin: 0;
}

.divider {
  height: 1px;
  background: color.$light-bg;
  margin: 0.75rem 0;
}

.actions {
  display: flex;
  flex-direction: column;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  color: color.$dark-medium;
  padding: 0.65rem 0.25rem;
  border-radius: 8px;
  transition: background 0.15s;
  text-align: left;

  .material-icons { font-size: 1.15rem; color: color.$blue-violet; }
  .chevron { margin-left: auto; color: color.$muted-lighter; }

  &:hover { background: color.$blue-violet-bg; }
  &.danger { color: color.$danger; .material-icons { color: color.$danger; } }
  &.danger:hover { background: color.$danger-bg; }
}

.pw-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem 0.25rem 1rem;

  input {
    padding: 0.55rem 0.75rem;
    padding-right: 2.2rem;
    border: 1.5px solid color.$border-light;
    border-radius: 8px;
    font-size: 0.9rem;
    width: 100%;
    box-sizing: border-box;
    &:focus { outline: none; border-color: color.$blue-violet; }
    &:disabled { opacity: 0.6; }
  }
}

.pw-input-group {
  position: relative;

  .toggle-password {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: color.$dark50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem;
    border-radius: 50%;
    transition: color 0.2s ease;

    &:hover { color: color.$dark-medium; }
  }
}

.pw-error   { font-size: 0.8rem; color: color.$danger; margin: 0; }
.pw-success { font-size: 0.8rem; color: color.$success-muted; margin: 0; }

.submit-pw-btn {
  padding: 0.55rem;
  background: color.$blue-violet;
  color: color.$white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  &:hover:not(:disabled) { background: color.$blue-violet-dark; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.confirm-delete {
  padding: 0.75rem 0.25rem;
}

.confirm-text {
  font-size: 0.85rem;
  color: color.$dark-soft;
  margin: 0 0 0.6rem;
  line-height: 1.4;
}

.confirm-btns {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.confirm-yes {
  background: color.$danger;
  color: color.$white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: color.$danger-darker; }
}

.confirm-no {
  background: none;
  border: 1.5px solid color.$border;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover { background: color.$light-bg-soft; }
}
</style>
