<script>
import { useCartStore } from "@/stores/CartStore";

export default {
  props: ["cartItem"],

  setup() {
    const cartStore = useCartStore();

    return { cartStore };
  },
};
</script>

<template>
  <div class="cart-item">
    <h3>{{ cartItem.title }}</h3>
    <div class="icon">
      <i @click="cartStore.deleteCartItem(cartItem._id)" class="material-icons"
        >delete</i
      >
      <i
        @click="cartStore.toggleFav(cartItem._id)"
        :class="['material-icons', cartItem.isFav ? 'fav' : '']"
        >favorite</i
      >
    </div>
  </div>
</template>
