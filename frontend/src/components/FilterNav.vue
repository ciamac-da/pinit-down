<template>
    <nav class="filter">
      <button
        :class="{ active: filter === 'All' }"
        @click="$emit('update:filter', 'All')"
      >
        All Items
      </button>
      <button
        :class="{ active: filter === 'Favs' }"
        @click="$emit('update:filter', 'Favs')"
      >
        Fav Items
      </button>
      <button class="delete-all" @click="$emit('delete-all')">
        Delete All Items
      </button>
    </nav>
  </template>
  
  <script>
  export default {
    props: {
      filter: String
    }
  }
  </script>
  