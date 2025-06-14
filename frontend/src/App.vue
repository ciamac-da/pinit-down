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
  <button
    :class="{ active: filter === 'All' }"
    @click="filter = 'All'"
  >
    All Items
  </button>
  <button
    :class="{ active: filter === 'Favs' }"
    @click="filter = 'Favs'"
  >
    Fav Items
  </button>
  <button
    class="delete-all"
    @click="cartStore.deleteAllCartItems"
  >
    Delete All Items
  </button>
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

<style lang="css">
  header {
  text-align: center;
  background: blueviolet;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

header img {
  max-width: 80px;
  transform: rotate(-10deg);
  transition: .5s linear all;
  cursor: pointer;
}

header img:hover {
  transform: rotate(6rad);
  transition: .5s linear all;
}

header h1 {
  margin: 0;
  font-size: 48px;
  padding-top: 25px;
  margin-left: 15px;
  color: white;
  transform: rotate(2deg);
}

.theme-toggle {
  position: absolute;
  right: 12px;
  top: 85px;
  cursor: pointer;
  padding: 8px;
  transition: .5s linear all;
  background: transparent;
  border: none;
}

.theme-toggle:hover {
  transform: rotate(6rad);
  transition: .5s linear all;
}

.theme-toggle i {
  color: #ecb732;
  font-size: 28px;
}

.is-loading {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin: auto;
  align-items: center;
  font-weight: bolder;
  width: 100%;
  gap: 10px;
  justify-content: center;
  vertical-align:middle;
  position: absolute;
  top: 50%;
  font-size: 28px;
  text-shadow: 5px 1px 7px blueviolet;
  color: white;
}
.new-cart-item-form {
  max-width: 1340px;
  margin: auto;
}

.filter {
  max-width: 640px;
  display: flex;
  gap: 5px;
  justify-content: flex-end;
  margin: auto;
  text-align: center;
  padding: 60px 12px 0 12px;
}

.filter button {
  color: white;
  background: blueviolet;
  border-radius: 5px;
  border:none;
  cursor: pointer;
  padding: 10px;
  transition: .2s linear all;

}
.filter button.active {
  background-color: #ecb732;
  color: black;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  scale: 1.05;
}

.filter button:hover {
  scale: 1.04;
  transition: .2s linear all;
}
.filter button:focus,
.filter button:active {
  color: #d4cdcd;
}

.cart-item-list {
  max-width: 640px;
  margin: 20px auto;
  padding: 0 12px;
}




/* ---------------------- */
/* MEDIA QUERY */
/* ---------------------- */

@media only screen and (max-width: 767px) {

  header h1 {
  font-size: 28px;
}
  .is-loading {
  font-size: 20px;
}
.theme-toggle {
  top: 75px;
}
}

.dark header {
  background: #2c125f;
}

.dark .theme-toggle i {
  color: #ecb732;
}

.dark .is-loading {
  color: #ecb732;
  text-shadow: 2px 1px 4px #8a2be2;
}

.dark .filter button {
  background: #4c1d95;
}
.dark .filter button.active {
  background-color: #bb9127;
  color: white;
}

</style>
