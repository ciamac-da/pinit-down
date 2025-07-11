<template>
  <header>
    <a href="https://pinia.vuejs.org/" target="_blank">
      <img src="../assets/pinit-down.png" alt="pinia logo" />
    </a>
    <div>
      <h1>Pinit Down</h1>
      <button class="theme-toggle" @click="$emit('toggle-theme')">
        <i class="material-icons">
          {{ isDark ? "dark_mode" : "light_mode" }}
        </i>
      </button>
    </div>
  </header>
</template>

<script>
export default {
  props: {
    isDark: Boolean,
  },
};
</script>
