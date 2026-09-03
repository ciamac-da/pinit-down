<template>
  <RouterView />
  <UpgradeModal />
</template>

<script>
import { RouterView } from 'vue-router'
import UpgradeModal from '@/components/UpgradeModal.vue';
import { useSubscriptionStore } from '@/stores/SubscriptionStore';
import "@/styles/global.scss";

export default {
  components: {
    RouterView,
    UpgradeModal,
  },
  setup() {
    useSubscriptionStore().init();
  },
}
</script>