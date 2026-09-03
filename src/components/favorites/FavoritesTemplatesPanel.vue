<script>
import CartItemDetails from '@/components/CartItemDetails.vue';
import RecipeCard from '@/components/recipes/RecipeCard.vue';
import NearbyStoresModal from '@/components/NearbyStoresModal.vue';

export default {
  components: {
    CartItemDetails,
    RecipeCard,
    NearbyStoresModal,
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
    'delete-favorite-recipe',
    'delete-favorite-food-fact',
    'delete-saved-place',
  ],
  data() {
    return {
      selectedPlace: null,
      openGroupMenu: null,
      nearbyShopName: '',
      toggleHeight: 0,
    };
  },
  mounted() {
    this.updateToggleHeight();
    this.toggleResizeObserver = new ResizeObserver(() => this.updateToggleHeight());
    this.toggleResizeObserver.observe(this.$refs.toggle);
  },
  beforeUnmount() {
    this.toggleResizeObserver?.disconnect();
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
    updateToggleHeight() {
      this.toggleHeight = this.$refs.toggle?.offsetHeight ?? 0;
    },
    openPlaceModal(place) {
      this.selectedPlace = place;
    },
    openInMaps(provider) {
      if (!this.selectedPlace) return;
      const { lat, lon, name } = this.selectedPlace;
      const enc = encodeURIComponent(name);
      const isAndroid = /android/i.test(navigator.userAgent);
      let url;
      if (provider === 'apple') {
        // Universal link: iOS/macOS Safari opens the Maps app directly, no custom scheme needed.
        url = `https://maps.apple.com/?q=${enc}&sll=${lat},${lon}&z=16`;
      } else {
        url = isAndroid
          ? `geo:${lat},${lon}?q=${lat},${lon}(${enc})`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      }
      window.location.href = url;
      this.selectedPlace = null;
    },
  },
};
</script>

<template>
  <div :style="{ '--favorites-toggle-height': toggleHeight + 'px' }">
    <div class="favorites-template-toggle" ref="toggle">
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'cart' }"
        @click="$emit('update:templateFilter', 'cart')"
      >
        Shops ({{ favoriteCartTemplateCount }})
      </button>
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'places' }"
        @click="$emit('update:templateFilter', 'places')"
      >
        Places ({{ savedPlaces.length }})
      </button>
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'recipes' }"
        @click="$emit('update:templateFilter', 'recipes')"
      >
        Recipes ({{ favoriteRecipeTemplateCount }})
      </button>
      <button
        type="button"
        class="favorite-type-btn"
        :class="{ active: templateFilter === 'foods' }"
        @click="$emit('update:templateFilter', 'foods')"
      >
        Food Facts ({{ favoriteFoodFactTemplateCount }})
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
          <div class="group-header-left">
            <span class="group-name">{{ groupName }}</span>
            <button
              class="nearby-store-btn"
              @click.stop="nearbyShopName = groupName"
              title="Find this store nearby"
            >
              <i class="material-icons">near_me</i>
            </button>
          </div>
          <span class="group-count"
            >{{ favoriteCartTemplatesByGroup[groupName].length }}
            {{
              favoriteCartTemplatesByGroup[groupName].length <= 1
                ? 'saved item'
                : 'saved items'
            }}</span
          >
          <div class="group-more-menu-wrapper">
            <button
              type="button"
              class="group-more-btn"
              @click.stop="
                openGroupMenu = openGroupMenu === groupName ? null : groupName
              "
              title="More actions"
            >
              <i class="material-icons">more_vert</i>
            </button>
            <div
              v-if="openGroupMenu === groupName"
              class="group-more-backdrop"
              @click.stop="openGroupMenu = null"
            ></div>
            <div v-if="openGroupMenu === groupName" class="group-more-dropdown">
              <button
                type="button"
                class="group-more-option"
                @click.stop="
                  openGroupMenu = null;
                  $emit('download-group-pdf', groupName)
                "
              >
                <i class="material-icons">picture_as_pdf</i>
                Download list
              </button>
              <button
                type="button"
                class="group-more-option danger"
                @click.stop="
                  openGroupMenu = null;
                  $emit('delete-favorite-group', groupName)
                "
              >
                <i class="material-icons">delete</i>
                Delete shop
              </button>
            </div>
          </div>
        </div>
        <div
          v-for="(item, idx) in favoriteCartTemplatesByGroup[groupName]"
          :key="item._id"
          class="favorite-template-row"
        >
          <CartItemDetails
            :cart-item="item"
            :index="idx"
            :total="favoriteCartTemplatesByGroup[groupName].length"
            :is-saved-view="true"
            :can-delete="true"
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
            <i class="material-icons">delete</i>
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
            <i class="material-icons">delete</i>
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

    <NearbyStoresModal
      :shop-name="nearbyShopName"
      @close="nearbyShopName = ''"
    />
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
  margin-bottom: spacing.$spacing-s;

  .material-icons {
    color: color.$blue-violet;
    @include typography.headline-160;
    align-self: center;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    padding-top: spacing.$spacing-m;
  }
}

.favorites-template-toggle {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xs 0;
  position: sticky;
  top: -10px;
  z-index: 8;
  background: color.$light;

  @include breakpoint.media-breakpoint-up(sm) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
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
    background: color.$blue-violet;
    color: color.$white;
  }
}

.item-group {
  margin-bottom: spacing.$spacing-s;
  padding-bottom: spacing.$spacing-s;
  border-bottom: size.$sp02 solid color.$border-dark;
}

.group-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  background: color.$gradient;
  border-radius: size.$sp06;
  margin-bottom: spacing.$spacing-xxs;
  position: sticky;
  // Toolbar sticks at top: -10px, so match that offset to avoid a gap below it.
  top: calc(var(--favorites-toggle-height, 0px) - 10px);
  z-index: 7;

  .group-header-left {
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
    flex-shrink: 0;
  }

  .nearby-store-btn,
  .group-more-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(color.$light, 0.8);
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
    padding: 0;
    transition: color 0.15s;

    .material-icons {
      @include typography.headline-200;
    }

    &:hover {
      color: color.$light;
    }
  }

  .group-more-menu-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .group-more-backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
  }

  .group-more-dropdown {
    position: absolute;
    top: calc(100% + #{spacing.$spacing-xxs});
    right: 0;
    z-index: 21;
    display: flex;
    padding: spacing.$spacing-xxs spacing.$spacing-xs;
    flex-direction: column;
    gap: spacing.$spacing-xxs;
    background: color.$white;
    border-radius: size.$sp10;
    box-shadow: size.$sp02 size.$sp04 size.$sp24 color.$dark;
    overflow: hidden;
  }

  .group-more-option {
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
    border: none;
    background: none;
    padding: spacing.$spacing-xxs spacing.$spacing-base;
    color: color.$dark;
    cursor: pointer;
    white-space: nowrap;
    @include typography.headline-160-medium;

    .material-icons {
      @include typography.headline-200;
      color: color.$dark50;
    }

    &.danger {
      color: color.$danger-dark;
      .material-icons {
        color: color.$danger;
      }
    }
  }
}

.favorites-group-header {
  cursor: default;
  padding: spacing.$spacing-xs;

  &:active {
    cursor: default;
  }
}

.favorite-template-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 spacing.$spacing-base;


  :deep(.cart-items) {
    flex: 1;
    margin-top: spacing.$spacing-xxs;
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
  top: spacing.$spacing-xs;
  right: spacing.$spacing-xs;
  z-index: 2;
  width: size.$sp36;
  height: size.$sp36;
  border: none;
  border-radius: 50%;
  padding: spacing.$spacing-xs;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: color.$blue-violet;
  color: color.$white;
  transition:
    background 0.15s,
    color 0.15s;

  .material-icons {
    @include typography.headline-240;
    padding: spacing.$spacing-xxs;
  }

  &:hover {
    color: color.$white;
    background: rgba(color.$blue-violet, 0.55);
  }
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
  @include typography.headline-180-medium;
  border-radius: size.$sp08;

  .material-icons {
    @include typography.headline-180;
  }
}

.saved-place-row {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xs;
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
  justify-content: space-between;
  gap: size.$sp20;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  flex-shrink: 0;
}

.saved-place-open-icon {
  color: color.$blue-violet;
  @include typography.headline-240;
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
    @include typography.headline-240;
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
    color: color.$blue-violet;
    @include typography.headline-240;
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
    background: color.$gold;
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
  background: color.$gold;
  color: color.$light;

  &:hover {
    background: rgba(color.$gold, 0.55);
  }
}

html.dark .favorites-template-toggle {
  background: color.$dark;
}

html.dark .saved-place-open-icon {
  color: color.$gold;
}

html.dark .saved-place-icon {
  background-color: rgba(color.$gold, 0.1);
  .material-icons {
    color: color.$gold;
  }
}

html.dark .saved-place-name {
  color: color.$white;
}

html.dark .group-more-dropdown {
    background-color: color.$dark;
    color: color.$light;
    border: size.$sp02 solid color.$light50;
    box-shadow: 0 size.$sp04 size.$sp12 rgba(color.$light, 0.25);
  }

html.dark .group-more-option {
    background-color: color.$dark;
    color: color.$white;

     .material-icons {
         color: color.$white;
    }
  }


html.dark .favorite-info-hint {
  .material-icons {
    color: color.$gold;
  }
}

html.dark .delete-place-btn {
  &:hover {
    color: color.$gold;
  }

  .material-icons {
    color: color.$gold;
  }
}
</style>
