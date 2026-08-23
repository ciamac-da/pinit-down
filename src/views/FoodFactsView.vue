<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppFooter from '@/components/layout/AppFooter.vue';
import { useThemeStore } from '@/stores/ThemeStore';
import { extractCoreNutrients } from '@/services/foodFactsApi';

const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();

const copyrightYear = ref(new Date().getFullYear());

const searchQuery = ref('');
const isSearching = ref(false);
const searchError = ref('');
const searchResults = ref([]);
const foundationFoods = ref([]);
const isDatasetLoading = ref(false);
const datasetError = ref('');

const detailsFood = ref(null);
const detailsLoading = ref(false);
const detailsError = ref('');

const activeDetailsId = computed(() => {
  const fdcId = Number(route.params.fdcId);
  return Number.isFinite(fdcId) && fdcId > 0 ? fdcId : null;
});

const formatValue = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '-';
  return numberValue.toFixed(1);
};

const runSearch = async () => {
  if (!foundationFoods.value.length) {
    searchResults.value = [];
    searchError.value = datasetError.value || 'Food dataset is not loaded yet.';
    return;
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    searchResults.value = [];
    searchError.value = '';
    return;
  }

  searchError.value = '';
  isSearching.value = true;

  try {
    const filteredFoods = foundationFoods.value
      .filter((food) => food?.description?.toLowerCase().includes(query))
      .sort((a, b) => a.description.localeCompare(b.description))
      .slice(0, 20);

    searchResults.value = filteredFoods;
  } catch (error) {
    searchResults.value = [];
    searchError.value =
      error instanceof Error
        ? error.message
        : 'Unable to search foods right now.';
  } finally {
    isSearching.value = false;
  }
};

const openDetails = (fdcId) => {
  router.push({ name: 'FoodFactsDetails', params: { fdcId } });
};

const closeDetails = () => {
  router.push({ name: 'FoodFacts' });
};

const loadDetails = async (fdcId) => {
  detailsError.value = '';
  detailsLoading.value = true;

  try {
    const matchedFood = foundationFoods.value.find(
      (food) => Number(food.fdcId) === Number(fdcId),
    );

    if (!matchedFood) {
      throw new Error('Food details not found in local dataset.');
    }

    detailsFood.value = matchedFood;
  } catch (error) {
    detailsFood.value = null;
    detailsError.value =
      error instanceof Error
        ? error.message
        : 'Unable to load food details right now.';
  } finally {
    detailsLoading.value = false;
  }
};

const goHome = () => {
  router.push({ name: 'Home' });
};

watch(activeDetailsId, async (fdcId) => {
  if (!fdcId) {
    detailsFood.value = null;
    detailsError.value = '';
    return;
  }

  if (!foundationFoods.value.length) {
    detailsError.value = datasetError.value || 'Food dataset is not loaded yet.';
    detailsFood.value = null;
    return;
  }

  await loadDetails(fdcId);
}, { immediate: true });

onMounted(() => {
  themeStore.loadTheme();
  copyrightYear.value = new Date().getFullYear();

  const loadDataset = async () => {
    isDatasetLoading.value = true;
    datasetError.value = '';

    try {
      const response = await fetch('/foundation-foods.json');
      if (!response.ok) {
        throw new Error('Could not load foundation-foods.json from public folder.');
      }

      const payload = await response.json();
      const foods = Array.isArray(payload?.FoundationFoods)
        ? payload.FoundationFoods
        : [];

      foundationFoods.value = foods;
      if (!foods.length) {
        datasetError.value = 'No foods found in local dataset.';
      }

      if (activeDetailsId.value && foods.length) {
        await loadDetails(activeDetailsId.value);
      }
    } catch (error) {
      foundationFoods.value = [];
      datasetError.value =
        error instanceof Error
          ? error.message
          : 'Failed to load local food dataset.';
    } finally {
      isDatasetLoading.value = false;
    }
  };

  loadDataset();
});
</script>

<template>
  <main class="food-facts-page">
    <section class="hero">
      <div>
        <p class="kicker">Nutrition Tools</p>
        <h1>Food Facts</h1>
        <p class="subtitle">
          Search your local USDA Foundation Foods dataset and inspect nutrition details.
        </p>
      </div>
      <div class="hero-actions">
        <button class="secondary-btn" @click="goHome">Back To Cart</button>
        <button
          class="secondary-btn"
          :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          @click="themeStore.toggleTheme()"
        >
          <i class="material-icons">{{ themeStore.isDark ? 'light_mode' : 'dark_mode' }}</i>
          Theme
        </button>
      </div>
    </section>

    <section class="panel">
      <h2>1. Search Foods</h2>
      <p v-if="isDatasetLoading" class="status">Loading local dataset...</p>
      <p v-else-if="datasetError" class="status error">{{ datasetError }}</p>
      <p v-else class="status">Loaded {{ foundationFoods.length }} foods from local JSON.</p>

      <form class="inline-form" @submit.prevent="runSearch">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Try: salmon, greek yogurt, brown rice"
        />
        <button class="primary-btn" type="submit">Search</button>
      </form>

      <p v-if="isSearching" class="status">Searching...</p>
      <p v-else-if="searchError" class="status error">{{ searchError }}</p>
      <p v-else-if="searchResults.length === 0" class="status">
        Search to find foods.
      </p>

      <div v-else class="results-grid">
        <article v-for="food in searchResults" :key="food.fdcId" class="food-card">
          <h3>{{ food.description }}</h3>
          <p class="meta">{{ food.brandName || food.dataType || 'USDA entry' }}</p>
          <p class="meta">FDC ID: {{ food.fdcId }}</p>
          <div class="card-actions">
            <button class="chip-btn" @click="openDetails(food.fdcId)">View details</button>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2>2. Food Details Page</h2>
      <p class="status" v-if="!activeDetailsId">
        Pick a food from search results to open details.
      </p>
      <p class="status" v-else-if="detailsLoading">Loading details...</p>
      <p class="status error" v-else-if="detailsError">{{ detailsError }}</p>

      <article v-else-if="detailsFood" class="details-card">
        <div class="details-header">
          <h3>{{ detailsFood.description }}</h3>
          <button class="chip-btn" @click="closeDetails">Close details</button>
        </div>
        <p class="meta">
          {{ detailsFood.brandOwner || detailsFood.dataType || 'USDA record' }}
        </p>
        <p class="meta">FDC ID: {{ detailsFood.fdcId }}</p>

        <div class="nutrient-grid">
          <div class="nutrient-box">
            <span>Calories</span>
            <strong>{{ formatValue(extractCoreNutrients(detailsFood).calories) }}</strong>
          </div>
          <div class="nutrient-box">
            <span>Protein</span>
            <strong>{{ formatValue(extractCoreNutrients(detailsFood).protein) }} g</strong>
          </div>
          <div class="nutrient-box">
            <span>Carbs</span>
            <strong>{{ formatValue(extractCoreNutrients(detailsFood).carbs) }} g</strong>
          </div>
          <div class="nutrient-box">
            <span>Fat</span>
            <strong>{{ formatValue(extractCoreNutrients(detailsFood).fat) }} g</strong>
          </div>
          <div class="nutrient-box">
            <span>Fiber</span>
            <strong>{{ formatValue(extractCoreNutrients(detailsFood).fiber) }} g</strong>
          </div>
        </div>
      </article>
    </section>

    <AppFooter :year="copyrightYear" />
  </main>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/typography';

.food-facts-page {
  min-height: 100vh;
  padding: calc(size.$sp76 + spacing.$spacing-base) spacing.$spacing-xxs spacing.$spacing-2-xl;
  background:
    radial-gradient(circle at 10% 0%, rgba(color.$gold, 0.28), transparent 40%),
    linear-gradient(170deg, rgba(color.$blue-violet, 0.08), rgba(color.$white, 0.82));
}

.hero,
.panel {
  width: min(100%, size.$sp-max-desktop);
  margin: 0 auto spacing.$spacing-xxs;
  border: size.$sp02 solid rgba(color.$blue-violet, 0.2);
  border-radius: size.$sp12;
  background: rgba(color.$white, 0.9);
  box-shadow: 0 size.$sp12 size.$sp40 rgba(color.$dark, 0.08);
}

.hero {
  display: grid;
  grid-template-columns: 1.3fr auto;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xxs;

  .kicker {
    @include typography.headline-120-medium;
    letter-spacing: size.$sp01;
    text-transform: uppercase;
    color: color.$blue-violet;
    margin-bottom: spacing.$spacing-base;
  }

  h1 {
    @include typography.headline-240;
    margin-bottom: spacing.$spacing-xs;
  }

  .subtitle {
    @include typography.headline-140;
    color: color.$dark-soft;
    max-width: size.$sp80;
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: spacing.$spacing-base;
  align-content: start;
}

.panel {
  padding: spacing.$spacing-xxs;

  h2 {
    margin-bottom: spacing.$spacing-xs;
    @include typography.headline-180;
  }
}

.inline-form {
  display: flex;
  gap: spacing.$spacing-base;
  margin-bottom: spacing.$spacing-xs;
}

input,
textarea {
  width: 100%;
  border: size.$sp02 solid rgba(color.$blue-violet, 0.35);
  border-radius: size.$sp08;
  padding: spacing.$spacing-xs;
  @include typography.headline-140;
  background: color.$white;
}

.primary-btn,
.secondary-btn,
.chip-btn {
  border: none;
  border-radius: size.$sp08;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 size.$sp08 size.$sp18 rgba(color.$dark, 0.12);
  }
}

.primary-btn {
  background: color.$gradient;
  color: color.$white;
  padding: spacing.$spacing-xs spacing.$spacing-s;
  @include typography.headline-140;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: spacing.$spacing-base;
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-deeper;
  padding: spacing.$spacing-xs spacing.$spacing-s;
  @include typography.headline-140;
}

.chip-btn {
  background: rgba(color.$gold, 0.18);
  color: color.$dark;
  padding: spacing.$spacing-base spacing.$spacing-xs;
  @include typography.headline-120-medium;
}

.status {
  @include typography.headline-120;
  color: color.$dark-soft;
  margin-bottom: spacing.$spacing-xs;
}

.status.error {
  color: color.$danger;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: spacing.$spacing-xs;
}

.food-card,
.details-card,
.pick-card,
.totals {
  border: size.$sp01 solid rgba(color.$blue-violet, 0.2);
  border-radius: size.$sp10;
  background: rgba(color.$white, 0.95);
  padding: spacing.$spacing-xs;
}

.food-card h3,
.details-card h3 {
  @include typography.headline-140;
  margin-bottom: spacing.$spacing-base;
}

.meta {
  @include typography.headline-100;
  color: color.$muted;
  margin-bottom: spacing.$spacing-base;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: spacing.$spacing-base;
}

.details-header {
  display: flex;
  justify-content: space-between;
  gap: spacing.$spacing-xs;
  align-items: center;
}

.nutrient-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: spacing.$spacing-base;
}

.nutrient-box {
  border: size.$sp01 solid rgba(color.$blue-violet, 0.2);
  border-radius: size.$sp08;
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
  }
}

@media (max-width: 767px) {
  .food-facts-page {
    padding-top: calc(size.$sp76 + spacing.$spacing-xs);
    padding-left: spacing.$spacing-base;
    padding-right: spacing.$spacing-base;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-actions,
  .inline-form {
    flex-direction: column;
  }

  .results-grid,
  .nutrient-grid {
    grid-template-columns: 1fr;
  }

  .details-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
