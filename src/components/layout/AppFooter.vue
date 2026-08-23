<script>
export default {
  props: {
    year: {
      type: Number,
      required: true,
    },
  },
};
</script>

<template>
  <footer class="app-footer">
    <p>&copy; {{ year }} Pinit Down. All rights reserved.</p>
  </footer>
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
</style>
