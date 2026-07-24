<template>
  <nav class="filter">
    <div class="filter-left">
      <button
        :class="{ active: filter === 'All' }"
        @click="$emit('update:filter', 'All')"
      >
        <i class="material-icons">shopping_cart</i>
        All
      </button>
    </div>
    <div class="filter-right">
      <button
        :class="{ active: filter === 'Favs' }"
        @click="$emit('update:filter', 'Favs')"
      >
        <i class="material-icons">bookmark</i>
        Saved ({{ savedCount }})
      </button>
    </div>
  </nav>
</template>

<script>
export default {
  props: {
    filter: String,
    savedCount: Number,
  },
  emits: ['update:filter'],
};
</script>

<style lang="scss" scoped></style>
