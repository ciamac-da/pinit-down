<script>
import { extractCoreNutrients } from '@/services/foodFactsApi';

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
    visiblePageNumbers() {
      const windowSize = 7;
      if (this.totalPages <= windowSize) {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
      }

      const halfWindow = Math.floor(windowSize / 2);
      let start = Math.max(1, this.currentPage - halfWindow);
      let end = Math.min(this.totalPages, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);

      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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
    onPageSizeChange(event) {
      const selected = Number(event.target.value);
      this.pageSize = Number.isFinite(selected) && selected > 0 ? selected : 20;
      this.currentPage = 1;
    },
    foodKey(food) {
      return `${food.fdcId ?? 'no-id'}:${food.description}`;
    },
    isFoodSaved(food) {
      return this.savedFoodFactKeys.includes(this.foodKey(food));
    },
    saveFoodFact(food) {
      if (this.isFoodSaved(food)) return;
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
  },
  async mounted() {
    await this.loadDataset();
    this.runSearch();
  },
};
</script>

<template>
  <div class="food-facts-view">
    <div class="food-facts-toolbar">
      <h2>Food Facts</h2>
      <form class="food-search-form" @submit.prevent="runSearch">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search foods like salmon, yogurt, brown rice"
        />
        <button type="submit">Search</button>
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
        <h3>{{ food.description }}</h3>
        <div class="food-card-actions">
          <button type="button" @click.stop="showDetails(food)">
            See details
          </button>
          <button
            type="button"
            class="save-food-btn"
            :class="{ saved: isFoodSaved(food) }"
            :disabled="isFoodSaved(food)"
            @click.stop="saveFoodFact(food)"
          >
            {{ isFoodSaved(food) ? 'Saved' : 'Save' }}
          </button>
        </div>
      </article>
    </div>

    <div v-if="searchResults.length > 0" class="food-pagination">
      <label class="page-size-control" for="food-page-size"> Per page </label>
      <select
        id="food-page-size"
        class="page-size-select"
        :value="pageSize"
        @change="onPageSizeChange"
      >
        <option
          v-for="sizeOption in pageSizeOptions"
          :key="sizeOption"
          :value="sizeOption"
        >
          {{ sizeOption }}
        </option>
      </select>

      <button
        type="button"
        class="pagination-btn"
        :disabled="isAtFirstPage"
        @click="previousPage"
      >
        Prev
      </button>
      <button
        v-for="pageNumber in visiblePageNumbers"
        :key="pageNumber"
        type="button"
        class="pagination-btn"
        :class="{ active: currentPage === pageNumber }"
        @click="goToPage(pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button
        type="button"
        class="pagination-btn"
        :disabled="isAtLastPage"
        @click="nextPage"
      >
        Next
      </button>
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
            <button
              type="button"
              class="save-food-btn"
              :class="{ saved: isFoodSaved(selectedFood) }"
              :disabled="isFoodSaved(selectedFood)"
              @click="saveFoodFact(selectedFood)"
            >
              {{ isFoodSaved(selectedFood) ? 'Saved' : 'Save' }}
            </button>
            <button type="button" @click="clearDetails">Close</button>
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
  position: sticky;
  top: 0;
  z-index: 6;
  background: color.$white;

  h2 {
    @include typography.headline-180;
    margin-bottom: spacing.$spacing-base;
    color: color.$dark-medium;
  }
  @include breakpoint.media-breakpoint-up(sm) {
    padding-bottom: spacing.$spacing-xs;
  }
}

html.dark .food-facts-toolbar {
  background: color.$dark;
  h2 {
    color: color.$white;
  }
}

.food-search-form {
  display: flex;
  gap: spacing.$spacing-xxs;

  input {
    width: 100%;
    border: size.$sp02 solid rgba(color.$blue-violet, 0.25);
    border-radius: size.$sp08;
    padding: spacing.$spacing-xs;
    @include typography.headline-140;
    background: color.$white;
  }

  button {
    border: none;
    border-radius: size.$sp08;
    background: color.$gradient;
    color: color.$white;
    padding: spacing.$spacing-xs spacing.$spacing-s;
    cursor: pointer;
    @include typography.headline-140;
  }
}

.food-state {
  @include typography.headline-120;
  color: color.$muted;
  margin-bottom: spacing.$spacing-xs;
}

.food-state-error {
  color: color.$danger;
}

.food-results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: spacing.$spacing-xs;
}

.food-letter-filter {
  display: flex;
  gap: spacing.$spacing-base;
  overflow-x: auto;
  padding: spacing.$spacing-base;
  margin-bottom: spacing.$spacing-xxs;
}

.letter-chip,
.pagination-btn {
  border: none;
  cursor: pointer;
  @include typography.headline-120-medium;
}

.letter-chip {
  flex: 0 0 auto;
  min-width: size.$sp40;
  border-radius: size.$sp10;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  background: color.$light-bg;
  color: color.$dark;

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }
}

.food-pagination {
  margin-top: spacing.$spacing-xs;
  display: flex;
  flex-wrap: wrap;
  gap: spacing.$spacing-base;
  align-items: center;
}

.page-size-control {
  @include typography.headline-120;
  color: color.$muted;
}

.page-size-select {
  border: size.$sp01 solid rgba(color.$blue-violet, 0.25);
  border-radius: size.$sp08;
  min-height: size.$sp32;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  background: color.$white;
  color: color.$dark;
  @include typography.headline-120;
}

.pagination-btn {
  min-height: size.$sp32;
  min-width: size.$sp32;
  border-radius: size.$sp08;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

html.dark .pagination-btn {
  background: color.$white;
  color: color.$dark;

  &.active {
    background: color.$blue-violet;
    color: color.$white;
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

  h3 {
    @include typography.headline-140;
    margin-bottom: spacing.$spacing-base;
  }

  button {
    border: none;
    border-radius: size.$sp08;
    background: rgba(color.$gold, 0.2);
    color: color.$dark-medium;
    padding: spacing.$spacing-base spacing.$spacing-xs;
    cursor: pointer;
    @include typography.headline-120-medium;
  }
}

.food-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: spacing.$spacing-base;
}

.save-food-btn {
  border: none;
  border-radius: size.$sp08;
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;
  padding: spacing.$spacing-base spacing.$spacing-xs;
  cursor: pointer;
  @include typography.headline-120-medium;

  &.saved {
    background: rgba(color.$danger, 0.14);
    color: color.$danger-dark;
  }

  &:disabled {
    cursor: default;
    opacity: 0.9;
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

  button {
    border: none;
    border-radius: size.$sp08;
    background: rgba(color.$gold, 0.2);
    color: color.$dark-medium;
    padding: spacing.$spacing-base spacing.$spacing-xs;
    cursor: pointer;
    @include typography.headline-120-medium;
  }
}

.food-detail-actions {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-base;
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

:global(.dark) {
  .food-facts-toolbar {
    background: color.$dark-deep;

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

  .save-food-btn {
    background: rgba(color.$light, 0.12);
    color: color.$light;

    &.saved {
      background: rgba(color.$danger-light, 0.2);
      color: color.$light;
    }
  }

  .food-meta,
  .nutrient-box span {
    color: color.$light50;
  }

  .letter-chip,
  .pagination-btn {
    background: rgba(color.$light, 0.12);
    color: color.$light;
  }

  .page-size-control {
    color: color.$light50;
  }

  .page-size-select {
    background: color.$dark-medium;
    color: color.$light;
    border-color: rgba(color.$light, 0.25);
  }

  .letter-chip.active,
  .pagination-btn.active {
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

@media (max-width: 767px) {
  .food-search-form {
    flex-direction: column;
  }

  .food-results-grid,
  .nutrient-grid {
    grid-template-columns: 1fr;
  }
}
</style>
