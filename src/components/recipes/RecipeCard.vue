<script>
export default {
  props: {
    recipe: {
      type: Object,
      required: true,
    },
    showSaveAction: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['open-details', 'save-recipe', 'download-recipe'],
};
</script>

<template>
  <button
    type="button"
    class="recipe-card"
    @click="$emit('open-details', recipe)"
  >
    <img
      v-if="recipe.strMealThumb"
      :src="recipe.strMealThumb"
      :alt="recipe.strMeal"
      class="recipe-card-image"
    />
    <div v-else class="recipe-card-image recipe-card-placeholder">No image</div>
    <div class="recipe-card-body">
      <h3>{{ recipe.strMeal }}</h3>
      <p>
        {{ recipe.strCategory || 'Recipe' }}
        <span v-if="recipe.strArea">• {{ recipe.strArea }}</span>
      </p>
      <div class="recipe-card-actions" :class="{ 'has-save': showSaveAction }">
        <button
          type="button"
          class="recipe-card-details"
          @click.stop="$emit('open-details', recipe)"
        >
          <i class="material-icons">visibility</i>
          See details
        </button>

        <button
          v-if="showSaveAction"
          type="button"
          class="recipe-card-save"
          @click.stop="$emit('save-recipe', recipe)"
        >
          <i class="material-icons">bookmark_add</i>
          Save recipe
        </button>

        <button
          type="button"
          class="recipe-card-download"
          @click.stop="$emit('download-recipe', recipe)"
        >
          <i class="material-icons">picture_as_pdf</i>
          Download recipe
        </button>
      </div>
    </div>
  </button>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.recipe-card {
  cursor: pointer;
  border: none;
  background: color.$white;
  border: size.$sp02 solid color.$border-light;
  border-radius: size.$sp12;
  overflow: hidden;
  text-align: left;
  box-shadow: 0 size.$sp04 size.$sp20 rgba(color.$dark, 0.08);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(size.$sp02 * -1);
    box-shadow: 0 size.$sp08 size.$sp24 rgba(color.$dark, 0.12);
  }
}

.recipe-card-image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: color.$light-bg-soft;
}

.recipe-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: color.$muted;
}

.recipe-card-body {
  padding: spacing.$spacing-s;

  h3 {
    margin: 0 0 spacing.$spacing-base;
    color: color.$dark;
    @include typography.headline-160-medium;
  }

  p {
    margin: 0;
    color: color.$muted;
    @include typography.headline-120;
  }
}

.recipe-card-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: spacing.$spacing-xxs;
  margin-top: spacing.$spacing-xs;

  @include breakpoint.media-breakpoint-up(sm) {
    gap: spacing.$spacing-xs;
  }
}

.recipe-card-details,
.recipe-card-save,
.recipe-card-download {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: spacing.$spacing-base;
  width: 100%;
  border: none;
  border-radius: size.$sp08;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  cursor: pointer;
  @include typography.headline-120-medium;

  .material-icons {
    @include typography.headline-140;
  }
}

.recipe-card-details {
  background: rgba(color.$blue-violet, 0.12);
  color: color.$blue-violet-dark;
}

.recipe-card-download {
  background: rgba(color.$danger, 0.12);
  color: color.$danger-dark;
}

.recipe-card-save {
  background: rgba(color.$gold, 0.2);
  color: color.$dark;
}

:global(.dark) .recipe-card {
  background: color.$dark-medium;
  border-color: rgba(color.$light, 0.12);
}

:global(.dark) .recipe-card-body h3 {
  color: color.$light;
}

:global(.dark) .recipe-card-body p {
  color: color.$light50;
}

:global(.dark) .recipe-card-download {
  background: rgba(color.$danger-light, 0.18);
  color: color.$light;
}

:global(.dark) .recipe-card-details {
  background: rgba(color.$light, 0.12);
  color: color.$light;
}

:global(.dark) .recipe-card-save {
  background: rgba(color.$gold, 0.3);
  color: color.$white;
}
</style>
