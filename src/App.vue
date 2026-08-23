<template>
  <RouterView />
</template>

<script>
import { RouterView } from 'vue-router'
import "@/styles/global.scss";

export default {
  components: {
    RouterView
  }
}
</script>