<script>
export default {
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    recipe: {
      type: Object,
      default: null,
    },
    recipeIngredients: {
      type: Array,
      default: () => [],
    },
    recipeLinks: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['close', 'save-recipe', 'download-recipe', 'save-ingredient'],
};
</script>

<template>
  <div v-if="open" class="recipe-modal-overlay" @click.self="$emit('close')">
    <div class="recipe-modal" role="dialog" aria-modal="true">
      <button type="button" class="recipe-modal-close" @click="$emit('close')">
        <i class="material-icons">close</i>
      </button>

      <div v-if="loading" class="recipe-modal-loading">
        Loading recipe details...
      </div>

      <template v-else-if="recipe">
        <img
          v-if="recipe.strMealThumb"
          :src="recipe.strMealThumb"
          :alt="recipe.strMeal"
          class="recipe-modal-image"
        />
        <div v-else class="recipe-modal-image recipe-modal-image-placeholder">
          No image available
        </div>

        <div class="recipe-modal-content">
          <h2>{{ recipe.strMeal }}</h2>
          <p class="recipe-modal-meta">
            {{ recipe.strCategory || 'Recipe' }}
            <span v-if="recipe.strArea"> • {{ recipe.strArea }} </span>
          </p>

          <div class="recipe-modal-actions">
            <button
              type="button"
              class="recipe-primary-action"
              @click="$emit('save-recipe')"
            >
              <i class="material-icons">add</i>
              Save recipe
            </button>

            <button
              type="button"
              class="recipe-link-action"
              @click="$emit('download-recipe', recipe)"
            >
              <i class="material-icons">picture_as_pdf</i>
              Download recipe
            </button>

            <a
              v-for="recipeLink in recipeLinks"
              :key="recipeLink.href"
              :href="recipeLink.href"
              target="_blank"
              rel="noreferrer"
              class="recipe-link-action"
            >
              <i class="material-icons">{{ recipeLink.icon }}</i>
              {{ recipeLink.label }}
            </a>
          </div>

          <div class="recipe-ingredients-section">
            <h3>Ingredients</h3>
            <ul class="recipe-ingredients-list">
              <li
                v-for="recipeIngredient in recipeIngredients"
                :key="`${recipe.idMeal}-${recipeIngredient.ingredient}`"
              >
                <div class="recipe-ingredient-main">
                  <img
                    :src="recipeIngredient.thumbnail"
                    :alt="recipeIngredient.ingredient"
                    class="recipe-ingredient-thumb"
                    @error="$event.target.style.display = 'none'"
                  />
                  <div class="recipe-ingredient-copy">
                    <span>{{ recipeIngredient.ingredient }}</span>
                    <strong>{{ recipeIngredient.measure }}</strong>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div
            v-if="recipe.strInstructions"
            class="recipe-instructions-section"
          >
            <h3>Instructions</h3>
            <p>{{ recipe.strInstructions }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.recipe-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: spacing.$spacing-s;
  background: rgba(color.$dark-deep, 0.55);
}

.recipe-modal {
  position: relative;
  width: min(100%, spacing.$spacing-2-xl * 10);
  max-height: calc(100vh - spacing.$spacing-m);
  overflow-y: auto;
  background: color.$white;
  border-radius: size.$sp16;
  box-shadow: 0 size.$sp12 size.$sp32 rgba(color.$dark, 0.25);
}

.recipe-modal-close {
  position: absolute;
  top: spacing.$spacing-xs;
  right: spacing.$spacing-xs;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: size.$sp40;
  height: size.$sp40;
  border: none;
  border-radius: 50%;
  background: rgba(color.$dark, 0.55);
  color: color.$white;
  cursor: pointer;
}

.recipe-modal-loading {
  padding: spacing.$spacing-xl;
  text-align: center;
  @include typography.headline-160;
  color: color.$muted;
}

.recipe-modal-image {
  display: block;
  width: 100%;
  max-height: calc(size.$sp32 * 10);
  object-fit: cover;
  background: color.$light-bg-soft;
}

.recipe-modal-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: color.$muted;
}

.recipe-modal-content {
  padding: spacing.$spacing-s;

  h2 {
    margin: 0 0 spacing.$spacing-base;
    color: color.$dark;
    @include typography.headline-240-medium;
  }
}

.recipe-modal-meta {
  margin: 0 0 spacing.$spacing-s;
  color: color.$muted;
  @include typography.headline-140;
}

.recipe-modal-actions {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: spacing.$spacing-xxs;
  margin-bottom: spacing.$spacing-s;
}

.recipe-primary-action,
.recipe-link-action,
.recipe-ingredient-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: spacing.$spacing-base;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.recipe-primary-action,
.recipe-link-action {
  min-height: size.$sp40;
  border-radius: size.$sp10;
  padding: spacing.$spacing-base spacing.$spacing-xs;
  @include typography.headline-140-medium;
}

.recipe-primary-action {
  background: color.$gold;
  color: color.$white;
}

.recipe-link-action {
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;
}

.recipe-ingredients-section,
.recipe-instructions-section {
  h3 {
    margin: 0 0 spacing.$spacing-xs;
    color: color.$dark;
    @include typography.headline-180-medium;
  }
}

.recipe-ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-base;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: spacing.$spacing-s;
    padding-bottom: spacing.$spacing-base;
    border-bottom: size.$sp02 solid color.$border-light;
    color: color.$dark-soft;
    @include typography.headline-140;
  }
}

.recipe-ingredient-main {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  min-width: 0;
  flex: 1;
}

.recipe-ingredient-thumb {
  width: size.$sp40;
  height: size.$sp40;
  object-fit: contain;
  border-radius: size.$sp08;
  background: color.$light-bg-soft;
  padding: spacing.$spacing-base;
  flex-shrink: 0;
}

.recipe-ingredient-copy {
  display: flex;
  flex-direction: column;
  gap: size.$sp04;
  min-width: 0;

  span,
  strong {
    overflow-wrap: anywhere;
  }

  strong {
    color: color.$dark;
  }
}

.recipe-ingredient-add {
  width: size.$sp36;
  height: size.$sp36;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;
}

.recipe-instructions-section {
  margin-top: spacing.$spacing-s;

  p {
    margin: 0;
    white-space: pre-line;
    color: color.$dark-soft;
    @include typography.headline-140;
  }
}

:global(.dark) .recipe-modal {
  background: color.$dark-medium;
}

:global(.dark) .recipe-link-action,
:global(.dark) .recipe-ingredient-add {
  background: rgba(color.$light, 0.12);
  color: color.$light;
}

:global(.dark) .recipe-ingredients-list li {
  border-color: rgba(color.$light, 0.12);
}

:global(.dark) .recipe-modal-content h2,
:global(.dark) .recipe-ingredients-section h3,
:global(.dark) .recipe-instructions-section h3,
:global(.dark) .recipe-ingredients-list strong,
:global(.dark) .recipe-ingredient-copy strong {
  color: color.$light;
}

:global(.dark) .recipe-modal-meta,
:global(.dark) .recipe-instructions-section p,
:global(.dark) .recipe-ingredients-list li {
  color: color.$light50;
}
</style>
