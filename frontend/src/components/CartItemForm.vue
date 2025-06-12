<template>
  <form class="submit-form" @submit.prevent="handleSubmit">
    <input type="text" v-model="newCartItem" placeholder="I need to..." />
    <button>Add Item</button>
  </form>
</template>

<script>
import { ref } from "vue";
import { useCartStore } from "@/stores/CartStore";

export default {
  setup() {
    const cartStore = useCartStore();

    const newCartItem = ref("");

    const handleSubmit = () => {
  if (newCartItem.value.length > 0) {
    cartStore.addCartItem({
      title: newCartItem.value,
      isFav: false
    })
    newCartItem.value = ""
  }
}

    return { handleSubmit, newCartItem };
  },
};
</script>
