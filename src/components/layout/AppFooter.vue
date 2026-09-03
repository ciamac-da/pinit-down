<script>
export default {
  props: {
    year: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      showCredits: false,
    };
  },
};
</script>

<template>
  <footer class="app-footer">
    <p>
      <span
        class="copyright-symbol"
        role="button"
        tabindex="0"
        title="Credits & data sources"
        @click="showCredits = true"
        @keyup.enter="showCredits = true"
        >&copy;</span
      >
      {{ year }} Pinit Down. All rights reserved.
    </p>
  </footer>

  <div
    v-if="showCredits"
    class="credits-overlay"
    @click.self="showCredits = false"
  >
    <div class="credits-dialog" role="dialog" aria-modal="true" aria-label="Credits & data sources">
      <h3>Pinit Down</h3>
      <p class="credits-year">&copy; {{ year }} Pinit Down. All rights reserved.</p>

      <p class="credits-lead">This app uses the following free/public data sources & services:</p>
      <ul class="credits-list">
        <li>
          <strong>USDA FoodData Central</strong> — Foundation Foods
          nutrition datasets, used in the Food Facts search.
        </li>
        <li>
          <strong>TheMealDB API</strong> — recipes, categories, ingredients and
          instructions shown in the Recipes tab.
        </li>
        <li>
          <strong>OpenStreetMap / Nominatim</strong> — place search and
          geocoding used to find nearby shops, restaurants and other places.
        </li>
        <li>
          <strong>Google Maps</strong> and <strong>Apple Maps</strong> — used
          only to open directions to a selected place on your device.
        </li>
      </ul>

      <p class="credits-ownership">
        Pinit Down, including its name, design, source code and content, is
        the exclusive property of its owner, Dipl.-Ing. Ciamac Davoudi. All
        rights reserved. No part of this application may be copied,
        reproduced, distributed or used without prior written permission from
        the owner.
      </p>

      <button type="button" class="credits-close-btn" @click="showCredits = false">
        Close
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';
@use '@/styles/abstracts/breakpoint';

.app-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 spacing.$spacing-xs;
  background: rgba(color.$blue-violet, 0.88);
  backdrop-filter: blur(size.$sp04);

  p {
    margin: 0;
    color: color.$light;
    @include typography.headline-120;
    text-align: center;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-base spacing.$spacing-xs;
  }
}

.copyright-symbol {
  cursor: pointer;
  text-decoration: underline dotted;
  &:hover {
    color: color.$white;
  }
}

.credits-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.48);
  backdrop-filter: blur(size.$sp02);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 210;
  padding: spacing.$spacing-s;
}

.credits-dialog {
  width: 100%;
  max-width: size.$sp80 * 4;
  max-height: 80vh;
  overflow-y: auto;
  background: color.$white;
  border-radius: size.$sp12;
  padding: spacing.$spacing-s;
  box-shadow: 0 size.$sp06 size.$sp24 rgba(color.$dark, 0.35);

  h3 {
    @include typography.headline-180-medium;
    color: color.$dark;
    margin: 0 0 spacing.$spacing-xxs;
  }
}

.credits-year {
  @include typography.headline-120;
  color: color.$muted;
  margin: 0 0 spacing.$spacing-s;
}

.credits-lead {
  @include typography.headline-140-medium;
  color: color.$dark;
  margin: 0 0 spacing.$spacing-xxs;
}

.credits-list {
  margin: 0 0 spacing.$spacing-s;
  padding-left: spacing.$spacing-s;
  color: color.$muted;
  @include typography.headline-120;

  li {
    margin-bottom: spacing.$spacing-xxs;
  }

  strong {
    color: color.$dark;
  }
}

.credits-ownership {
  @include typography.headline-100;
  color: color.$muted;
  border-top: size.$sp02 solid color.$border;
  padding-top: spacing.$spacing-xxs;
  margin: 0 0 spacing.$spacing-s;
}

.credits-close-btn {
  width: 100%;
  border: none;
  border-radius: size.$sp06;
  padding: spacing.$spacing-base spacing.$spacing-xs;
  cursor: pointer;
  background: color.$blue-violet;
  color: color.$white;
  @include typography.headline-140-medium;
}

html.dark .app-footer {
  background: color.$gold;
  color: color.$dark50;
}

html.dark .credits-dialog {
  background: color.$dark;
  box-shadow: 0 size.$sp06 size.$sp24 rgba(color.$white, 0.35);

  h3 {
    color: color.$white;
  }

   p {
    color: color.$white;
  }

  .credits-list,
  .credits-list strong {
    color: color.$white;
  }

  .credits-close-btn {
    background-color: color.$gold;
  }
}
</style>
