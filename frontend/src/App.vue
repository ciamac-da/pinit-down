<template>
  <main>
    <AppHeader :isDark="themeStore.isDark" @toggle-theme="themeStore.toggleTheme()" />

    <div class="is-loading" v-if="isLoading">Loading... <LoadingSpinner /></div>
    <div class="container-wrapper" v-else>
      <div class="container">
      <CartItemForm />
      <FilterNav
        :filter="filter"
        @update:filter="filter = $event"
        @delete-all="cartStore.deleteAllCartItems"
      />

      <div class="cart-item-list" v-if="filter === 'All'">
        <p>
          You have {{ totalCount }}
          {{ totalCount <= 1 ? "Cart Item" : "Cart Items" }}
        </p>
        <div v-for="cartItem in cartItems" :key="cartItem.id">
          <CartItemDetails :cartItem="cartItem" />
        </div>
      </div>

      <div class="cart-item-list" v-if="filter === 'Favs'">
        <p>
          You have {{ favCount }} Fav
          {{ favCount <= 1 ? "Cart Item" : "Cart Items" }}
        </p>
        <div v-for="cartItem in favs">
          <CartItemDetails :cartItem="cartItem" />
        </div>
      </div>
    </div>
  </div>
  </main>
</template>

<script>
import { ref, onMounted } from "vue";
import { useCartStore } from "@/stores/CartStore";
import { useThemeStore } from "@/stores/ThemeStore";
import { storeToRefs } from "pinia";

import AppHeader from "@/components/AppHeader.vue";
import FilterNav from "@/components/FilterNav.vue";
import CartItemDetails from "@/components/CartItemDetails.vue";
import CartItemForm from "@/components/CartItemForm.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import "@/assets/global.css";

export default {
  components: {
    AppHeader,
    FilterNav,
    CartItemDetails,
    CartItemForm,
    LoadingSpinner,
  },

  setup() {
    const cartStore = useCartStore();
    const themeStore = useThemeStore();

    onMounted(() => {
      themeStore.loadTheme();
    });

    const { cartItems, isLoading, favs, totalCount, favCount } =
      storeToRefs(cartStore);

    cartStore.getCartItems();

    const filter = ref("All");

    return {
      cartStore,
      themeStore,
      filter,
      cartItems,
      isLoading,
      favs,
      totalCount,
      favCount,
    };
  },
};
</script>