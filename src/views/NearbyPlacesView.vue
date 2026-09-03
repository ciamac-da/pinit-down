<script>
import { useCartStore } from '@/stores/CartStore';
import { useSubscriptionStore, FREE_LIMITS } from '@/stores/SubscriptionStore';

const CATEGORIES = [
  {
    id: 'food',
    label: 'Food & Drink',
    icon: 'restaurant',
    items: [
      { label: 'Restaurants', query: 'restaurant', icon: 'restaurant' },
      { label: 'Bars', query: 'bar pub', icon: 'local_bar' },
      { label: 'Coffee', query: 'cafe', icon: 'local_cafe' },
      { label: 'Takeout', query: 'fast food', icon: 'fastfood' },
      { label: 'Bakeries', query: 'bakery', icon: 'cake' },
      { label: 'Pizza', query: 'pizzeria', icon: 'local_pizza' },
    ],
  },
  {
    id: 'todo',
    label: 'Things to Do',
    icon: 'star',
    items: [
      { label: 'Parks', query: 'park', icon: 'park' },
      { label: 'Gyms', query: 'fitness', icon: 'fitness_center' },
      { label: 'Museums', query: 'museum', icon: 'museum' },
      { label: 'Movies', query: 'cinema', icon: 'movie' },
      { label: 'Attractions', query: 'attraction', icon: 'tour' },
      { label: 'Nightlife', query: 'nightclub', icon: 'nightlife' },
      { label: 'Libraries', query: 'library', icon: 'local_library' },
    ],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: 'shopping_bag',
    items: [
      {
        label: 'Groceries',
        query: 'supermarket',
        icon: 'local_grocery_store',
      },
      { label: 'Shopping Centers', query: 'mall', icon: 'store' },
      { label: 'Electronics', query: 'electronics shop', icon: 'devices' },
      { label: 'Apparel', query: 'clothes shop', icon: 'checkroom' },
      { label: 'Pharmacies', query: 'pharmacy', icon: 'local_pharmacy' },
      { label: 'Convenience', query: 'convenience store', icon: 'storefront' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'build',
    items: [
      { label: 'Hotels', query: 'hotel', icon: 'hotel' },
      { label: 'ATMs', query: 'ATM', icon: 'local_atm' },
      {
        label: 'Gas Stations',
        query: 'gas station',
        icon: 'local_gas_station',
      },
      { label: 'Hospitals', query: 'hospital', icon: 'local_hospital' },
      { label: 'Parking', query: 'parking', icon: 'local_parking' },
      { label: 'Car Repair', query: 'car repair', icon: 'car_repair' },
      {
        label: 'Charging',
        query: 'charging station',
        icon: 'ev_station',
      },
    ],
  },
];

export default {
  setup() {
    const cartStore = useCartStore();
    const subscriptionStore = useSubscriptionStore();
    return { cartStore, subscriptionStore };
  },
  data() {
    return {
      categories: CATEGORIES,
      selectedCategory: null,
      selectedItem: null,
      loading: false,
      error: '',
      results: [],
      radius: FREE_LIMITS.radiusKm,
      viewMode: 'list',
      selectedPlace: null,
      page: 1,
      pageSize: 7,
      resultsHeight: null,
      showRadiusMenu: false,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.results.length / this.effectivePageSize);
    },
    effectivePageSize() {
      return this.viewMode === 'cards' ? 4 : this.pageSize;
    },
    pagedResults() {
      const start = (this.page - 1) * this.effectivePageSize;
      return this.results.slice(start, start + this.effectivePageSize);
    },
  },
  watch: {
    selectedItem(val) {
      if (val) this.search();
    },
    radius() {
      if (this.selectedItem) this.search();
    },
    results() {
      this.$nextTick(() => this.updateLayout());
    },
    viewMode() {
      this.page = 1;
      this.$nextTick(() => this.updateLayout());
    },
  },
  mounted() {
    this._onResize = () => this.updateLayout();
    window.addEventListener('resize', this._onResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this._onResize);
  },
  methods: {
    saveNearbyPlace(place) {
      if (this.cartStore.isPlaceSaved(place.lat, place.lon)) {
        this.cartStore.showToast('This place is already saved.', 'info');
        return;
      }
      this.cartStore.savePlace({
        ...place,
        icon: this.selectedItem ? this.selectedItem.icon : 'place',
        subcategory: this.selectedItem ? this.selectedItem.label : '',
        category: this.selectedCategory ? this.selectedCategory.label : '',
      });
    },
    selectRadius(r) {
      this.showRadiusMenu = false;
      if (r > FREE_LIMITS.radiusKm && !this.subscriptionStore.effectiveIsPro) {
        this.subscriptionStore.openPaywall('nearby-radius');
        return;
      }
      this.radius = r;
    },
    updateLayout() {
      const toolbar = this.$refs.toolbar;
      if (!toolbar) return;
      const toolbarBottom = toolbar.getBoundingClientRect().bottom;
      this.resultsHeight = Math.max(
        200,
        window.innerHeight - toolbarBottom - 8,
      );
      this.$nextTick(() => {
        const container = this.$refs.resultsContainer;
        if (!container) return;
        const item = container.querySelector('.place-list-item, .place-card');
        if (!item) return;
        const itemH = item.offsetHeight;
        if (itemH > 0) {
          const newSize = Math.max(1, Math.floor(this.resultsHeight / itemH));
          if (newSize !== this.pageSize) {
            this.pageSize = newSize;
            if (this.page > this.totalPages)
              this.page = Math.max(1, this.totalPages);
          }
        }
      });
    },
    selectCategory(cat) {
      this.selectedCategory = cat;
      this.selectedItem = null;
      this.results = [];
      this.error = '';
    },
    selectItem(item) {
      this.selectedItem = item;
    },
    goBack() {
      if (
        this.selectedItem &&
        (this.results.length || this.error || this.loading)
      ) {
        this.selectedItem = null;
        this.results = [];
        this.error = '';
      } else {
        this.selectedCategory = null;
        this.selectedItem = null;
        this.results = [];
        this.error = '';
      }
    },
    async search() {
      this.loading = true;
      this.error = '';
      this.results = [];
      this.page = 1;
      this.selectedPlace = null;
      try {
        const pos = await this.getLocation();
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        this.results = await this.fetchNearby(
          lat,
          lon,
          this.selectedItem.query,
        );
        if (!this.results.length)
          this.error = `No "${this.selectedItem.label}" found within ${this.radius} km.`;
      } catch (e) {
        this.error = e.message || 'Could not fetch nearby places.';
      } finally {
        this.loading = false;
      }
    },
    getLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported.'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            if (err.code === err.PERMISSION_DENIED)
              reject(new Error('Location permission denied.'));
            else reject(new Error('Could not determine your location.'));
          },
          { timeout: 10000 },
        );
      });
    },
    async fetchNearby(lat, lon, query) {
      // Nominatim ranks matches by importance/relevance, not distance, so a
      // single large viewbox can push closer-but-less-"important" places out
      // of the (max 50) results. Query nested smaller radii too and merge,
      // so anything found at a smaller radius never disappears at a larger one.
      const tierRadii = [...new Set(
        [1, 5, 15, this.radius]
          .map((r) => Math.min(r, this.radius))
          .filter((r) => r > 0),
      )];

      const merged = new Map();
      for (const tierRadius of tierRadii) {
        const items = await this.fetchNearbyAtRadius(lat, lon, query, tierRadius);
        for (const item of items) {
          const key = `${item.lat.toFixed(5)},${item.lon.toFixed(5)}`;
          if (!merged.has(key)) merged.set(key, item);
        }
      }

      return [...merged.values()]
        .filter((item) => item.dist <= this.radius)
        .sort((a, b) => a.dist - b.dist);
    },
    async fetchNearbyAtRadius(lat, lon, query, radiusKm) {
      const delta = radiusKm / 111;
      const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '50',
        addressdetails: '1',
        viewbox: `${lon - lonDelta},${lat + delta},${lon + lonDelta},${lat - delta}`,
        bounded: '1',
      });
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'PinitDown/1.0' },
        },
      );
      if (!resp.ok)
        throw new Error('Search failed. Check your internet connection.');
      const data = await resp.json();
      return data.map((item) => {
        const elLat = parseFloat(item.lat);
        const elLon = parseFloat(item.lon);
        const a = item.address || {};
        const address =
          [a.road, a.house_number, a.postcode, a.city || a.town || a.village]
            .filter(Boolean)
            .join(' ') || item.display_name.split(',').slice(0, 3).join(',');
        return {
          name: item.display_name.split(',')[0] || 'Unknown',
          address,
          lat: elLat,
          lon: elLon,
          dist: this.haversineKm(lat, lon, elLat, elLon),
        };
      });
    },
    haversineKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    openMaps(provider) {
      if (!this.selectedPlace) return;
      const { lat, lon, name } = this.selectedPlace;
      const enc = encodeURIComponent(name);
      const isAndroid = /android/i.test(navigator.userAgent);
      // Apple Maps: universal link opens the app directly on iOS/macOS, no custom scheme needed.
      const url =
        provider === 'apple'
          ? `https://maps.apple.com/?q=${enc}&sll=${lat},${lon}&z=16`
          : isAndroid
            ? `geo:${lat},${lon}?q=${lat},${lon}(${enc})`
            : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      window.location.href = url;
      this.selectedPlace = null;
    },
    formatDist(km) {
      return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
    },
  },
};
</script>

<template>
  <div class="places-view">
    <div class="places-toolbar" ref="toolbar">
      <div class="toolbar-row">
        <button v-if="selectedCategory" class="back-btn" @click="goBack">
          <i class="material-icons">arrow_back</i>
        </button>
        <h2>
          <i class="material-icons">map</i>
          {{
            selectedItem
              ? selectedItem.label
              : selectedCategory
                ? selectedCategory.label
                : 'Place Finder'
          }}
        </h2>
        <div v-if="selectedItem" class="view-toggle">
          <button
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="List"
          >
            <i class="material-icons">list</i>
          </button>
          <button
            :class="{ active: viewMode === 'cards' }"
            @click="viewMode = 'cards'"
            title="Cards"
          >
            <i class="material-icons">grid_view</i>
          </button>
        </div>
      </div>
      <div v-if="selectedItem" class="radius-row">
        <label>Radius:</label>
        <div class="radius-dropdown">
          <button
            type="button"
            class="radius-dropdown-toggle"
            @click="showRadiusMenu = !showRadiusMenu"
          >
            {{ radius < 1 ? `${radius * 1000} m` : `${radius} km` }}
            <i class="material-icons">{{
              showRadiusMenu ? 'expand_less' : 'expand_more'
            }}</i>
          </button>
          <div
            v-if="showRadiusMenu"
            class="radius-dropdown-backdrop"
            @click="showRadiusMenu = false"
          ></div>
          <div v-if="showRadiusMenu" class="radius-dropdown-menu">
            <button
              v-for="r in [0.5, 1, 2, 5, 10, 50]"
              :key="r"
              type="button"
              class="radius-dropdown-option"
              :class="{ active: radius === r }"
              @click="selectRadius(r)"
            >
              {{ r < 1 ? `${r * 1000} m` : `${r} km` }}
              <i
                v-if="r > 1 && !subscriptionStore.effectiveIsPro"
                class="material-icons radius-lock"
                >lock</i
              >
            </button>
          </div>
        </div>
        <button class="retry-btn" @click="search" :disabled="loading">
          <i class="material-icons" :class="{ spinning: loading }">refresh</i>
        </button>
      </div>
      <div
        v-if="selectedCategory"
        class="subcategory-chips"
        :class="{
          'subcategory-chips--compact':
            selectedItem && (loading || results.length || error),
        }"
      >
        <button
          v-for="item in selectedCategory.items"
          :key="item.label"
          class="sub-chip"
          :class="{
            active: selectedItem && selectedItem.label === item.label,
            'sub-chip--sm':
              selectedItem && (loading || results.length || error),
          }"
          @click="selectItem(item)"
        >
          <i class="material-icons">{{ item.icon }}</i>
          {{ item.label }}
        </button>
      </div>
      <div v-if="totalPages > 1" class="toolbar-pagination">
        <button
          class="page-btn"
          :class="{ 'page-btn-hidden': page === 1 }"
          :disabled="page === 1"
          @click="page--"
        >
          <i class="material-icons">chevron_left</i>
        </button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :class="{ 'page-btn-hidden': page === totalPages }"
          :disabled="page === totalPages"
          @click="page++"
        >
          <i class="material-icons">chevron_right</i>
        </button>
      </div>
    </div>

    <!-- Step 1: Main category grid -->
    <div v-if="!selectedCategory" class="category-grid">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="category-card"
        @click="selectCategory(cat)"
      >
        <i class="material-icons">{{ cat.icon }}</i>
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Step 2: Results -->
    <template v-else>
      <p v-if="!selectedItem" class="select-hint">
        <i class="material-icons">touch_app</i>
        Select a place type above to search nearby
      </p>

      <div
        ref="resultsContainer"
        :style="
          resultsHeight && viewMode === 'list'
            ? { height: resultsHeight + 'px', overflow: 'hidden' }
            : {}
        "
      >
        <div v-if="loading" class="nearby-state">
          <i class="material-icons spinning">sync</i>
          Searching {{ selectedItem ? selectedItem.label : '' }}…
        </div>
        <div v-else-if="error" class="nearby-state nearby-error">
          <i class="material-icons">warning</i>
          {{ error }}
        </div>

        <div v-else-if="viewMode === 'list'" class="places-list">
          <div
            v-for="(place, i) in pagedResults"
            :key="i"
            class="place-list-item"
            role="button"
            tabindex="0"
            @click="selectedPlace = place"
            @keyup.enter="selectedPlace = place"
          >
            <i class="material-icons place-type-icon">{{
              selectedItem ? selectedItem.icon : 'place'
            }}</i>
            <div class="place-info">
              <span class="place-name">{{ place.name }}</span>
              <span class="place-address">{{
                place.address || 'Address not available'
              }}</span>
            </div>
            <div class="place-right">
              <span class="place-dist">{{ formatDist(place.dist) }}</span>
              <i
                class="material-icons place-save-icon"
                :class="{ saved: cartStore.isPlaceSaved(place.lat, place.lon) }"
                :title="
                  cartStore.isPlaceSaved(place.lat, place.lon)
                    ? 'Already saved'
                    : 'Save place'
                "
                @click.stop="saveNearbyPlace(place)"
                >bookmark_add</i
              >
              <i class="material-icons place-open-icon">near_me</i>
            </div>
          </div>
        </div>

        <div v-else class="places-cards">
          <div
            v-for="(place, i) in pagedResults"
            :key="i"
            class="place-card"
            role="button"
            tabindex="0"
            @click="selectedPlace = place"
            @keyup.enter="selectedPlace = place"
          >
            <div class="place-card-icon">
              <i class="material-icons">{{
                selectedItem ? selectedItem.icon : 'place'
              }}</i>
            </div>
            <div class="place-card-name">{{ place.name }}</div>
            <div class="place-card-address">
              {{ place.address || 'Address not available' }}
            </div>
            <div class="place-card-dist">
              <i class="material-icons">location_on</i>
              {{ formatDist(place.dist) }}
            </div>
            <button
              class="place-card-save"
              :class="{ saved: cartStore.isPlaceSaved(place.lat, place.lon) }"
              @click.stop="saveNearbyPlace(place)"
              :title="
                cartStore.isPlaceSaved(place.lat, place.lon)
                  ? 'Already saved'
                  : 'Save place'
              "
            >
              <i class="material-icons">bookmark_add</i>
            </button>
          </div>
        </div>
      </div>
      <p
        v-if="
          !loading &&
          !error &&
          results.length &&
          (page === totalPages || totalPages <= 1)
        "
        class="nearby-attribution"
      >
        Data &copy;
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener"
          >OpenStreetMap</a
        >
        contributors
      </p>
    </template>

    <!-- Map picker bottom sheet -->
    <div
      v-if="selectedPlace"
      class="map-picker-overlay"
      @click.self="selectedPlace = null"
    >
      <div class="map-picker">
        <p class="map-picker-label">Open in maps</p>
        <p class="map-picker-name">{{ selectedPlace.name }}</p>
        <p class="map-picker-address">{{ selectedPlace.address }}</p>
        <div class="map-picker-buttons">
          <button class="map-btn google-btn" @click="openMaps('google')">
            <i class="material-icons">map</i>
            Google Maps
          </button>
          <button class="map-btn apple-btn" @click="openMaps('apple')">
            <i class="material-icons">map</i>
            Apple Maps
          </button>
        </div>
        <button class="map-picker-cancel" @click="selectedPlace = null">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';
@use '@/styles/abstracts/breakpoint';

.places-view {
  position: relative;
  min-height: 100%;
  padding: spacing.$spacing-xxs 0;

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xs 0 calc(spacing.$spacing-xl * 3);
  }
}

.places-toolbar {
  position: sticky;
  top: 0;
  z-index: 6;
  background: color.$light-bg-soft;
  border-bottom: size.$sp01 solid color.$border-light;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xs spacing.$spacing-base;
  h2 {
    @include typography.headline-180;
    color: color.$dark-medium;
    display: flex;
    align-items: center;
    gap: spacing.$spacing-base;
    margin: 0;
    flex: 1;
    .material-icons {
      @include typography.headline-240;
      color: color.$blue-violet;
    }
  }
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: color.$blue-violet;
  display: flex;
  padding: spacing.$spacing-base;
  border-radius: size.$sp08;
  transition: background 0.15s;
  
  &:hover {
    background: rgba(color.$blue-violet, 0.08);
  }
  .material-icons {
    @include typography.headline-280;
  }
}

.view-toggle {
  display: flex;
  gap: size.$sp20;

  button {
    background: color.$light-bg;
    border: none;
    border-radius: size.$sp08;
    padding: spacing.$spacing-base;
    cursor: pointer;
    display: flex;
    color: color.$muted;
    transition: 0.15s;
    &.active {
      background: color.$blue-violet;
      color: color.$white;
    }
    .material-icons {
      @include typography.headline-240;
    }
  }
}

.radius-row {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-s;
  flex-wrap: wrap;
  padding: spacing.$spacing-xxs;

  label {
    @include typography.headline-160-medium;
    color: color.$muted;
    flex-shrink: 0;
  }
}

.radius-dropdown {
  position: relative;
  flex: 1;
}

.radius-dropdown-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: spacing.$spacing-xxs;
  background: color.$light-bg;
  border: size.$sp02 solid color.$border-dark;
  border-radius: size.$sp10;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  cursor: pointer;
  @include typography.headline-160-medium;
  color: color.$dark;

  .material-icons {
    @include typography.headline-200;
    color: color.$muted;
  }

  &:hover {
    background: color.$light-hover;
  }
}

.radius-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.radius-dropdown-menu {
  position: absolute;
  top: calc(100% + #{spacing.$spacing-xxs});
  left: 0;
  right: 0;
  z-index: 21;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: spacing.$spacing-xxs;
  background: color.$white;
  border-radius: size.$sp10;
  box-shadow: size.$sp02 size.$sp04 size.$sp24 color.$dark;
  overflow: hidden;
}

.radius-dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: spacing.$spacing-xxs;
  border: none;
  border-radius: size.$sp08;
  background: none;
  padding: spacing.$spacing-base spacing.$spacing-base;
  cursor: pointer;
  @include typography.headline-160-medium;
  color: color.$dark;
  text-align: left;

  &:hover {
    background: color.$light-hover;
  }

  &.active {
    background: color.$blue-violet;
    color: color.$white;
  }
}

.radius-lock {
  @include typography.headline-160;
  color: color.$muted;
}

.retry-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: color.$muted;
  display: flex;
  &:hover:not(:disabled) {
    color: color.$blue-violet;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .material-icons {
    @include typography.headline-280;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-s 0;
  @include breakpoint.media-breakpoint-up(sm) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-s spacing.$spacing-xxs;
  background: color.$light50;
  border: none;
  border-radius: size.$sp12;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;
  .material-icons {
    color: color.$blue-violet;
    font-size: 32px !important;
  }
  span {
    @include typography.headline-120-medium;
    color: color.$dark;
  }
  &:hover {
    background: rgba(color.$blue-violet, 0.1);
    transform: translateY(-1 * size.$sp02);
  }
}

.subcategory-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: size.$sp08;
  padding: spacing.$spacing-s spacing.$spacing-base;
  &.subcategory-chips--compact {
    border-bottom: size.$sp01 solid color.$border-light;
  }
}

.sub-chip {
  display: flex;
  align-items: center;
  gap: size.$sp06;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  background: color.$light-bg;
  border: size.$sp02 solid transparent;
  border-radius: size.$sp20;
  cursor: pointer;
  @include typography.headline-160-medium;
  color: color.$dark;
  transition: 0.15s;
  .material-icons {
    @include typography.headline-160;
  }
  &.active {
    color: color.$white;
    background-color: color.$blue-violet;
  }
  &:hover:not(.active) {
    background: color.$light-hover;
  }
  &.sub-chip--sm {
    padding: size.$sp04 spacing.$spacing-base;
    @include typography.headline-160-medium;
    .material-icons {
      @include typography.headline-160;
    }
  }
}

.select-hint {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-m 0;
  @include typography.headline-120;
  color: color.$muted;
  .material-icons {
    @include typography.headline-160;
  }
}

.nearby-state {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-m 0;
  @include typography.headline-140;
  color: color.$muted;
  .material-icons {
    @include typography.headline-200;
  }
  &.nearby-error {
    color: color.$danger;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spinning {
  animation: spin 1s linear infinite;
  display: inline-block;
}

.places-list {
  display: flex;
  flex-direction: column;
}

.place-list-item {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  cursor: pointer;
  border-bottom: size.$sp01 solid color.$border-light;
  transition: background 0.15s;
  &:hover {
    background: color.$light-bg-soft;
  }
}

.place-type-icon {
  color: color.$blue-violet;
  @include typography.headline-200;
  flex-shrink: 0;
}
.place-info {
  display: flex;
  flex-direction: column;
  gap: size.$sp02;
  min-width: 0;
  flex: 1;
}
.place-name {
  @include typography.headline-140-medium;
  color: color.$dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.place-address {
  @include typography.headline-120;
  color: color.$muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.place-right {
  display: flex;
  align-items: center;
  gap: size.$sp16;
  flex-shrink: 0;

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: column;
    align-items: flex-end;
    gap: size.$sp02;
  }
}
.place-dist {
  @include typography.headline-120-medium;
  color: color.$blue-violet;
}
.place-open-icon {
  @include typography.headline-240;
  color: color.$blue-violet;

  &:hover {
    color: color.$muted-lighter;
  }
  &.saved {
    color: color.$muted-lighter;
    cursor: default;
  }
}

.place-save-icon {
  @include typography.headline-240;
  cursor: pointer;
  color: color.$muted-lighter;
  transition: color 0.15s;
  &:hover {
      color: color.$blue-violet;

  }
  &.saved {
      color: color.$blue-violet;
    cursor: default;
  }
}

.place-card-save {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: size.$sp04;
  background: color.$light-bg;
  border: none;
  border-radius: size.$sp10;
  padding: size.$sp04 spacing.$spacing-base;
  cursor: pointer;
  width: 100%;
  @include typography.headline-160-medium;
  color: color.$blue-violet;
  transition: 0.15s;

  .material-icons {
      @include typography.headline-160-medium;
      padding: spacing.$spacing-base;
  }
  &:hover {
    background: rgba(color.$muted, 0.15);
    color: color.$muted;
  }
  &.saved {
    background: rgba(color.$muted, 0.12);
    cursor: default;
    color: color.$muted;
    opacity: 0.6;
  }
}

.places-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xxs 0;

  @include breakpoint.media-breakpoint-up(sm) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.place-card {
  background: color.$white;
  border: size.$sp01 solid color.$border-light;
  border-radius: size.$sp12;
  padding: spacing.$spacing-xxs;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    transform 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: spacing.$spacing-xs;
  text-align: center;
  &:hover {
    box-shadow: 0 size.$sp04 size.$sp16 rgba(color.$blue-violet, 0.12);
    transform: translateY(-1 * size.$sp02);
  }
}

.place-card-icon {
  background: rgba(color.$blue-violet, 0.1);
  border-radius: 50%;
  width: size.$sp40;
  height: size.$sp40;
  display: flex;
  align-items: center;
  justify-content: center;

  .material-icons {
    @include typography.headline-240;
    color: color.$blue-violet;
  }
}

.place-card-name {
  @include typography.headline-160-medium;
  color: color.$dark;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  width: 100%;
}

.place-card-address {
  @include typography.headline-100;
  color: color.$muted;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  width: 100%;
}

.place-card-dist {
  @include typography.headline-160-medium;
  color: color.$blue-violet;
  display: flex;
  align-items: center;
  gap: size.$sp02;
  margin-top: auto;

  .material-icons {
      @include typography.headline-160-medium;
  }
}

.map-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 400;
}
.map-picker {
  width: 100%;
  background: color.$white;
  padding: spacing.$spacing-s;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;
  border-radius: size.$sp12 size.$sp12 0 0;
}
.map-picker-label {
  @include typography.headline-120;
  color: color.$muted;
  margin: 0;
  text-align: center;
}
.map-picker-name {
  @include typography.headline-160-medium;
  color: color.$dark;
  margin: 0;
  text-align: center;
}
.map-picker-address {
  @include typography.headline-120;
  color: color.$muted;
  margin: 0;
  text-align: center;
}
.map-picker-buttons {
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
.map-picker-cancel {
  background: none;
  border: none;
  cursor: pointer;
  @include typography.headline-200;
  color: color.$muted;
  text-align: center;
  padding: spacing.$spacing-base 0 0;
  &:hover {
    color: color.$dark;
  }
}

.toolbar-pagination {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xs;
  padding: spacing.$spacing-xxs spacing.$spacing-s;
  justify-self: flex-end;
}

.page-btn {
  background: none;
  border: none;
  border-radius: size.$sp08;
  padding: size.$sp04;
  cursor: pointer;
  display: flex;
  color: color.$dark;
  transition: background 0.15s;
  @include typography.headline-200;

  &:hover:not(:disabled) {
    background: rgba(color.$blue-violet, 0.1);
  }
  &:disabled {
    color: color.$muted-lighter;
    cursor: default;
  }
  .material-icons {
    @include typography.headline-280;
  }
}

.page-btn-hidden {
  visibility: hidden;
}

.page-info {
  @include typography.headline-160-medium;
  color: color.$dark;
  min-width: size.$sp40;
  text-align: center;
}

.nearby-attribution {
  @include typography.headline-100;
  color: color.$muted-lighter;
  text-align: right;
  margin: size.$sp04 0 0;
  padding: 0 spacing.$spacing-base spacing.$spacing-base;
  a {
    color: color.$blue-violet;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

html.dark .places-toolbar {
  background: color.$dark;
  border-bottom-color: color.$dark-soft;
}
html.dark .toolbar-row h2 {
  color: color.$light;

  .material-icons {
    color: color.$gold;
  }
}
html.dark .category-card {
  background: color.$dark-soft;

  .material-icons {
    color: color.$gold;
  }
  span {
    color: color.$light;
  }
  &:hover {
    background: rgba(color.$blue-violet, 0.2);
  }
}
html.dark .sub-chip {
  background: color.$dark-soft;
  color: color.$light;
  &:hover:not(.active) {
    background: color.$dark-medium;
  }
  &.active {
    color: color.$white;
    background: color.$gold;
  }
}
html.dark .radius-dropdown-toggle {
  background: color.$dark-soft;
  border-color: rgba(color.$light, 0.3);
  color: color.$light;

  .material-icons {
    color: color.$light50;
  }
}
html.dark .radius-dropdown-menu {
  background: color.$dark-soft;
  box-shadow: size.$sp02 size.$sp04 size.$sp24 rgba(color.$white, 0.15);
}
html.dark .radius-dropdown-option {
  color: color.$light;

  &:hover {
    background: rgba(color.$light, 0.1);
  }

  &.active {
    background: color.$gold;
    color: color.$white;
  }
}
html.dark .view-toggle button {
  background: color.$dark-soft;
  color: color.$light50;
  &.active {
    background: color.$gold;
    color: color.$white;
  }
}
html.dark .place-list-item {
  border-bottom-color: color.$dark-soft;
  &:hover {
    background: color.$dark-medium;
  }
}
html.dark .place-name {
  color: color.$light;
}
html.dark .place-card {
  background: color.$dark-medium;
  border-color: color.$dark-soft;
}
html.dark .place-card-name {
  color: color.$light;
}
html.dark .map-picker {
  background: color.$dark-medium;
}
html.dark .map-picker-name {
  color: color.$light;
}
html.dark .map-picker-cancel {
  color: color.$muted-lighter;
}
html.dark .toolbar-pagination {
  border-top-color: color.$dark-soft;
}

html.dark .back-btn {
  .material-icons {
    color: color.$gold;
  }
}

html.dark .place-type-icon {
  color: color.$gold;
}

html.dark .place-dist {
  color: color.$gold;
}

html.dark  .place-save-icon {
  color: color.$muted-lighter;
  transition: color 0.15s;
  &:hover {
      color: color.$gold;

  }
  &.saved {
      color: color.$gold;
    cursor: default;
  }
}


html.dark .page-btn {

  &:hover:not(:disabled) {
    background: rgba(color.$white, 0.1);
  }
  &:disabled {
    color: color.$muted-lighter;
    cursor: default;
  }
  .material-icons {
    color: color.$white;
  }
}

html.dark .place-open-icon {
  color: color.$gold;
}

html.dark .page-info {
  color: color.$white;
}

html.dark .place-card-icon {
  background: rgba(color.$gold, 0.1);

  .material-icons {
    @include typography.headline-200;
    color: color.$gold;
  }
}

html.dark .place-card-dist {
  color: color.$gold;
}

html.dark .place-card-save {
  background: rgba(color.$light, 0.1);

  .material-icons {
    color: color.$gold;
  }
  
}
</style>