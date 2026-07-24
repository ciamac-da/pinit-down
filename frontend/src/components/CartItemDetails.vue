<script>
import { ref } from "vue";
import { useCartStore } from "@/stores/CartStore";
import { storeToRefs } from "pinia";

export default {
  props: {
    cartItem: { type: Object, required: true },
    index: { type: Number, default: 0 },
    total: { type: Number, default: 1 },
    isSavedView: { type: Boolean, default: false },
  },

  setup(props) {
    const cartStore = useCartStore();
    const { groups } = storeToRefs(cartStore);
    const confirmingDelete = ref(false);
    const editing = ref(false);
    const editTitle = ref('');
    const editGroup = ref('');

    const isAlreadySaved = () => {
      return cartStore.cartItems.some(i => i.isSaved && i.savedFrom === props.cartItem._id);
    };

    const requestDelete = () => {
      confirmingDelete.value = true;
    };

    const cancelDelete = () => {
      confirmingDelete.value = false;
    };

    const confirmDelete = () => {
      cartStore.deleteCartItem(props.cartItem._id);
      confirmingDelete.value = false;
    };

    const startEdit = () => {
      editTitle.value = props.cartItem.title;
      editGroup.value = props.cartItem.group || 'General';
      editing.value = true;
    };

    const cancelEdit = () => {
      editing.value = false;
    };

    const saveEdit = () => {
      const updates = {};
      const newTitle = editTitle.value.trim();
      if (newTitle && newTitle !== props.cartItem.title) {
        updates.title = newTitle;
      }
      if (editGroup.value !== (props.cartItem.group || 'General')) {
        updates.group = editGroup.value;
      }
      if (Object.keys(updates).length > 0) {
        cartStore.editCartItem(props.cartItem._id, updates);
      }
      editing.value = false;
    };

    return { cartStore, groups, confirmingDelete, editing, editTitle, editGroup, isAlreadySaved, requestDelete, cancelDelete, confirmDelete, startEdit, cancelEdit, saveEdit };
  },
};
</script>

<template>
  <div class="cart-items">
    <!-- Edit mode -->
    <div v-if="editing" class="cart-item edit-mode">
      <input
        v-model="editTitle"
        class="edit-input"
        placeholder="Item name..."
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        autofocus
      />
      <select v-model="editGroup" class="edit-select">
        <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
      </select>
      <div class="edit-actions">
        <i @click="saveEdit" class="material-icons edit-save">check</i>
        <i @click="cancelEdit" class="material-icons edit-cancel">close</i>
      </div>
    </div>

    <!-- Normal mode -->
    <div v-else class="cart-item" :class="{ purchased: cartItem.isPurchased }">
      <span class="item-number">{{ index + 1 }}/{{ total }}</span>
      <h3 :class="{ 'strikethrough': cartItem.isPurchased }">{{ cartItem.title }}</h3>
      <div class="icon" v-if="!confirmingDelete">
        <i v-if="!isSavedView" @click="startEdit" class="material-icons edit-icon" title="Edit item">edit</i>
        <i @click="requestDelete" class="material-icons">delete</i>
        <i
          v-if="!isSavedView"
          @click="cartStore.togglePurchased(cartItem._id)"
          :class="['material-icons', cartItem.isPurchased ? 'purchased-icon' : '']"
          :title="cartItem.isPurchased ? 'Mark as not purchased' : 'Mark as purchased'"
        >shopping_cart</i>
        <i
          v-if="!isSavedView && !isAlreadySaved()"
          @click="cartStore.saveItem(cartItem._id)"
          class="material-icons save-icon"
          title="Save a copy"
        >bookmark_add</i>
      </div>
      <div class="confirm-delete" v-else>
        <span class="confirm-text">Delete?</span>
        <i @click="confirmDelete" class="material-icons confirm-yes">check</i>
        <i @click="cancelDelete" class="material-icons confirm-no">close</i>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/abstracts/color";

.item-number {
  font-size: 0.72rem;
  color: color.$muted-light;
  min-width: 2.2rem;
  font-variant-numeric: tabular-nums;
}

.strikethrough {
  text-decoration: line-through;
  opacity: 0.5;
}

.cart-item.purchased {
  opacity: 0.7;
}

.purchased-icon {
  color: color.$success !important;
}

.save-icon {
  cursor: pointer;
  &:hover {
    color: color.$blue-violet !important;
  }
}

.confirm-delete {
  display: flex;
  align-items: center;
  gap: 0.3rem;

  .confirm-text {
    font-size: 0.75rem;
    color: color.$danger;
    font-weight: 600;
  }

  .confirm-yes {
    color: color.$danger;
    font-size: 1.2rem;
    cursor: pointer;
    &:hover { color: color.$danger-dark; }
  }

  .confirm-no {
    color: color.$muted;
    font-size: 1.2rem;
    cursor: pointer;
    &:hover { color: color.$dark; }
  }
}

.edit-icon {
  cursor: pointer;
  font-size: 1.1rem;
  &:hover {
    color: color.$blue-violet !important;
  }
}

.edit-mode {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.edit-input {
  flex: 1;
  min-width: 100px;
  padding: 0.3rem 0.5rem;
  border: 1.5px solid color.$border;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;

  &:focus {
    border-color: color.$blue-violet;
  }
}

.edit-select {
  padding: 0.3rem 0.4rem;
  border: 1.5px solid color.$border;
  border-radius: 6px;
  font-size: 0.8rem;
  background: color.$white;
  outline: none;

  &:focus {
    border-color: color.$blue-violet;
  }
}

.edit-actions {
  display: flex;
  align-items: center;
  gap: 0.2rem;

  .edit-save {
    color: color.$success;
    font-size: 1.3rem;
    cursor: pointer;
    &:hover { color: color.$success-alt; }
  }

  .edit-cancel {
    color: color.$muted;
    font-size: 1.3rem;
    cursor: pointer;
    &:hover { color: color.$dark; }
  }
}
</style>
