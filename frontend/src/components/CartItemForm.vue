<script>
import { ref, computed } from "vue";
import { useCartStore } from "@/stores/CartStore";
import { storeToRefs } from "pinia";

export default {
  setup() {
    const cartStore = useCartStore();
    const { groups } = storeToRefs(cartStore);

    const newCartItem = ref("");
    const selectedGroup = ref("__placeholder__");
    const newGroupName = ref("");
    const creatingGroup = ref(false);
    const formError = ref("");

    const effectiveGroup = computed(() =>
      creatingGroup.value ? newGroupName.value.trim() || null : (selectedGroup.value === '__placeholder__' ? null : selectedGroup.value)
    );

    const handleAddGroup = () => {
      const groupName = newGroupName.value.trim()
      if (!groupName) return
      cartStore.addCustomGroup(groupName)
      selectedGroup.value = groupName
      creatingGroup.value = false
      newGroupName.value = ''
      formError.value = ''

      // If the user had already typed an item name, add it now
      if (newCartItem.value.trim()) {
        cartStore.addCartItem({
          title: newCartItem.value.trim(),
          isFav: false,
          group: groupName,
        })
        newCartItem.value = ''
      }
    }

    const handleSubmit = () => {
      formError.value = ""
      if (!newCartItem.value.trim()) {
        formError.value = "Please enter an item name."
        return
      }
      if (!effectiveGroup.value || effectiveGroup.value === '__placeholder__') {
        formError.value = "Please select a group or create a new one first."
        return
      }
      cartStore.addCartItem({
        title: newCartItem.value.trim(),
        isFav: false,
        group: effectiveGroup.value,
      });
      newCartItem.value = "";
      formError.value = "";
      if (creatingGroup.value && newGroupName.value.trim()) {
        selectedGroup.value = newGroupName.value.trim();
        creatingGroup.value = false;
        newGroupName.value = "";
      }
    };

    const onGroupChange = () => {
      if (selectedGroup.value === "__new__") {
        creatingGroup.value = true;
        selectedGroup.value = "__placeholder__";
      }
    };

    const cancelNewGroup = () => {
      creatingGroup.value = false;
      newGroupName.value = "";
    };

    return { handleSubmit, handleAddGroup, newCartItem, groups, selectedGroup, newGroupName, creatingGroup, formError, onGroupChange, cancelNewGroup };
  },
};
</script>

<template>
  <div class="form-wrapper">
    <!-- Create group mode -->
    <div v-if="creatingGroup" class="create-group-row">
      <div class="group-input-wrapper">
        <input
          v-model="newGroupName"
          type="text"
          placeholder="Group name (e.g. Rewe, Lidl)..."
          class="group-input"
          autofocus
          @keyup.enter="handleAddGroup"
        />
        <button type="button" class="cancel-group-btn" @click="cancelNewGroup">✕</button>
      </div>
      <button type="button" class="add-group-btn" @click="handleAddGroup">
        <i class="material-icons">create_new_folder</i>
        Add Group
      </button>
    </div>

    <!-- Add item mode -->
    <form v-else class="submit-form" @submit.prevent="handleSubmit">
      <input type="text" v-model="newCartItem" placeholder="New Item..." />
      <select v-model="selectedGroup" @change="onGroupChange" class="group-select">
        <option value="__placeholder__" disabled>Select group</option>
        <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
        <option value="__new__">+ New Group</option>
      </select>
      <button type="submit">
        <i class="material-icons">add_shopping_cart</i>
        Add Item
      </button>
    </form>

    <p v-if="formError" class="form-error">
      <i class="material-icons" style="font-size:1rem;vertical-align:middle">warning</i>
      {{ formError }}
    </p>

    <p class="groups-hint">
      <i class="material-icons" style="font-size:1rem;vertical-align:middle">info</i>
      Use <strong>groups</strong> to organise your items by shop or category — e.g. create a <em>Rewe</em> group and a <em>Lidl</em> group separately.
      Select <strong>+ New Group</strong> to create one.
    </p>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/abstracts/color";

.form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.submit-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  button {
    width: 100%;

    @media (min-width: 576px) {
      width: auto;
    }
  }
}

.create-group-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;

  @media (min-width: 576px) {
    flex-direction: row;
    align-items: center;
    margin-top: 1.25rem;
  }

  @media (min-width: 992px) {
    margin-top: 2rem;
  }
}

.group-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  width: 100%;

  @media (min-width: 576px) {
    width: auto;
  }
}

.group-select,
.group-input {
  padding: 0.5rem 0.6rem;
  border: 1.5px solid color.$border;
  border-radius: 8px;
  font-size: 0.875rem;
  background: color.$white;
  height: 2.5rem;
  width: 100%;

  @media (min-width: 576px) {
    width: auto;
  }
}

.group-input {
  flex: 1;
  min-width: 0;
}

.add-group-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  background: color.$blue-violet;
  color: color.$white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  height: 2.5rem;
  white-space: nowrap;
  width: 100%;
  justify-content: center;

  @media (min-width: 576px) {
    width: auto;
  }

  .material-icons { font-size: 1.1rem; }

  &:hover { background: color.$blue-violet-dark; }
}

.cancel-group-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: color.$muted;
  padding: 0.25rem;

  &:hover { color: color.$dark; }
}

.form-error {
  font-size: 0.82rem;
  color: color.$danger;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.2rem;

  .material-icons { font-size: 1rem; }
}

.groups-hint {
  font-size: 0.78rem;
  color: color.$muted;
  margin: 0.1rem 0 0;
  line-height: 1.4;

  .material-icons { color: color.$blue-violet; margin-right: 0.15rem; }
}
</style>
