<template>
  <nav class="filter">
    <button
      :class="{ active: filter === 'All' }"
      @click="$emit('update:filter', 'All')"
    >
      <i class="material-icons">shopping_cart</i>
      All Items
    </button>
    <button
      :class="{ active: filter === 'Favs' }"
      @click="$emit('update:filter', 'Favs')"
    >
      <i class="material-icons">favorite</i>
      Favorite Items
    </button>
    <button class="delete-all" @click="$emit('delete-all')">
      <i class="material-icons">delete_sweep</i>
      Delete All Items
    </button>
  </nav>
</template>

<script>
export default {
  props: {
    filter: String,
  },
};
</script>
