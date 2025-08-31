<script>
export default {
  props: {
    isDark: {
      type: Boolean,
      default: true
    },
    user: {
      type: Object,
      default: null
    }
  },
  
  emits: ['toggle-theme', 'logout']
}
</script>

<template>
  <header>
    <div class="header-content">
      <div class="logo-section">
        <a class="logo" href="https://pinit-down.vercel.app/" target="_blank">
      <img src="../assets/pinit-down.png" alt="pinia logo" />
    </a>
        <h1>Pinit Down</h1>
      </div>
      <div class="header-actions">
        <div v-if="user" class="user-info">
          <span class="user-greeting">{{ user.name }}</span>
          <span class="user-email">{{ user.email }}</span>
        </div>
        <button 
          v-if="user"
          @click="$emit('logout')" 
          class="logout-btn"
          title="Sign Out"
        >
          Logout
        </button>
        <button 
          @click="$emit('toggle-theme')" 
          :class="{ 'dark': isDark }"
          class="theme-toggle"
          :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
        <i class="material-icons">
          {{ isDark ? "dark_mode" : "light_mode" }}
        </i>
        </button>
      </div>
    </div>
  </header>
</template>
