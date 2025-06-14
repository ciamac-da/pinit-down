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
      isDark: Boolean
    }
  }
  </script>
  
  <style scoped>
header {
  text-align: center;
  background: blueviolet;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

header img {
  max-width: 80px;
  transform: rotate(-10deg);
  transition: 0.5s linear all;
  cursor: pointer;
}
header img:hover {
  transform: rotate(6rad);
}

header h1 {
  margin: 0;
  font-size: 48px;
  padding-top: 25px;
  margin-left: 15px;
  color: white;
  transform: rotate(2deg);
}

.theme-toggle {
  position: absolute;
  right: 12px;
  top: 85px;
  cursor: pointer;
  padding: 8px;
  background: transparent;
  border: none;
}

.theme-toggle:hover {
  transform: rotate(6rad);
}

.theme-toggle i {
  color: #ecb732;
  font-size: 28px;
}
</style>
