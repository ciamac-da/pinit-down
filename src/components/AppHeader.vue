<script>
export default {
  props: {
    isDark: { type: Boolean, default: true },
    filter: { type: String, default: 'All' },
    savedCount: { type: Number, default: 0 },
  },
  emits: [
    'toggle-theme',
    'update:filter',
    'open-recipes',
    'open-food-facts',
    'open-place-finder',
  ],
  data() {
    return {
      isMobileMenuOpen: false,
    };
  },
  methods: {
    handleFilterSelect(nextFilter) {
      this.$emit('update:filter', nextFilter);
      this.isMobileMenuOpen = false;
    },
    handleRecipesClick() {
      this.$emit('open-recipes');
      this.isMobileMenuOpen = false;
    },
    handleFoodFactsClick() {
      this.$emit('open-food-facts');
      this.isMobileMenuOpen = false;
    },
    handlePlaceFinderClick() {
      this.$emit('open-place-finder');
      this.isMobileMenuOpen = false;
    },
    closeMobileMenu() {
      this.isMobileMenuOpen = false;
    },
  },
  computed: {
    isFoodFactsRoute() {
      return this.filter === 'FoodFacts';
    },
    isPlaceFinderRoute() {
      return this.filter === 'PlaceFinder';
    },
  },
};
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo-section">
        <a class="logo" href="/">
          <img src="../assets/pinit-down.png" alt="Pinit Down logo" />
        </a>
        <h1>Pinit Down</h1>
      </div>
      <div class="header-actions">
        <div class="header-nav desktop-nav">
          <button
            class="nav-btn"
            :class="{ active: filter === 'All' }"
            @click="handleFilterSelect('All')"
          >
            <i class="material-icons">shopping_cart</i>
            Cart
          </button>
          <button
            class="nav-btn recipes-btn"
            :class="{ active: filter === 'Recipes' }"
            @click="handleRecipesClick"
          >
            <i class="material-icons">menu_book</i>
            Recipes
          </button>
          <button
            class="nav-btn"
            :class="{ active: isFoodFactsRoute }"
            @click="handleFoodFactsClick"
          >
            <i class="material-icons">science</i>
            Food Facts
          </button>
          <button
            class="nav-btn"
            :class="{ active: isPlaceFinderRoute }"
            @click="handlePlaceFinderClick"
          >
            <i class="material-icons">map</i>
            Places
          </button>
          <button
            class="nav-btn"
            :class="{ active: filter === 'Favs' }"
            @click="handleFilterSelect('Favs')"
          >
            <i class="material-icons">bookmark</i>
            Saved ({{ savedCount }})
          </button>
        </div>

        <button
          @click="
            $emit('toggle-theme');
            closeMobileMenu();
          "
          :class="{ dark: isDark }"
          class="theme-toggle"
          :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <i class="material-icons">{{
            isDark ? 'dark_mode' : 'light_mode'
          }}</i>
        </button>
        <div class="mobile-nav-wrapper">
          <button
            class="mobile-menu-toggle"
            :aria-expanded="isMobileMenuOpen"
            aria-label="Toggle navigation menu"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <i class="material-icons">menu</i>
          </button>

          <div v-if="isMobileMenuOpen" class="mobile-menu-dropdown">
            <button
              class="nav-btn"
              :class="{ active: filter === 'All' }"
              @click="handleFilterSelect('All')"
            >
              <i class="material-icons">shopping_cart</i>
              Cart
            </button>
            <button
              class="nav-btn recipes-btn"
              :class="{ active: filter === 'Recipes' }"
              @click="handleRecipesClick"
            >
              <i class="material-icons">menu_book</i>
              Recipes
            </button>
            <button
              class="nav-btn"
              :class="{ active: isFoodFactsRoute }"
              @click="handleFoodFactsClick"
            >
              <i class="material-icons">science</i>
              Food Facts
            </button>
            <button
              class="nav-btn"
              :class="{ active: isPlaceFinderRoute }"
              @click="handlePlaceFinderClick"
            >
              <i class="material-icons">map</i>
              Places
            </button>
            <button
              class="nav-btn"
              :class="{ active: filter === 'Favs' }"
              @click="handleFilterSelect('Favs')"
            >
              <i class="material-icons">bookmark</i>
              Saved ({{ savedCount }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  text-align: center;
  background: color.$blue-violet;
  display: flex;
  padding: spacing.$spacing-base;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;

  .header-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: spacing.$spacing-base spacing.$spacing-xs;
    max-width: size.$sp-max-desktop;
    min-height: size.$sp32;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xxs 0;
  }
}

.logo-section {
  display: flex;
  align-items: center;

  .logo {
    @include breakpoint.media-breakpoint-up(sm) {
      transform: rotate(-10deg);
      transition: 0.5s linear all;
    }

    &:hover {
      @include breakpoint.media-breakpoint-up(sm) {
        transform: rotate(350deg) !important;
      }
    }

    img {
      max-width: size.$sp24;
      max-height: size.$sp24;

      @include breakpoint.media-breakpoint-up(sm) {
        max-width: size.$sp48;
        max-height: size.$sp48;
        cursor: pointer;
      }
    }
  }
}

h1 {
  margin: 0;
  @include typography.headline-160;
  color: color.$light;
  width: max-content;
}

.header-actions {
  display: flex;
  gap: spacing.$spacing-xs;
  margin: 0;
  align-items: center;
  padding-right: 0;
  position: relative;
  width: 100%;
  justify-content: flex-end;

  .header-nav {
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
    margin-right: spacing.$spacing-base;
  }

  .desktop-nav {
    display: none;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: spacing.$spacing-xs;
    width: max-content;
    border: size.$sp02 solid rgba(color.$light, 0.4);
    background: rgba(color.$light, 0.12);
    color: color.$light;
    border-radius: size.$sp06;
    padding: spacing.$spacing-xxs;
    cursor: pointer;
    @include typography.headline-160-medium;
    transition: 0.2s linear all;

    .material-icons {
      @include typography.headline-200;
    }

    &:hover {
      background: rgba(color.$light, 0.25);
    }

    &.active {
      background: color.$gold;
      border-color: color.$gold;
      color: color.$white;
    }
  }

  .recipes-btn {
    background: rgba(color.$white, 0.08);
  }

  .mobile-nav-wrapper {
    position: relative;
  }

  .mobile-menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: size.$sp02 solid rgba(color.$light, 0.4);
    background: rgba(color.$light, 0.12);
    color: color.$light;
    border-radius: size.$sp06;
    padding: spacing.$spacing-xxs;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;

    .material-icons {
      @include typography.headline-160;
    }
  }

  .mobile-menu-dropdown {
    position: absolute;
    top: calc(100% + spacing.$spacing-base);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: spacing.$spacing-xxs;
    min-width: size.$sp76;
    background: color.$blue-violet-dark;
    border: size.$sp02 solid rgba(color.$light, 0.25);
    border-radius: size.$sp08;
    padding: spacing.$spacing-base;
    box-shadow: 0 size.$sp04 size.$sp20 rgba(color.$dark, 0.35);
    z-index: 110;

    .nav-btn {
      width: 100%;
      justify-content: flex-start;
      padding: spacing.$spacing-xs;
    }
  }

  .theme-toggle {
    cursor: pointer;
    padding: spacing.$spacing-base;
    background: transparent;
    border: none;
    appearance: none;
    -webkit-appearance: none;
    transition: 0.3s ease-in-out transform;

    &:hover {
      transform: rotate(360deg);
    }

    i {
      color: color.$gold;
      @include typography.headline-200;
    }
  }

  @include breakpoint.media-breakpoint-up(sm) {
    width: auto;
    justify-content: flex-end;

    .desktop-nav {
      display: flex;
    }

    .mobile-nav-wrapper {
      display: none;
    }

    .header-nav {
      gap: spacing.$spacing-xxs;
      margin-right: spacing.$spacing-xxs;
    }

    .nav-btn {
      padding: spacing.$spacing-base spacing.$spacing-xxs;
      @include typography.headline-120-medium;

      .material-icons {
        @include typography.headline-140;
      }
    }
  }
}

html.dark .app-header {
  background: color.$gold;
}
html.dark .theme-toggle {

    i {
      color: color.$blue-violet;
    }
  }

  html.dark .mobile-menu-dropdown {
    background: color.$dark;
    border-color: color.$dark;
  }
  html.dark .nav-btn {
     &.active {
      background-color: color.$gold;
    }
  }
</style>
