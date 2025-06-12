<template>
  <main>
    <header>
      <a href="https://pinia.vuejs.org/" target="_blank">
        <img src="./assets/pinit-down.png" alt="pinia logo" />
      </a>
      <div>
        <h1>Pinit Down</h1>
        <button class="theme-toggle" @click="themeStore.toggleTheme()">
          <i class="material-icons">
            {{ themeStore.isDark ? "dark_mode" : "light_mode" }}
          </i>
        </button>
      </div>
    </header>

    <div class="is-loading" v-if="isLoading">Loading... <LoadingSpinner /></div>
    <div v-else>
      <div class="new-cart-item-form">
        <CartItemForm />
      </div>
      <nav class="filter">
        <button @click="filter = 'All'">All Items</button>
        <button @click="filter = 'Favs'">Fav Items</button>
        <button @click="cartStore.deleteAllCartItems">Delete All Items</button>
      </nav>
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
  </main>
</template>

<script>
import { ref, onMounted } from "vue";
import { useCartStore } from "@/stores/CartStore";
import { useThemeStore } from "@/stores/ThemeStore";
import CartItemDetails from "@/components/CartItemDetails.vue";
import CartItemForm from "@/components/CartItemForm.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { storeToRefs } from "pinia";

export default {
  components: { CartItemDetails, CartItemForm, LoadingSpinner },

  setup() {
    const cartStore = useCartStore();
    const themeStore = useThemeStore();
    onMounted(() => {
      themeStore.loadTheme();
    });

    const { cartItems, isLoading, favs, totalCount, favCount } =
      storeToRefs(cartStore);

    // Fetch Cart Items
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
