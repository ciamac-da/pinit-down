<script>
import CartItemDetails from '@/components/CartItemDetails.vue';
import RecipeCard from '@/components/recipes/RecipeCard.vue';

export default {
  components: {
    CartItemDetails,
    RecipeCard,
  },
  props: {
    templateFilter: {
      type: String,
      default: 'cart',
    },
    favoriteCartTemplateCount: {
      type: Number,
      default: 0,
    },
    favoriteRecipeTemplateCount: {
      type: Number,
      default: 0,
    },
    favoriteFoodFactTemplateCount: {
      type: Number,
      default: 0,
    },
    favoriteCartTemplatesByGroup: {
      type: Object,
      default: () => ({}),
    },
    favoriteRecipeTemplates: {
      type: Array,
      default: () => [],
    },
    favoriteFoodFactTemplates: {
      type: Array,
      default: () => [],
    },
    savedCount: {
      type: Number,
      default: 0,
    },
    savedPlaces: {
      type: Array,
      default: () => [],
    },
  },
  emits: [
    'update:templateFilter',
    'open-favorite-recipe',
    'download-recipe',
    'download-group-pdf',
    'delete-favorite-group',
    'delete-favorite-item',
    'delete-favorite-recipe',
    'delete-favorite-food-fact',
    'delete-saved-place',
  ],
  data() {
    return {
      selectedPlace: null,
    };
  },
  computed: {
    savedPlacesByCategory() {
      const groups = {};
      for (const place of this.savedPlaces) {
        // Prefer subcategory (e.g. "Restaurants") over broad category (e.g. "Food & Drink").
        const cat = place.subcategory || place.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(place);
      }
      return groups;
    },
  },
  methods: {
    openPlaceModal(place) {
      this.selectedPlace = place;
    },
    openInMaps(provider) {
      if (!this.selectedPlace) return;
      const { lat, lon, name } = this.selectedPlace;
      const enc = encodeURIComponent(name);
      const isNativeApple = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isAndroid = /android/i.test(navigator.userAgent);
      let url;
      if (provider === 'apple') {
        url = isNativeApple
          ? `maps://?q=${enc}&sll=${lat},${lon}&z=16`
          : `https://maps.apple.com/?q=${enc}&sll=${lat},${lon}&z=16`;
      } else {
        url = isAndroid
          ? `geo:${lat},${lon}?q=${lat},${lon}(${enc})`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      }
      window.open(url, '_blank', 'noopener');
      this.selectedPlace = null;
    },
  },
};
</script>

<template>
  <div>
    <div class="favorites-template-toggle">
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'cart' }"
        @click="$emit('update:templateFilter', 'cart')"
      >
        Saved Shops ({{ favoriteCartTemplateCount }})
      </button>
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'recipes' }"
        @click="$emit('update:templateFilter', 'recipes')"
      >
        Saved Recipe ({{ favoriteRecipeTemplateCount }})
      </button>
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'foods' }"
        @click="$emit('update:templateFilter', 'foods')"
      >
        Saved Foods ({{ favoriteFoodFactTemplateCount }})
      </button>
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'places' }"
        @click="$emit('update:templateFilter', 'places')"
      >
        Saved Places ({{ savedPlaces.length }})
      </button>
    </div>
    <p class="favorite-info-hint">
      <i class="material-icons">bookmark_add</i>
      Saved templates are <strong>read-only templates</strong> from cart,
      recipes, food facts and places.
    </p>

    <div v-if="templateFilter === 'cart'">
      <div
        v-for="groupName in Object.keys(favoriteCartTemplatesByGroup)"
        :key="groupName"
        class="item-group"
      >
        <div class="group-header favorites-group-header">
          <div class="group-header-top">
            <span class="group-name">{{ groupName }}</span>
            <span class="group-count"
              >{{ favoriteCartTemplatesByGroup[groupName].length }}
              {{
                favoriteCartTemplatesByGroup[groupName].length <= 1
                  ? 'saved item'
                  : 'saved items'
              }}</span
            >
          </div>
          <div class="group-header-bottom">
            <button
              type="button"
              class="download-group-btn"
              @click.stop="$emit('download-group-pdf', groupName)"
              title="Download saved shopping list"
            >
              <i class="material-icons">picture_as_pdf</i>
              Download
            </button>
            <button
              class="delete-group-btn"
              @click.stop="$emit('delete-favorite-group', groupName)"
              title="Delete saved shop"
            >
              <i class="material-icons">delete</i>
              Delete
            </button>
          </div>
        </div>
        <div
          v-for="(item, idx) in favoriteCartTemplatesByGroup[groupName]"
          :key="item._id"
          class="favorite-template-row"
        >
          <button
            type="button"
            class="delete-saved-item-btn"
            title="Remove saved item"
            @click="$emit('delete-favorite-item', item)"
          >
            <i class="material-icons">delete</i>
          </button>
          <CartItemDetails
            :cart-item="item"
            :index="idx"
            :total="favoriteCartTemplatesByGroup[groupName].length"
            :is-saved-view="true"
            :can-delete="false"
          />
        </div>
      </div>
      <p
        v-if="Object.keys(favoriteCartTemplatesByGroup).length === 0"
        class="empty-state"
      >
        No saved shopping list templates yet.
      </p>
    </div>

    <div v-else-if="templateFilter === 'recipes'">
      <div v-if="favoriteRecipeTemplates.length > 0" class="recipes-grid">
        <div
          v-for="favoriteRecipe in favoriteRecipeTemplates"
          :key="favoriteRecipe.key"
          class="saved-template-card"
        >
          <button
            type="button"
            class="remove-template-btn"
            title="Remove saved recipe"
            @click="$emit('delete-favorite-recipe', favoriteRecipe)"
          >
            Delete
          </button>
          <RecipeCard
            :recipe="favoriteRecipe"
            :show-save-action="false"
            @open-details="$emit('open-favorite-recipe', $event)"
            @download-recipe="$emit('download-recipe', $event)"
          />
        </div>
      </div>
      <p v-else class="empty-state">No saved recipe templates yet.</p>
    </div>

    <div v-else-if="templateFilter === 'foods'">
      <div v-if="favoriteFoodFactTemplates.length > 0" class="recipes-grid">
        <article
          v-for="foodFact in favoriteFoodFactTemplates"
          :key="foodFact.key"
          class="food-fact-template-card"
        >
          <button
            type="button"
            class="remove-template-btn"
            title="Remove saved food fact"
            @click="$emit('delete-favorite-food-fact', foodFact)"
          >
            Delete
          </button>

          <h3>{{ foodFact.title }}</h3>
          <p class="food-meta">Calories: {{ foodFact.nutrients.calories }}</p>
          <p class="food-meta">Protein: {{ foodFact.nutrients.protein }}</p>
          <p class="food-meta">Carbs: {{ foodFact.nutrients.carbs }}</p>
          <p class="food-meta">Fat: {{ foodFact.nutrients.fat }}</p>
          <p class="food-meta">Fiber: {{ foodFact.nutrients.fiber }}</p>
        </article>
      </div>
      <p v-else class="empty-state">No saved food facts yet.</p>
    </div>

    <div v-else-if="templateFilter === 'places'">
      <div v-if="savedPlaces.length > 0" class="saved-places-list">
        <template
          v-for="(places, catLabel) in savedPlacesByCategory"
          :key="catLabel"
        >
          <div class="saved-places-category-header">
            <i class="material-icons">{{ places[0].icon || 'place' }}</i>
            {{ catLabel }}
          </div>
          <div
            v-for="place in places"
            :key="place.id"
            class="saved-place-row"
            role="button"
            tabindex="0"
            @click="openPlaceModal(place)"
            @keyup.enter="openPlaceModal(place)"
          >
            <div class="saved-place-icon">
              <i class="material-icons">{{ place.icon || 'place' }}</i>
            </div>
            <div class="saved-place-info">
              <span class="saved-place-name">{{ place.name }}</span>
              <span class="saved-place-address">{{
                place.address || 'Address not available'
              }}</span>
            </div>
            <div class="saved-place-actions">
              <i class="material-icons saved-place-open-icon">location_on</i>
              <button
                class="delete-place-btn"
                @click.stop="$emit('delete-saved-place', place)"
                title="Remove saved place"
              >
                <i class="material-icons">delete</i>
              </button>
            </div>
          </div>
        </template>
      </div>
      <p v-else class="empty-state">
        No saved places yet. Find places in the Places tab and save them.
      </p>
    </div>

    <p v-if="savedCount === 0 && !savedPlaces.length" class="empty-state">
      No saved templates yet. Save from Cart or Recipes to create templates.
    </p>

    <!-- Map picker for saved places -->
    <div
      v-if="selectedPlace"
      class="place-picker-overlay"
      @click.self="selectedPlace = null"
    >
      <div class="place-picker">
        <p class="place-picker-label">Open in maps</p>
        <p class="place-picker-name">{{ selectedPlace.name }}</p>
        <p class="place-picker-address">{{ selectedPlace.address }}</p>
        <div class="place-picker-buttons">
          <button class="map-btn google-btn" @click="openInMaps('google')">
            <i class="material-icons">map</i>
            Google Maps
          </button>
          <button class="map-btn apple-btn" @click="openInMaps('apple')">
            <i class="material-icons">map</i>
            Apple Maps
          </button>
        </div>
        <button class="place-picker-cancel" @click="selectedPlace = null">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.favorite-info-hint {
  color: color.$muted;
  @include typography.headline-120;
  display: flow;
  align-items: center;
  text-align: center;

  .material-icons {
    color: color.$danger;
    @include typography.headline-120;
    align-self: center;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    padding-top: spacing.$spacing-m;
  }
}

.favorites-template-toggle {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xs 0;
  position: sticky;
  top: -10px;
  z-index: 8;
  background: color.$light-bg;

  @include breakpoint.media-breakpoint-up(sm) {
    margin-bottom: spacing.$spacing-xl;
  }
}

.favorite-type-btn {
  border: none;
  border-radius: size.$sp10;
  padding: spacing.$spacing-xxs spacing.$spacing-xs;
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;
  cursor: pointer;
  @include typography.headline-120-medium;
  transition: 0.18s ease;

  &:hover {
    filter: brightness(0.96);
  }

  &.active {
    background: color.$gold;
    color: color.$white;
  }
}

.item-group {
  padding: spacing.$spacing-s spacing.$spacing-base;
  margin-bottom: spacing.$spacing-s;
  border-bottom: size.$sp02 solid color.$border-dark;
}

.group-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: spacing.$spacing-xxs;
  background: color.$gradient;
  border-radius: size.$sp06;
  margin-bottom: spacing.$spacing-xxs;

  .group-header-top {
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
  }

  .group-name {
    @include typography.headline-160-medium;
    color: color.$light;
    letter-spacing: spacing.$spacing-base * 0.5;
    text-transform: uppercase;
  }

  .group-count {
    @include typography.headline-120;
    color: rgba(color.$light, 0.8);
  }

  .group-header-bottom {
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
  }

  .delete-group-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(color.$light, 0.7);
    display: flex;
    align-items: center;
    padding: 0;
    transition: color 0.15s;

    .material-icons {
      @include typography.headline-200;
    }

    &:hover {
      color: color.$light;
    }
  }

  .download-group-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(color.$light, 0.8);
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
    padding: 0;
    transition: color 0.15s;
    @include typography.headline-120-medium;

    .material-icons {
      @include typography.headline-200;
    }

    &:hover {
      color: color.$light;
    }
  }
}

.favorites-group-header {
  cursor: default;

  &:active {
    cursor: default;
  }
}

.favorite-template-row {
  display: flex;
  align-items: center;
  width: 100%;

  :deep(.cart-items) {
    flex: 1;
    margin-top: spacing.$spacing-xxs;
  }
}

.delete-saved-item-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: color.$muted;
  padding: spacing.$spacing-xxs;
  display: flex;
  align-items: center;

  .material-icons {
    @include typography.headline-180;
  }

  &:hover {
    color: color.$danger;
  }
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: spacing.$spacing-s;

  @include breakpoint.media-breakpoint-up(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include breakpoint.media-breakpoint-up(lg) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.saved-template-card,
.food-fact-template-card {
  position: relative;
}

.remove-template-btn {
  position: absolute;
  top: spacing.$spacing-base;
  right: spacing.$spacing-base;
  z-index: 2;
  border: none;
  border-radius: size.$sp08;
  min-height: size.$sp24;
  padding: 0 spacing.$spacing-base;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(color.$dark-deep, 0.9);
  color: color.$white;
  @include typography.headline-100;
}

.saved-places-list {
  display: flex;
  flex-direction: column;
}

.saved-places-category-header {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  background: color.$gradient;
  color: color.$light;
  @include typography.headline-120-medium;
  border-radius: size.$sp08;
  margin-top: spacing.$spacing-xxs;

  .material-icons {
    @include typography.headline-160;
  }
}

.saved-place-row {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  border-bottom: size.$sp01 solid color.$border-light;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: color.$light-bg-soft;
  }
  &:last-child {
    border-bottom: none;
  }
}

.saved-place-actions {
  display: flex;
  align-items: center;
  gap: size.$sp02;
  flex-shrink: 0;
}

.saved-place-open-icon {
  @include typography.headline-240;
  color: color.$blue-violet;
  opacity: 0.7;
}

.saved-place-icon {
  background: rgba(color.$blue-violet, 0.1);
  border-radius: 50%;
  width: size.$sp32;
  height: size.$sp32;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .material-icons {
    @include typography.headline-160;
    color: color.$blue-violet;
  }
}

.saved-place-info {
  display: flex;
  flex-direction: column;
  gap: size.$sp02;
  min-width: 0;
  flex: 1;
}

.saved-place-name {
  @include typography.headline-140-medium;
  color: color.$dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.saved-place-address {
  @include typography.headline-120;
  color: color.$muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-place-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: color.$muted-lighter;
  display: flex;
  padding: spacing.$spacing-base;
  flex-shrink: 0;

  &:hover {
    color: color.$danger;
  }

  .material-icons {
    @include typography.headline-180;
  }
}

.place-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 500;
}

.place-picker {
  width: 100%;
  background: color.$white;
  padding: spacing.$spacing-s;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;
  border-radius: size.$sp12 size.$sp12 0 0;
}

.place-picker-label {
  @include typography.headline-120;
  color: color.$muted;
  margin: 0;
  text-align: center;
}

.place-picker-name {
  @include typography.headline-160-medium;
  color: color.$dark;
  margin: 0;
  text-align: center;
}

.place-picker-address {
  @include typography.headline-120;
  color: color.$muted;
  margin: 0;
  text-align: center;
}

.place-picker-buttons {
  display: flex;
  gap: spacing.$spacing-xxs;
  margin-top: spacing.$spacing-base;
}

.map-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: spacing.$spacing-base;
  padding: spacing.$spacing-xxs;
  border: none;
  border-radius: size.$sp10;
  cursor: pointer;
  @include typography.headline-140-medium;
  transition: filter 0.15s;

  .material-icons {
    @include typography.headline-180;
  }
  &:hover {
    filter: brightness(0.92);
  }

  &.google-btn {
    background: color.$blue-violet;
    color: color.$white;
  }
  &.apple-btn {
    background: color.$dark;
    color: color.$white;
  }
}

.place-picker-cancel {
  background: none;
  border: none;
  cursor: pointer;
  @include typography.headline-120;
  color: color.$muted;
  text-align: center;
  padding: spacing.$spacing-base 0 0;
  &:hover {
    color: color.$dark;
  }
}

.food-fact-template-card {
  border: size.$sp02 solid color.$border-light;
  border-radius: size.$sp12;
  padding: spacing.$spacing-s;
  background: color.$white;

  h3 {
    margin: 0 0 spacing.$spacing-xxs;
    @include typography.headline-160-medium;
    color: color.$dark;
    padding-right: size.$sp32;
  }
}

.food-meta {
  margin: 0 0 spacing.$spacing-base;
  color: color.$muted;
  @include typography.headline-120;
}

.empty-state {
  text-align: center;
  @include typography.headline-160;
  color: color.$muted-lighter;
  margin-top: spacing.$spacing-s;
}

html.dark .favorite-type-btn {
  background: rgba(color.$light, 0.12);
  color: color.$light;
}

html.dark .favorite-type-btn.active {
  background: color.$gold;
  color: color.$white;
}

html.dark .food-fact-template-card {
  background: color.$dark-medium;
  border-color: rgba(color.$light, 0.12);

  h3 {
    color: color.$light;
  }
}

html.dark .food-meta {
  color: color.$light50;
}

html.dark .remove-template-btn {
  background: rgba(color.$danger-light, 0.2);
  color: color.$light;
}

html.dark .favorites-template-toggle {
  background: color.$dark;
}
</style>
