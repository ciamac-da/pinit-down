<script>
export default {
  props: {
    isRecipeFiltersOpen: { type: Boolean, required: true },
    recipeSearchQuery: { type: String, default: '' },
    selectedRecipeCategory: { type: String, default: 'All' },
    recipeCategories: { type: Array, default: () => [] },
    ingredientQuery: { type: String, default: '' },
    selectedRecipeLetter: { type: String, default: 'All' },
    recipeLetters: { type: Array, default: () => [] },
  },
  emits: [
    'update-filters-open',
    'update-recipe-search-query',
    'update-ingredient-query',
    'submit-recipe-search',
    'filter-by-category',
    'submit-ingredient-search',
    'ingredient-input',
    'reset-recipes',
    'filter-by-letter',
  ],
  methods: {
    toggleFiltersOpen() {
      this.$emit('update-filters-open', !this.isRecipeFiltersOpen);
    },
  },
};
</script>

<template>
  <div class="recipes-toolbar">
    <button
      type="button"
      class="recipe-filters-toggle"
      :aria-expanded="isRecipeFiltersOpen"
      @click="toggleFiltersOpen"
    >
      {{ isRecipeFiltersOpen ? 'Hide search' : 'Search recipes' }}
    </button>

    <div
      class="recipes-toolbar-panel"
      :class="{ 'is-open': isRecipeFiltersOpen }"
    >
      <form
        class="recipes-search"
        @submit.prevent="$emit('submit-recipe-search')"
      >
        <input
          :value="recipeSearchQuery"
          @input="$emit('update-recipe-search-query', $event.target.value)"
          type="text"
          placeholder="Search recipes by name"
        />
        <button type="submit" class="recipes-search-btn">
          <i class="material-icons">search</i>
          Search
        </button>
      </form>

      <div class="recipes-advanced-filters">
        <select
          :value="selectedRecipeCategory"
          @change="$emit('filter-by-category', $event.target.value)"
        >
          <option value="All">All categories</option>
          <option
            v-for="category in recipeCategories"
            :key="category.strCategory"
            :value="category.strCategory"
          >
            {{ category.strCategory }}
          </option>
        </select>

        <form
          class="recipes-ingredient-search"
          @submit.prevent="$emit('submit-ingredient-search')"
        >
          <input
            :value="ingredientQuery"
            @input="
              $emit('update-ingredient-query', $event.target.value);
              $emit('ingredient-input');
            "
            type="text"
            placeholder="Filter by ingredient"
          />
          <button type="submit" class="recipes-reset-btn">
            Find ingredient
          </button>
        </form>
      </div>
    </div>

    <button
      type="button"
      class="recipes-reset-btn"
      @click="$emit('reset-recipes')"
    >
      All recipes
    </button>

    <div class="recipe-letter-filter">
      <button
        type="button"
        class="letter-chip"
        :class="{ active: selectedRecipeLetter === 'All' }"
        @click="$emit('reset-recipes')"
      >
        All
      </button>
      <button
        v-for="letter in recipeLetters"
        :key="letter"
        type="button"
        class="letter-chip"
        :class="{ active: selectedRecipeLetter === letter }"
        @click="$emit('filter-by-letter', letter)"
      >
        {{ letter }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.recipes-toolbar {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  background: color.$light;
  z-index: 8;
  padding-bottom: spacing.$spacing-base;
  gap: spacing.$spacing-xxs;

  @include breakpoint.media-breakpoint-up(sm) {
    gap: spacing.$spacing-s;
  }
}

html.dark .recipes-toolbar {
  background: color.$dark;
}

.recipe-filters-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: size.$sp40;
  border: none;
  border-radius: size.$sp10;
  padding: spacing.$spacing-base spacing.$spacing-xs;
  background: color.$blue-violet;
  color: color.$white;
  cursor: pointer;
  @include typography.headline-140-medium;

  @include breakpoint.media-breakpoint-up(sm) {
    display: none;
  }
}

.recipes-toolbar-panel {
  display: none;

  &.is-open {
    display: flex;
    flex-direction: column;
    gap: spacing.$spacing-xxs;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    display: flex;
    flex-direction: column;
    gap: spacing.$spacing-xxs;
  }
}

.recipes-search {
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;

  input {
    border: size.$sp02 solid color.$border;
    border-radius: size.$sp12;
    min-height: size.$sp40;
    padding: spacing.$spacing-base;
    @include typography.headline-140;
    outline: none;
    background: color.$white;

    &:focus {
      border-color: color.$blue-violet;
    }
  }

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;

    input {
      flex: 1 1 calc(spacing.$spacing-s * 10);
      min-width: 0;
    }
  }
}

.recipes-advanced-filters {
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;

  select,
  input {
    border: size.$sp02 solid color.$border;
    border-radius: size.$sp12;
    min-height: size.$sp40;
    padding: spacing.$spacing-base;
    @include typography.headline-140;
    outline: none;
    background: color.$white;

    &:focus {
      border-color: color.$blue-violet;
    }
  }

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;

    select {
      flex: 1 1 calc(spacing.$spacing-s * 10);
      min-width: 0;
    }
  }
}

.recipes-ingredient-search {
  display: flex;
  min-width: 0;
  gap: spacing.$spacing-xxs;
  flex-wrap: wrap;
  flex-direction: column;

  input {
    min-width: 0;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    width: 100%;

    input {
      flex: 1 1 80%;
    }

    button {
      flex: 1 1 15%;
    }
  }
}

.recipes-search-btn,
.recipes-reset-btn,
.letter-chip {
  border: none;
  cursor: pointer;
}

.recipes-search-btn,
.recipes-reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: spacing.$spacing-base;
  min-height: size.$sp40;
  border-radius: size.$sp10;
  padding: spacing.$spacing-base spacing.$spacing-xs;
  @include typography.headline-120-medium;
}

.recipes-search-btn {
  background: color.$gold;
  color: color.$white;
}

.recipes-reset-btn {
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;
}

.recipe-letter-filter {
  display: flex;
  gap: spacing.$spacing-base;
  overflow-x: auto;
  padding-bottom: spacing.$spacing-base;
}

.letter-chip {
  flex: 0 0 auto;
  min-width: size.$sp40;
  border-radius: size.$sp10;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  background: color.$light-bg;
  color: color.$dark;
  @include typography.headline-120-medium;

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }
}

:global(.dark) .recipes-search input,
:global(.dark) .recipes-advanced-filters select,
:global(.dark) .recipes-advanced-filters input {
  background: color.$dark-medium;
  color: color.$light;
}

:global(.dark) .recipes-search input::placeholder,
:global(.dark) .recipes-advanced-filters input::placeholder {
  color: color.$light50;
}

html.dark .recipes-reset-btn,
html.dark .recipe-filters-toggle,
html.dark .letter-chip {
  background: rgba(color.$light, 0.12);
  color: color.$light;
}

html.dark .recipe-filters-toggle {
  background: rgba(color.$blue-violet, 0.45);
  color: color.$white;
}

:global(.dark) .letter-chip.active {
  background: color.$gold;
  color: color.$white;
}
</style>
