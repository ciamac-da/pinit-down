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

<style lang="css" scoped>
  .cart-item {
  padding: 6px 20px;
  background: #fff;
  margin-top: 20px;
  border-radius: 4px;
  box-shadow: 2px 4px 6px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-item h3, .cart-item .icons {
  display: inline-block;
}

.cart-item .icons {
  text-align: right;
}

.cart-item i {
  font-size: 1.4em;
  margin-left: 6px;
  cursor: pointer;
  color: #bbb;
  transition: .2s linear all;
}

.cart-item i:hover {
  scale: 1.04;
  transition: .2s linear all;
}

.cart-item .fav {
  color: red;
}

.cart-item i.active,
.cart-item i:hover
{
  color: #ecb732;
}

.dark .cart-item {
  background: #333;
  color: #eee;
  box-shadow: 2px 4px 6px rgba(255,255,255,0.05);
}

.dark .cart-item .fav {
  color: red;
}


.dark .cart-item i {
  color: #888;
}

.dark .cart-item i.active,
.dark .cart-item i:hover {
  color: #ecb732;
}

</style>