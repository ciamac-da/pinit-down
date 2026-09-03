<script>
export default {
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm action' },
    message: { type: String, default: 'Are you sure?' },
    confirmText: { type: String, default: 'Delete' },
    cancelText: { type: String, default: 'Cancel' },
  },
  emits: ['confirm', 'cancel'],
};
</script>

<template>
  <div v-if="open" class="confirm-overlay" @click.self="$emit('cancel')">
    <div
      class="confirm-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <div class="confirm-icon-wrap">
        <i class="material-icons">warning</i>
      </div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="confirm-actions">
        <button class="cancel-btn" @click="$emit('cancel')">
          {{ cancelText }}
        </button>
        <button class="delete-btn" @click="$emit('confirm')">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.confirm-overlay {
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

.confirm-dialog {
  width: 100%;
  justify-items: center;
  max-width: size.$sp80 * 4;
  background: color.$white;
  border-radius: size.$sp12;
  padding: spacing.$spacing-s;
  box-shadow: 0 size.$sp06 size.$sp24 rgba(color.$dark, 0.35);

  h3 {
    @include typography.headline-180-medium;
    color: color.$dark;
    margin: 0;
  }

  p {
    @include typography.headline-140;
    color: color.$muted;
    margin: spacing.$spacing-xxs 0 spacing.$spacing-s 0;
  }
}

.confirm-icon-wrap {
  width: size.$sp40;
  height: size.$sp40;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color.$danger-bg;
  margin-bottom: spacing.$spacing-xxs;

  .material-icons {
    @include typography.headline-200;
    color: color.$danger;
  }
}

.confirm-actions {
  display: inline-flex;
  justify-content: flex-end;
  gap: spacing.$spacing-xxs;
  justify-content: space-around;
  width: 100%;
}

.cancel-btn,
.delete-btn {
  border: none;
  border-radius: size.$sp06;
  padding: spacing.$spacing-base spacing.$spacing-xs;
  cursor: pointer;
  @include typography.headline-140-medium;
}

.cancel-btn {
  background: color.$light-bg;
  color: color.$dark;
}

.delete-btn {
  background: color.$danger;
  color: color.$white;
}

html.dark .confirm-dialog {
  background: color.$dark;
    box-shadow: size.$sp01 size.$sp01 size.$sp20 color.$white;
  h3 {
    color: color.$white;
  }

  p {
    color: color.$white;
  }
}
</style>
