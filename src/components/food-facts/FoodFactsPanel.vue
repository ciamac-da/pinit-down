<script>
import { extractCoreNutrients } from '@/services/foodFactsApi';
import { useCartStore } from '@/stores/CartStore';

export default {
  props: {
    savedFoodFactKeys: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['save-food-fact'],
  data() {
    return {
      foundationFoods: [],
      srLegacyFoods: [],
      datasetLoading: false,
      datasetError: '',
      searchQuery: '',
      searchResults: [],
      foodLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      selectedFoodLetter: 'All',
      currentPage: 1,
      pageSize: 20,
      pageSizeOptions: [20, 50, 100],
      searching: false,
      searchError: '',
      selectedFood: null,
      showPageSizeMenu: false,
      toolbarHeight: 0,
    };
  },
  computed: {
    hasSearchQuery() {
      return this.searchQuery.trim().length > 0;
    },
    totalFoodsLoaded() {
      return this.foundationFoods.length + this.srLegacyFoods.length;
    },
    hasSrLegacyData() {
      return this.srLegacyFoods.length > 0;
    },
    allFoods() {
      const uniqueFoods = new Map();
      const mergedFoods = [...this.foundationFoods, ...this.srLegacyFoods];

      mergedFoods.forEach((food) => {
        const description = food?.description?.trim();
        if (!description) return;
        const key = `${food.fdcId ?? 'no-id'}:${description}`;
        if (!uniqueFoods.has(key)) uniqueFoods.set(key, food);
      });

      return [...uniqueFoods.values()].sort((a, b) =>
        a.description.localeCompare(b.description),
      );
    },
    paginatedResults() {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      return this.searchResults.slice(startIndex, startIndex + this.pageSize);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.searchResults.length / this.pageSize));
    },
    isAtFirstPage() {
      return this.currentPage <= 1;
    },
    isAtLastPage() {
      return this.currentPage >= this.totalPages;
    },
    resultRangeLabel() {
      if (!this.searchResults.length) return 'Showing 0 of 0';
      const start = (this.currentPage - 1) * this.pageSize + 1;
      const end = Math.min(
        this.searchResults.length,
        this.currentPage * this.pageSize,
      );
      return `Showing ${start}-${end} of ${this.searchResults.length}`;
    },
    selectedNutrients() {
      return this.selectedFood ? extractCoreNutrients(this.selectedFood) : null;
    },
  },
  watch: {
    searchQuery() {
      this.runSearch();
    },
  },
  methods: {
    formatValue(value) {
      if (value === null || value === undefined || value === '') return '-';
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return '-';
      return parsed.toFixed(1);
    },
    async loadOptionalSrLegacyDataset() {
      const srUrls = ['/sr-legacy-foods.json', '/sr-legacy.json'];

      for (const url of srUrls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;

          const payload = await response.json();
          const foods = Array.isArray(payload?.SRLegacyFoods)
            ? payload.SRLegacyFoods
            : [];

          if (foods.length) {
            this.srLegacyFoods = foods;
            return;
          }
        } catch {
          // Optional dataset; ignore fetch/parse issues and keep Foundation-only mode.
        }
      }
    },
    async loadDataset() {
      this.datasetLoading = true;
      this.datasetError = '';

      try {
        const response = await fetch('/foundation-foods.json');
        if (!response.ok) {
          throw new Error(
            'Could not load foundation-foods.json from public folder.',
          );
        }

        const payload = await response.json();
        const foods = Array.isArray(payload?.FoundationFoods)
          ? payload.FoundationFoods
          : [];

        this.foundationFoods = foods;
        await this.loadOptionalSrLegacyDataset();
        if (!foods.length) {
          this.datasetError = 'No foods found in dataset.';
        }
      } catch (error) {
        this.foundationFoods = [];
        this.datasetError =
          error instanceof Error
            ? error.message
            : 'Failed to load food dataset.';
      } finally {
        this.datasetLoading = false;
      }
    },
    runSearch() {
      if (!this.allFoods.length) {
        this.searchResults = [];
        this.searchError =
          this.datasetError || 'Food dataset is not loaded yet.';
        this.currentPage = 1;
        return;
      }

      const query = this.searchQuery.trim().toLowerCase();

      this.searchError = '';
      this.searching = true;

      try {
        const activeLetter = this.selectedFoodLetter;
        let filteredFoods = this.allFoods;

        if (activeLetter !== 'All') {
          filteredFoods = filteredFoods.filter((food) =>
            food.description.toUpperCase().startsWith(activeLetter),
          );
        }

        if (query) {
          filteredFoods = filteredFoods.filter((food) =>
            food.description.toLowerCase().includes(query),
          );
        }

        this.searchResults = filteredFoods;
        this.currentPage = 1;
      } catch (error) {
        this.searchResults = [];
        this.searchError =
          error instanceof Error
            ? error.message
            : 'Unable to search foods right now.';
        this.currentPage = 1;
      } finally {
        this.searching = false;
      }
    },
    selectLetter(letter) {
      this.selectedFoodLetter = letter;
      this.runSearch();
    },
    goToPage(pageNumber) {
      if (pageNumber < 1 || pageNumber > this.totalPages) return;
      this.currentPage = pageNumber;
    },
    previousPage() {
      this.goToPage(this.currentPage - 1);
    },
    nextPage() {
      this.goToPage(this.currentPage + 1);
    },
    selectPageSize(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.showPageSizeMenu = false;
    },
    foodKey(food) {
      return `${food.fdcId ?? 'no-id'}:${food.description}`;
    },
    isFoodSaved(food) {
      return this.savedFoodFactKeys.includes(this.foodKey(food));
    },
    saveFoodFact(food) {
      if (this.isFoodSaved(food)) {
        useCartStore().showToast('This item is already saved.', 'info');
        return;
      }
      this.$emit('save-food-fact', food);
    },
    showDetails(food) {
      this.selectedFood = food;
    },
    clearDetails() {
      this.selectedFood = null;
    },
    onCardClick(food) {
      this.showDetails(food);
    },
    updateToolbarHeight() {
      this.toolbarHeight = this.$refs.toolbar?.offsetHeight ?? 0;
    },
  },
  async mounted() {
    await this.loadDataset();
    this.runSearch();
    this.updateToolbarHeight();
    this.toolbarResizeObserver = new ResizeObserver(() => this.updateToolbarHeight());
    this.toolbarResizeObserver.observe(this.$refs.toolbar);
  },
  beforeUnmount() {
    this.toolbarResizeObserver?.disconnect();
  },
};
</script>

<template>
  <div class="food-facts-view" :style="{ '--food-toolbar-height': toolbarHeight + 'px' }">
    <div class="food-facts-toolbar" ref="toolbar">
      <h2>Food Facts</h2>
      <form class="food-search-form" @submit.prevent="runSearch">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search food facts..."
        />
        <button type="submit">
          <i class="material-icons">search</i>
          Search
        </button>
      </form>

      <p v-if="datasetLoading" class="food-state">Loading local dataset...</p>
      <p v-else-if="datasetError" class="food-state food-state-error">
        {{ datasetError }}
      </p>

      <div class="food-letter-filter">
        <button
          type="button"
          class="letter-chip"
          :class="{ active: selectedFoodLetter === 'All' }"
          @click="selectLetter('All')"
        >
          All
        </button>
        <button
          v-for="letter in foodLetters"
          :key="letter"
          type="button"
          class="letter-chip"
          :class="{ active: selectedFoodLetter === letter }"
          @click="selectLetter(letter)"
        >
          {{ letter }}
        </button>
      </div>
    </div>

    <div v-if="searchResults.length > 0" class="food-pagination food-pagination-top">
      <div class="page-size-menu-wrapper">
      
        <div
          v-if="showPageSizeMenu"
          class="page-size-backdrop"
          @click="showPageSizeMenu = false"
        ></div>
        <div v-if="showPageSizeMenu" class="page-size-dropdown">
          <button
            v-for="sizeOption in pageSizeOptions"
            :key="sizeOption"
            type="button"
            class="page-size-option"
            :class="{ active: pageSize === sizeOption }"
            @click="selectPageSize(sizeOption)"
          >
            {{ sizeOption }}
          </button>
        </div>
      </div>

      <button
        type="button"
        class="page-btn"
        :class="{ 'page-btn-hidden': isAtFirstPage }"
        :disabled="isAtFirstPage"
        @click="previousPage"
      >
        <i class="material-icons">chevron_left</i>
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        type="button"
        class="page-btn"
        :class="{ 'page-btn-hidden': isAtLastPage }"
        :disabled="isAtLastPage"
        @click="nextPage"
      >
        <i class="material-icons">chevron_right</i>
      </button>
    </div>

    <p v-if="searching" class="food-state">Searching...</p>
    <p v-else-if="searchError" class="food-state food-state-error">
      {{ searchError }}
    </p>

    <p
      v-if="!searching && !searchError && searchResults.length === 0"
      class="food-state"
    >
      No matching foods found.
    </p>

    <p
      v-if="!searching && !searchError && searchResults.length > 0"
      class="food-state"
    >
      {{ resultRangeLabel }}
    </p>

    <div
      v-if="!searching && !searchError && searchResults.length > 0"
      class="food-results-grid"
    >
      <article
        v-for="food in paginatedResults"
        :key="foodKey(food)"
        class="food-card"
        role="button"
        tabindex="0"
        @click="onCardClick(food)"
        @keyup.enter="onCardClick(food)"
        @keyup.space.prevent="onCardClick(food)"
      >
        <h3>
          {{ food.description }}
        </h3>
        <div class="food-card-actions">
         <i
            class="material-icons food-details-icon"
            title="See details"
            @click.stop="showDetails(food)"
            >visibility</i
          >
         <i
            class="material-icons food-save-icon"
            :class="{ saved: isFoodSaved(food) }"
            :title="isFoodSaved(food) ? 'Already saved' : 'Save'"
            @click.stop="saveFoodFact(food)"
            >bookmark_add</i
          >
        </div>

      </article>
    </div>

    <div
      v-if="selectedFood"
      class="food-modal-overlay"
      @click.self="clearDetails"
    >
      <section class="food-details-panel" role="dialog" aria-modal="true">
        <div class="food-details-header">
          <h3>{{ selectedFood.description }}</h3>
          <div class="food-detail-actions">
            <i
              class="material-icons food-save-icon"
              :class="{ saved: isFoodSaved(selectedFood) }"
              :title="isFoodSaved(selectedFood) ? 'Already saved' : 'Save'"
              @click="saveFoodFact(selectedFood)"
              >bookmark_add</i
            >
            <i
              class="material-icons food-close-icon"
              title="Close"
              @click="clearDetails"
              >close</i
            >
          </div>
        </div>

        <div class="nutrient-grid">
          <div class="nutrient-box">
            <span>Calories</span>
            <strong>{{ formatValue(selectedNutrients?.calories) }}</strong>
          </div>
          <div class="nutrient-box">
            <span>Protein</span>
            <strong>{{ formatValue(selectedNutrients?.protein) }} g</strong>
          </div>
          <div class="nutrient-box">
            <span>Carbs</span>
            <strong>{{ formatValue(selectedNutrients?.carbs) }} g</strong>
          </div>
          <div class="nutrient-box">
            <span>Fat</span>
            <strong>{{ formatValue(selectedNutrients?.fat) }} g</strong>
          </div>
          <div class="nutrient-box">
            <span>Fiber</span>
            <strong>{{ formatValue(selectedNutrients?.fiber) }} g</strong>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/typography';

.food-facts-view {
  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xs 0;
  }
}

.food-facts-toolbar {
  padding-top: spacing.$spacing-xxs;
  position: sticky;
  top: -10px;
  z-index: 6;
  background: color.$light-bg;

  h2 {
    @include typography.headline-180;
    margin-bottom: spacing.$spacing-base;
    color: color.$dark-medium;
  }
  @include breakpoint.media-breakpoint-up(sm) {
    padding-bottom: spacing.$spacing-xs;
  }
}

.food-search-form {
  display: flex;
  gap: spacing.$spacing-xs;
  flex-direction: column;

  input {
    width: 100%;
    border: size.$sp02 solid rgba(color.$blue-violet, 0.25);
    border-radius: size.$sp08;
    text-align: center;
    padding: spacing.$spacing-xs;
    @include typography.headline-140;
    background: color.$white;
  }

  button {
    border: none;
    border-radius: size.$sp08;
    background: color.$blue-violet;
    color: color.$white;
    padding: spacing.$spacing-xs spacing.$spacing-s;
    cursor: pointer;
    @include typography.headline-140;
  }

   @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
  }
}

.food-state {
  @include typography.headline-120;
  color: color.$muted;
  margin-bottom: spacing.$spacing-xs;
  justify-self: flex-end;
}

.food-state-error {
  color: color.$danger;
}

.food-results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: spacing.$spacing-xs;
  margin-bottom: spacing.$spacing-3-xl;
}

.food-letter-filter {
  display: flex;
  gap: spacing.$spacing-xxs;
  overflow-x: auto;
  padding: spacing.$spacing-xs;
}

.letter-chip {
  border: none;
  cursor: pointer;
  @include typography.headline-120-medium;
  flex: 0 0 auto;
  min-width: size.$sp40;
  border-radius: size.$sp10;
  padding: spacing.$spacing-xxs;
  background: color.$light-bg;
  color: color.$dark;

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }
}

.food-pagination {
  margin-top: spacing.$spacing-xs;
  margin-bottom: spacing.$spacing-xs;
  display: flex;
  flex-wrap: wrap;
  gap: spacing.$spacing-xs;
  align-items: center;

  .page-btn {
    cursor: pointer;
    display: flex;
    color: color.$blue-violet;
    transition: background 0.15s;

    i {
      @include typography.headline-200-medium;
    }
  }
}

.food-pagination-top {
  position: sticky;
  // Toolbar sticks at top: -10px, so match that offset to avoid a gap below it.
  top: calc(var(--food-toolbar-height, 0px) - 10px);
  z-index: 5;
  justify-content: flex-end;
  margin-top: 0;
  padding-bottom: spacing.$spacing-xxs;
  background: color.$light-bg;
  border-radius: size.$sp08;
}

html.dark .food-pagination-top {
  background: color.$dark;
}

.page-size-control {
  @include typography.headline-120;
  color: color.$muted;
}

.page-size-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.page-size-btn {
  display: flex;
  align-items: center;
  border: size.$sp01 solid rgba(color.$blue-violet, 0.25);
  border-radius: size.$sp08;
  min-height: size.$sp32;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  background: color.$white;
  color: color.$dark;
  cursor: pointer;
  @include typography.headline-120;

  .material-icons {
    @include typography.headline-160;
    color: color.$muted;
  }
}

.page-size-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.page-size-dropdown {
  position: absolute;
  bottom: calc(100% + #{spacing.$spacing-xxs});
  left: 0;
  z-index: 21;
  display: flex;
  flex-direction: column;
  min-width: size.$sp64;
  background: color.$white;
  border-radius: size.$sp08;
  box-shadow: size.$sp02 size.$sp04 size.$sp24 color.$dark;
  overflow: hidden;
}

.page-size-option {
  border: none;
  background: none;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  color: color.$dark;
  cursor: pointer;
  text-align: left;
  @include typography.headline-120-medium;

  &:hover {
    background: color.$light-bg-soft;
  }

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }
}

.page-btn {
  background: none;
  border: none;
  border-radius: size.$sp08;
  padding: spacing.$spacing-xxs spacing.$spacing-xs;
  cursor: pointer;
  display: flex;
  color: color.$muted;
  transition: background 0.15s;
  @include typography.headline-240;

  &:hover:not(:disabled) {
    background: rgba(color.$muted, 0.1);
  }

  &:disabled {
    color: color.$muted-lighter;
    cursor: default;
  }

  .material-icons {
      color: color.$muted;
    @include typography.headline-240;
  }
}

.page-btn-hidden {
  visibility: hidden;
}

.page-info {
  @include typography.headline-160-medium;
  color: color.$muted;
  min-width: size.$sp40;
  text-align: center;
}

html.dark .page-btn {
  color: color.$light;

  &:disabled {
    color: rgba(color.$light, 0.4);
  }
}
.food-card,
.food-details-panel,
.nutrient-box {
  border: size.$sp01 solid rgba(color.$blue-violet, 0.2);
  border-radius: size.$sp10;
  background: rgba(color.$white, 0.96);
}

.food-card {
  padding: spacing.$spacing-xs;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: spacing.$spacing-base;

  h3 {
    flex: 1;
    min-width: 0;
    @include typography.headline-140;
    margin-bottom: 0;
  }
}

.food-card-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: spacing.$spacing-xs;

  i {
    @include typography.headline-200-medium;
  }
}

.food-details-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: color.$muted;
  @include typography.headline-180;
  transition: color 0.15s;

  &:hover {
    color: color.$blue-violet;
  }
}

.food-save-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: color.$muted;
  @include typography.headline-180;
  transition: color 0.15s;

  &:hover {
    color: color.$muted-lighter;
  }

  &.saved {
  color: color.$blue-violet;
    cursor: default;
  }
}

.food-meta {
  @include typography.headline-100;
  color: color.$muted;
  margin-bottom: spacing.$spacing-base;
}

.food-details-panel {
  padding: spacing.$spacing-xs;
  width: min(size.$sp-max-desktop, 92vw);
  max-height: 82vh;
  overflow-y: auto;
}

.food-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(color.$dark, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: spacing.$spacing-s;
}

.food-details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: spacing.$spacing-xs;
  margin-bottom: spacing.$spacing-base;

  h3 {
    @include typography.headline-160;
  }
}

.food-detail-actions {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xs;
  flex-shrink: 0;

  i {
    @include typography.headline-200-medium;
  }
}

.food-close-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: size.$sp32;
  height: size.$sp32;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: color.$blue-violet;
    color: color.$white;
  }
}

.nutrient-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: spacing.$spacing-base;
}

.nutrient-box {
  padding: spacing.$spacing-base;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-base;

  span {
    @include typography.headline-100;
    color: color.$muted;
  }

  strong {
    @include typography.headline-160;
    color: color.$dark;
  }
}

html.dark {
  .food-facts-toolbar {
    background: color.$dark;

    h2 {
      color: color.$light;
    }
  }

  .food-state {
    color: color.$light50;
  }

  .food-state-error {
    color: color.$danger-light;
  }

  .food-card,
  .food-details-panel,
  .nutrient-box {
    background: color.$dark-medium;
    border-color: rgba(color.$light, 0.15);
  }

  .food-card h3,
  .food-details-header h3,
  .nutrient-box strong {
    color: color.$light;
  }

  .food-meta,
  .nutrient-box span {
    color: color.$light50;
  }

  .letter-chip {
    background: rgba(color.$light, 0.12);
    color: color.$light;
  }

  .page-size-control {
    color: color.$light50;
  }

  .page-size-btn {
    background: color.$dark-medium;
    color: color.$light;
    border-color: rgba(color.$light, 0.25);
  }

  .page-size-dropdown {
    background: color.$dark-medium;
  }

  .page-size-option {
    color: color.$light;

    &:hover {
      background: rgba(color.$light, 0.1);
    }
  }

  .letter-chip.active {
    background: color.$gold;
    color: color.$white;
  }

  .food-modal-overlay {
    background: rgba(color.$dark-deep, 0.72);
  }
}

html.dark .page-size-control {
  color: color.$white;
}

@include breakpoint.media-breakpoint-down(md) {
  .food-results-grid,
  .nutrient-grid {
    grid-template-columns: 1fr;
  }
}

html.dark .food-search-form {
  input {
    border: size.$sp02 solid rgba(color.$white, 0.25);
    background: color.$dark;
  }

  button {
    background: color.$gold;
    color: color.$white;
  }
}

html.dark .food-save-icon {
  color: color.$muted !important;

  &.saved {
    color: color.$gold !important;
  }
}

html.dark .food-close-icon {
  background: rgba(color.$gold, 0.12);
  color: color.$gold;
  &:hover {
    background: color.$gold;
    color: color.$white;
  }
}
</style>
