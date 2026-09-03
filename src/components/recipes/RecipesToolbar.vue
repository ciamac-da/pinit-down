<script>
export default {
  props: {
    isRecipeFiltersOpen: { type: Boolean, required: true },
    recipeSearchQuery: { type: String, default: '' },
    selectedRecipeCategory: { type: String, default: 'All' },
    recipeCategories: { type: Array, default: () => [] },
    selectedRecipeLetter: { type: String, default: 'All' },
    recipeLetters: { type: Array, default: () => [] },
  },
  emits: [
    'update-filters-open',
    'update-recipe-search-query',
    'recipe-search-input',
    'submit-recipe-search',
    'filter-by-category',
    'reset-recipes',
    'filter-by-letter',
  ],
  data() {
    return {
      showCategoryMenu: false,
    };
  },
  computed: {
    categoryLabel() {
      return this.selectedRecipeCategory === 'All'
        ? 'All categories'
        : this.selectedRecipeCategory;
    },
  },
  methods: {
    toggleFiltersOpen() {
      this.$emit('update-filters-open', !this.isRecipeFiltersOpen);
    },
    selectCategory(category) {
      this.showCategoryMenu = false;
      this.$emit('filter-by-category', category);
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
      <i class="material-icons">{{
        isRecipeFiltersOpen ? 'close' : 'search'
      }}</i>
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
          @input="
            $emit('update-recipe-search-query', $event.target.value);
            $emit('recipe-search-input');
          "
          type="text"
          placeholder="Search recipes by name"
        />
      </form>

      <div class="recipes-advanced-filters">
        <div class="category-dropdown">
          <button
            type="button"
            class="category-dropdown-toggle"
            @click="showCategoryMenu = !showCategoryMenu"
          >
            {{ categoryLabel }}
            <i class="material-icons">{{
              showCategoryMenu ? 'expand_less' : 'expand_more'
            }}</i>
          </button>
          <div
            v-if="showCategoryMenu"
            class="category-dropdown-backdrop"
            @click="showCategoryMenu = false"
          ></div>
          <div v-if="showCategoryMenu" class="category-dropdown-menu">
            <button
              type="button"
              class="category-dropdown-option"
              :class="{ active: selectedRecipeCategory === 'All' }"
              @click="selectCategory('All')"
            >
              All categories
            </button>
            <button
              v-for="category in recipeCategories"
              :key="category.strCategory"
              type="button"
              class="category-dropdown-option"
              :class="{ active: selectedRecipeCategory === category.strCategory }"
              @click="selectCategory(category.strCategory)"
            >
              {{ category.strCategory }}
            </button>
          </div>
        </div>
      </div>
    </div>

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
  top: -10px;
  background: color.$light;
  z-index: 8;
  padding : spacing.$spacing-xs 0;
  gap: spacing.$spacing-s;

  @include breakpoint.media-breakpoint-up(sm) {
    gap: spacing.$spacing-s;
    padding-bottom: spacing.$spacing-base;
  }
}

html.dark .recipes-toolbar {
  background: color.$dark;
}

.recipe-filters-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: spacing.$spacing-xxs;
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
    text-align: center;
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
}

.category-dropdown {
  position: relative;
  justify-content: center;
  width: 100%;
}

.category-dropdown-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: spacing.$spacing-xxs;
  border: size.$sp02 solid color.$border;
  border-radius: size.$sp12;
  min-height: size.$sp40;
  padding: spacing.$spacing-base;
  @include typography.headline-140;
  color: color.$dark;
  background: color.$white;
  cursor: pointer;

  .material-icons {
    color: color.$muted;
  }

  &:hover {
    border-color: color.$blue-violet;
  }
}

.category-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.category-dropdown-menu {
  position: absolute;
  top: calc(100% + #{spacing.$spacing-xxs});
  left: 0;
  right: 0;
  z-index: 21;
  max-height: size.$sp80 * 3;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: spacing.$spacing-xxs;
  background: color.$white;
  border-radius: size.$sp10;
  box-shadow: size.$sp02 size.$sp04 size.$sp24 color.$dark;
}

.category-dropdown-option {
  border: none;
  border-radius: size.$sp08;
  background: none;
  padding: spacing.$spacing-base;
  cursor: pointer;
  text-align: left;
  @include typography.headline-140-medium;
  color: color.$dark;

  &:hover {
    background: color.$light-hover;
  }

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }
}

.recipes-reset-btn,
.letter-chip {
  border: none;
  cursor: pointer;
}

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


.recipes-reset-btn {
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;
}

.recipe-letter-filter {
  display: flex;
  gap: spacing.$spacing-xs;
  overflow-x: auto;
  padding-bottom: spacing.$spacing-base;
}

.letter-chip {
  flex: 0 0 auto;
  min-width: size.$sp40;
  border-radius: size.$sp10;
  padding: spacing.$spacing-xxs;
  background: color.$light-bg;
  color: color.$dark;
  @include typography.headline-120-medium;

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }
}

html.dark .recipes-search input,
html.dark .category-dropdown-toggle {
  background: color.$dark-medium;
  color: color.$light;
}

html.dark .category-dropdown-menu {
  background: color.$dark-medium;
}

html.dark .category-dropdown-option {
  color: color.$light;

  &:hover {
    background: rgba(color.$light, 0.1);
  }

  &.active {
    background: color.$gold;
    color: color.$white;
  }
}

html.dark .recipes-search input::placeholder {
  color: color.$light50;
}

html.dark .recipes-reset-btn,
html.dark .recipe-filters-toggle,
html.dark .letter-chip {
  background: rgba(color.$light, 0.12);
  color: color.$light;
}

html.dark .recipe-filters-toggle {
  background: color.$gold;
  color: color.$white;
}

html.dark .letter-chip.active {
  background: color.$gold;
  color: color.$white;
}
</style>
