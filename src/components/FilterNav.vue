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

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.filter {
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xs;
  justify-content: space-between;
  margin: auto;
  text-align: center;
  padding-top: spacing.$spacing-s;

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
    align-items: center;
  }
}

.filter-left {
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xs;
  text-align: center;
  align-items: center;

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
    align-items: center;
  }
}

.filter-right {
  display: flex;
  justify-content: center;

  button {
    width: 100%;
    justify-content: center;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    justify-content: flex-end;

    button {
      width: auto;
    }
  }
}

.filter button {
  display: flex;
  flex-direction: row;
  color: color.$light;
  background: color.$blue-violet;
  border-radius: size.$sp06;
  border: none;
  cursor: pointer;
  padding: spacing.$spacing-xs;
  transition: 0.2s linear all;
  align-items: center;
  gap: spacing.$spacing-xxs;

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xxs;
  }
}

.filter button.active {
  background-color: color.$gold;
  color: color.$light;
  font-weight: bold;
  box-shadow: 0 size.$sp02 size.$sp04 color.$dark;
  width: 100%;
  justify-content: center;

  @include breakpoint.media-breakpoint-up(sm) {
    transform: rotate(-7deg);
  }
}
</style>
