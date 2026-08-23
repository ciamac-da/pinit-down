<script>
export default {
  props: {
    shopName: { type: String, default: '' },
  },
  emits: ['close'],
  data() {
    return {
      open: false,
      loading: false,
      error: '',
      results: [],
      selectedStore: null,
      isApplePlatform: /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent),
    };
  },
  watch: {
    shopName(val) {
      if (val) this.search();
    },
  },
  methods: {
    async search() {
      this.open = true;
      this.loading = true;
      this.error = '';
      this.results = [];
      try {
        const pos = await this.getLocation();
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        this.results = await this.fetchNearbyStores(lat, lon, this.shopName);
        if (!this.results.length)
          this.error = `No "${this.shopName}" stores found within 10 km.`;
      } catch (e) {
        this.error = e.message || 'Could not fetch nearby stores.';
      } finally {
        this.loading = false;
      }
    },
    getLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported by your browser.'));
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
    async fetchNearbyStores(lat, lon, name) {
      // Nominatim search API: free OpenStreetMap geocoding, no API key, CORS-friendly.
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: name,
          format: 'json',
          limit: '10',
          addressdetails: '1',
          viewbox: `${lon - 0.15},${lat + 0.1},${lon + 0.15},${lat - 0.1}`,
          bounded: '1',
        });
      const resp = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'PinitDown/1.0' },
      });
      if (!resp.ok)
        throw new Error(
          'Search request failed. Check your internet connection.',
        );
      const data = await resp.json();
      if (!data.length) {
        // Fallback: wider unbounded search if nothing found in viewport.
        const url2 =
          `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: name,
            format: 'json',
            limit: '10',
            addressdetails: '1',
            lat: String(lat),
            lon: String(lon),
          });
        const resp2 = await fetch(url2, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'PinitDown/1.0' },
        });
        if (!resp2.ok) throw new Error('Search request failed.');
        const data2 = await resp2.json();
        return this.processResults(data2, lat, lon);
      }
      return this.processResults(data, lat, lon);
    },
    processResults(data, userLat, userLon) {
      return data
        .map((item) => {
          const elLat = parseFloat(item.lat);
          const elLon = parseFloat(item.lon);
          const a = item.address || {};
          const address =
            [a.road, a.house_number, a.postcode, a.city || a.town || a.village]
              .filter(Boolean)
              .join(' ') || item.display_name.split(',').slice(0, 3).join(',');
          return {
            name: item.display_name.split(',')[0] || item.name,
            address,
            lat: elLat,
            lon: elLon,
            dist: this.haversineKm(userLat, userLon, elLat, elLon),
          };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);
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
      if (!this.selectedStore) return;
      const { lat, lon, name } = this.selectedStore;
      const encodedName = encodeURIComponent(name);
      let url;
      if (provider === 'apple') {
        // maps:// for native apps, https:// fallback for browsers (Apple Maps works in Safari on any platform).
        const isNative = /iphone|ipad|ipod/i.test(navigator.userAgent);
        url = isNative
          ? `maps://?q=${encodedName}&sll=${lat},${lon}&z=16`
          : `https://maps.apple.com/?q=${encodedName}&sll=${lat},${lon}&z=16`;
      } else {
        const isAndroid = /android/i.test(navigator.userAgent);
        url = isAndroid
          ? `geo:${lat},${lon}?q=${lat},${lon}(${encodedName})`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      }
      window.open(url, '_blank', 'noopener');
      this.selectedStore = null;
    },
    selectStore(store) {
      this.selectedStore = store;
    },
    formatDist(km) {
      return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
    },
    close() {
      this.open = false;
      this.selectedStore = null;
      this.$emit('close');
    },
  },
};
</script>

<template>
  <div v-if="open" class="nearby-overlay" @click.self="close">
    <div class="nearby-modal" role="dialog" :aria-label="`Nearby ${shopName}`">
      <div class="nearby-header">
        <i class="material-icons">location_on</i>
        <span>{{ shopName }} — Nearby</span>
        <button class="nearby-close" @click="close" aria-label="Close">
          <i class="material-icons">close</i>
        </button>
      </div>

      <div v-if="loading" class="nearby-state">
        <i class="material-icons spinning">sync</i>
        Finding nearby stores…
      </div>
      <div v-else-if="error" class="nearby-state nearby-error">
        <i class="material-icons">warning</i>
        {{ error }}
      </div>
      <ul v-else class="nearby-list">
        <li
          v-for="(store, i) in results"
          :key="i"
          class="nearby-item"
          role="button"
          tabindex="0"
          @click="selectStore(store)"
          @keyup.enter="selectStore(store)"
        >
          <div class="nearby-item-info">
            <span class="nearby-item-name">{{ store.name }}</span>
            <span class="nearby-item-address">{{
              store.address || 'Address not available'
            }}</span>
          </div>
          <div class="nearby-item-right">
            <span class="nearby-dist">{{ formatDist(store.dist) }}</span>
            <i class="material-icons nearby-open-icon">open_in_new</i>
          </div>
        </li>
      </ul>

      <!-- Map picker dialog shown when a store is selected -->
      <div
        v-if="selectedStore"
        class="map-picker-overlay"
        @click.self="selectedStore = null"
      >
        <div class="map-picker">
          <p class="map-picker-label">Open in maps</p>
          <p class="map-picker-store">{{ selectedStore.name }}</p>
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
          <button class="map-picker-cancel" @click="selectedStore = null">
            Cancel
          </button>
        </div>
      </div>

      <p class="nearby-attribution">
        Data ©
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener"
        >
          OpenStreetMap
        </a>
        contributors
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.nearby-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: spacing.$spacing-s;
}

.nearby-modal {
  width: min(100%, 480px);
  max-height: 80vh;
  background: color.$white;
  border-radius: size.$sp12;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 size.$sp08 size.$sp32 rgba(color.$dark, 0.3);
  position: relative;
}

.nearby-header {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-s spacing.$spacing-s spacing.$spacing-xxs;
  background: color.$gradient;
  color: color.$light;

  .material-icons:first-child {
    @include typography.headline-200;
  }

  span {
    flex: 1;
    @include typography.headline-160-medium;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .nearby-close {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(color.$light, 0.8);
    display: flex;
    padding: 0;
    appearance: none;
    -webkit-appearance: none;

    &:hover {
      color: color.$light;
    }

    .material-icons {
      @include typography.headline-200;
    }
  }
}

.nearby-state {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-m spacing.$spacing-s;
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

.nearby-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.nearby-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-xxs spacing.$spacing-s;
  cursor: pointer;
  border-bottom: size.$sp01 solid color.$border-light;
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: color.$light-bg-soft;
  }
}

.nearby-item-info {
  display: flex;
  flex-direction: column;
  gap: size.$sp02;
  min-width: 0;
}

.nearby-item-name {
  @include typography.headline-140-medium;
  color: color.$dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nearby-item-address {
  @include typography.headline-120;
  color: color.$muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nearby-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: size.$sp02;
  flex-shrink: 0;
}

.nearby-dist {
  @include typography.headline-120-medium;
  color: color.$blue-violet;
}

.nearby-open-icon {
  @include typography.headline-160;
  color: color.$muted-lighter;
}

.map-picker-overlay {
  position: absolute;
  inset: 0;
  background: rgba(color.$dark, 0.45);
  display: flex;
  align-items: flex-end;
  border-radius: size.$sp12;
  overflow: hidden;
}

.map-picker {
  width: 100%;
  background: color.$white;
  padding: spacing.$spacing-s;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;
  border-top: size.$sp02 solid color.$border-light;
}

.map-picker-label {
  @include typography.headline-120;
  color: color.$muted;
  margin: 0;
  text-align: center;
}

.map-picker-store {
  @include typography.headline-140-medium;
  color: color.$dark;
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
    background: color.$dark;
    color: color.$white;
  }
}

.map-picker-cancel {
  background: none;
  border: none;
  cursor: pointer;
  @include typography.headline-240;
  color: color.$muted;
  text-align: center;
  padding: spacing.$spacing-base 0 0;

  &:hover {
    color: color.$dark;
  }
}

.nearby-attribution {
  padding: spacing.$spacing-base spacing.$spacing-s;
  @include typography.headline-100;
  color: color.$muted-lighter;
  text-align: right;
  border-top: size.$sp01 solid color.$border-light;

  a {
    color: color.$blue-violet;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>

<style lang="scss">
@use '@/styles/abstracts/color';

html.dark .nearby-modal {
  background: color.$dark-medium;
}

html.dark .map-picker {
  background: color.$dark-medium;
  border-top-color: color.$dark-soft;
}

html.dark .map-picker-store {
  color: color.$light;
}

html.dark .map-picker-cancel {
  color: color.$muted-lighter;
  &:hover {
    color: color.$light;
  }
}

html.dark .nearby-item:hover {
  background: color.$dark;
}

html.dark .nearby-item-name {
  color: color.$light;
}
</style>
