# Project Overview — pinit-down

> Living reference for how this app is structured. Update this file whenever you add/remove/rename files, stores, routes, or change core behavior, so future work doesn't require re-scanning the whole codebase.

## Stack
- Vue 3 (Options API mostly, some `<script setup>`) + Vite
- Pinia for state (`src/stores`)
- Vue Router (`src/router/index.js`)
- SCSS (`src/styles`), Material Icons
- `jspdf` for PDF export, `@vueuse/core` utilities
- Deployed at https://pinit-down.vercel.app/
- Env var: `VITE_FDC_API_KEY` (FoodData Central API key), used by USDA foundation foods lookups

## App Structure
- Single route-driven SPA. `App.vue` just renders `<RouterView />`.
- Routes (`src/router/index.js`):
  - `/` → `HomeView.vue` — main app shell (cart board, favorites, food facts panel, recipes, nearby places, header/footer, splash screen)
  - `/food-facts` and `/food-facts/:fdcId` → `FoodFactsView.vue` — USDA FoodData Central search & nutrient details

## State (Pinia stores)
- **`CartStore.js`** (`useCartStore`, id `cartStore`) — core domain store:
  - `cartItems`: shopping list items, persisted to `localStorage` key `pinit_cart_items`
  - Items can be `isSaved` (favorites/templates) vs active cart items; `savedFrom` links a saved item back to its source cart item
  - Groups: items have a `group` name; `customGroups` (localStorage `pinit_custom_groups`) and `groupOrder` (localStorage `pinit_group_order`) control custom grouping/ordering
  - `savedPlaces`: nearby places saved by user, localStorage `pinit_saved_places`
  - Toast notifications: `toast` state + `showToast()`/`dismissToast()` (auto-dismiss after 2.6s)
  - Getters: `savedItems`, `savedCount`, `totalCount`, `isCartItemSaved(id)`, `groups`, `itemsByGroup`, `savedByGroup`
  - Helper fns (module-private): `generateId`, `normalizeItemMeasure` (default amount=1, unit='pieces'), `normalizeGroupName` (title-case), `getGroupKey`, `resolveGroupName`, `getItemSignature`/`getGroupSignatures` (dedupe/compare items)
- **`ThemeStore.js`** (`useThemeStore`, id `themeStore`) — dark/light mode toggle; persists to localStorage key `themeStore`; toggles `dark` class on `document.documentElement`

## Services
- **`foodFactsApi.js`** — nutrient extraction helpers for USDA FoodData Central responses. `extractCoreNutrients(food)` pulls calories/protein/carbs/fat/fiber from either `labelNutrients` or `foodNutrients[]`, normalizing name/unit variants.

## Views
- **`HomeView.vue`** — the main screen. Composes: `AppHeader`, `AppFooter`, `CartBoardPanel`, `FavoritesTemplatesPanel`, `FoodFactsPanel`, `NearbyPlacesView`, `RecipeCard`/`RecipeDetailsModal`/`RecipesToolbar`, `ConfirmDialog`. Handles recipe search/filtering (via TheMealDB API `https://www.themealdb.com/api/json/v1/1`), unit mapping for recipe ingredients, splash screen, footer year.
- **`FoodFactsView.vue`** (`<script setup>`) — search UI over `public/foundation-foods.json` dataset + FDC details route (`/food-facts/:fdcId`).
- **`NearbyPlacesView.vue`** — category browser (Food & Drink, Things to Do, Shopping, Services) for nearby-places search, likely using `NearbyStoresModal.vue` and geolocation/maps API.

## Components (`src/components`)
- `AppHeader.vue`, `layout/AppFooter.vue` — global chrome
- `FilterNav.vue` — top-level filter/tab navigation (switches between cart/favorites/food-facts/recipes/nearby sections)
- `ConfirmDialog.vue` — generic confirm modal (delete confirmations, etc.)
- `CartItemForm.vue` / `CartItemDetails.vue` — add/edit a cart item, view item details. `CartItemDetails.vue` shows edit and mark-purchased (cart) icons directly, plus a "more" (⋮ `more_vert`) icon that opens a dropdown with save-as-favorite, move-to-another-shop (send — opens a bottom-sheet picker via `cartStore.editCartItem(id, { group })`), and delete.
- `NearbyStoresModal.vue` — modal listing nearby places for a chosen category
- `cart/CartBoardPanel.vue` — main cart list/board (grouped items view). Group headers are sticky (CSS var `--group-sticky-top`, measured from the toolbar's height via `ResizeObserver`) so the active shop's header stays visible while scrolling. Each group also has an "Add item" button at the bottom of its list (`.add-item-end-btn`), in addition to the one in the group header, so long lists don't require scrolling back up. Group header actions: add-item and find-nearby-store icons stay visible; save-as-template and delete-shop are consolidated behind a "more" (⋮ `more_vert`) dropdown (`openGroupMenu` state). Drag reordering is disabled on touch devices (`isTouchDevice` via `pointer: coarse`).
- `favorites/FavoritesTemplatesPanel.vue` — saved/template items panel
- `food-facts/FoodFactsPanel.vue` — embedded food-facts search panel (used inside `HomeView`)
- `recipes/RecipeCard.vue`, `RecipeDetailsModal.vue`, `RecipesToolbar.vue` — recipe browsing (TheMealDB-backed), ingredient-to-cart integration

## Styles
- `src/styles/global.scss` imports `abstracts/_index.scss` which aggregates: `_breakpoint.scss`, `_color.scss`, `_size.scss`, `_spacing.scss`, `_typography.scss`, and `breakpoint/_variables.scss`.

## Data
- `public/foundation-foods.json` — static USDA foundation foods dataset used by `FoodFactsView` search (avoids hitting the live API for search).

## Conventions Observed
- localStorage keys are prefixed `pinit_` (except `themeStore`).
- Group names are normalized to Title Case; comparisons use lowercase "group keys".
- Most components use Options API `<script>`; newer files (`FoodFactsView.vue`) use `<script setup>`.
- Path alias `@/` → `src/` (see `jsconfig.json` / `vite.config.js`).

## Maintenance Rule
**Whenever a change is made to routes, stores, services, or the component tree, update the relevant section above in the same commit/session.**
