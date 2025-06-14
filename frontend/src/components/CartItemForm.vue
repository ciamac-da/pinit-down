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

<style lang="css" scoped>

.submit-form {
  display: flex;
  margin: auto;
  width: 70%;
  gap: 10px;
  justify-content: center;
  padding: 40px 0 20px 0;
  border: none;
  box-shadow: none;
  max-width: 1340px;
  margin: auto;
}

.submit-form input {
  border: none;
  width: inherit;
  padding: 10px;
}

.submit-form input:focus,
.submit-form input:active {
  outline: none;
  box-shadow: none;
}


.submit-form button {
    background-color: #ecb732;
    color: white;
    border: none;
    cursor: pointer;
    width: 75px;
    transition: .2s linear all;
    border-radius: 5px;
}

.submit-form button:hover {
  scale: 1.04;
  transition: .2s linear all;
}

.dark .submit-form input {
  background-color: #444;
  color: white;
}

.dark .submit-form button {
  background-color:  #bb9127;
}

</style>