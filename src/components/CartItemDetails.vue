<script>
import { ref, computed } from 'vue';
import { useCartStore } from '@/stores/CartStore';
import { storeToRefs } from 'pinia';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

export default {
  components: {
    ConfirmDialog,
  },
  props: {
    cartItem: { type: Object, required: true },
    index: { type: Number, default: 0 },
    total: { type: Number, default: 1 },
    isSavedView: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: true },
  },

  setup(props) {
    const cartStore = useCartStore();
    const { groups } = storeToRefs(cartStore);
    const showDeleteDialog = ref(false);
    const showMoveMenu = ref(false);
    const showMoreMenu = ref(false);
    const editing = ref(false);
    const editTitle = ref('');
    const editAmount = ref(null);
    const editUnit = ref('pieces');
    const editGroup = ref('');
    const editError = ref('');

    const unitOptions = [
      { label: 'Pieces', value: 'pieces' },
      { label: 'Gram', value: 'gram' },
      { label: 'Kilo', value: 'kilo' },
      { label: 'Milli Liter', value: 'milliliter' },
      { label: 'Liter', value: 'liter' },
      { label: 'Ounces', value: 'ounces' },
      { label: 'Pound', value: 'pound' },
    ];

    const unitRules = {
      pieces: { min: 1, step: 1, max: 9999999999999999999999999999 },
      gram: { min: 1, step: 1, max: 5000000000000 },
      kilo: { min: 0.1, step: 0.1, max: 10000000000 },
      milliliter: { min: 1, step: 1, max: 5000000000000 },
      liter: { min: 0.1, step: 0.1, max: 10000000000 },
      ounces: { min: 0.1, step: 0.1, max: 5000000000000 },
      pound: { min: 0.1, step: 0.1, max: 2200000000000 },
    };

    const normalizeAmountForUnit = (value, unit) => {
      const rule = unitRules[unit];
      const parsed = Number(value);
      if (!rule || !Number.isFinite(parsed)) return null;
      if (unit === 'pieces' || unit === 'gram' || unit === 'milliliter') {
        return Math.round(parsed);
      }
      return Number(parsed.toFixed(2));
    };

    const validateAmountByUnit = (value, unit) => {
      const rule = unitRules[unit];
      const amount = Number(value);
      if (!rule || !Number.isFinite(amount))
        return 'Please enter a valid amount.';
      if (amount < rule.min || amount > rule.max) {
        return `Amount for ${unit} must be between ${rule.min} and ${rule.max}.`;
      }
      if (
        (unit === 'pieces' || unit === 'gram' || unit === 'milliliter') &&
        !Number.isInteger(amount)
      ) {
        return `Amount for ${unit} must be a whole number.`;
      }
      return '';
    };

    const getUnitRule = (unit) => {
      return (
        unitRules[unit] || {
          min: 0.01,
          step: 0.01,
          max: 9999999999999999999999999999,
        }
      );
    };

    const itemDisplayAmount = (item) => {
      const amount = Number(item.amount);
      return Number.isFinite(amount) && amount > 0 ? amount : 1;
    };

    const itemDisplayUnit = (item) => item.unit || 'pieces';

    const editableGroups = computed(() => {
      const currentGroup = props.cartItem.group || 'General';
      const mergedGroups = [...groups.value];
      if (!mergedGroups.includes(currentGroup)) {
        mergedGroups.push(currentGroup);
      }
      return mergedGroups;
    });

    const requestDelete = () => {
      showDeleteDialog.value = true;
    };

    const cancelDelete = () => {
      showDeleteDialog.value = false;
    };

    const confirmDelete = () => {
      if (props.isSavedView) {
        cartStore.deleteSavedItem(props.cartItem._id);
      } else {
        cartStore.deleteCartItem(props.cartItem._id);
      }
      showDeleteDialog.value = false;
    };

    const startEdit = () => {
      if (props.isSavedView) return;
      editTitle.value = props.cartItem.title;
      editAmount.value =
        Number(props.cartItem.amount) > 0 ? props.cartItem.amount : 1;
      editUnit.value = props.cartItem.unit || 'pieces';
      editGroup.value = props.cartItem.group || 'General';
      editError.value = '';
      editing.value = true;
    };

    const cancelEdit = () => {
      editing.value = false;
      editError.value = '';
    };

    const saveEdit = () => {
      const normalizedAmount = normalizeAmountForUnit(
        editAmount.value,
        editUnit.value,
      );
      const amountError = validateAmountByUnit(
        normalizedAmount,
        editUnit.value,
      );
      if (amountError) {
        editError.value = amountError;
        return;
      }
      if (!editUnit.value) {
        editError.value = 'Please select a unit.';
        return;
      }

      const updates = {};
      const newTitle = editTitle.value.trim();
      if (newTitle && newTitle !== props.cartItem.title) {
        updates.title = newTitle;
      }
      if (Number(normalizedAmount) !== Number(props.cartItem.amount)) {
        updates.amount = Number(normalizedAmount);
      }
      if (editUnit.value !== (props.cartItem.unit || 'pieces')) {
        updates.unit = editUnit.value;
      }
      if (editGroup.value !== (props.cartItem.group || 'General')) {
        updates.group = editGroup.value;
      }
      if (Object.keys(updates).length > 0) {
        cartStore.editCartItem(props.cartItem._id, updates);
      }
      editError.value = '';
      editing.value = false;
    };

    const onUnitEditChange = () => {
      const rule = getUnitRule(editUnit.value);
      if (!rule) return;
      const normalizedAmount = normalizeAmountForUnit(
        editAmount.value,
        editUnit.value,
      );
      if (normalizedAmount !== null) {
        editAmount.value = normalizedAmount;
      }
    };

    const deleteMessage = computed(
      () => `Are you sure you want to delete "${props.cartItem.title}"?`,
    );

    const moveTargetGroups = computed(() =>
      editableGroups.value.filter(
        (g) => g !== (props.cartItem.group || 'General'),
      ),
    );

    const moveToGroup = (targetGroup) => {
      cartStore.editCartItem(props.cartItem._id, { group: targetGroup });
      showMoveMenu.value = false;
    };

    return {
      cartStore,
      groups,
      editableGroups,
      showDeleteDialog,
      showMoveMenu,
      showMoreMenu,
      editing,
      editTitle,
      editAmount,
      editUnit,
      editGroup,
      editError,
      unitOptions,
      getUnitRule,
      itemDisplayAmount,
      itemDisplayUnit,
      onUnitEditChange,
      deleteMessage,
      moveTargetGroups,
      moveToGroup,
      requestDelete,
      cancelDelete,
      confirmDelete,
      startEdit,
      cancelEdit,
      saveEdit,
    };
  },
};
</script>

<template>
  <div class="cart-items">
    <div v-if="editing" class="cart-item edit-mode">
      <select v-model="editGroup" class="edit-select edit-group-select">
        <option v-for="g in editableGroups" :key="g" :value="g">{{ g }}</option>
      </select>
      <input
        v-model="editTitle"
        class="edit-input"
        placeholder="Item name..."
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        autofocus
      />
      <select
        v-model="editUnit"
        class="edit-select edit-unit-select"
        @change="onUnitEditChange"
      >
        <option
          v-for="unit in unitOptions"
          :key="unit.value"
          :value="unit.value"
        >
          {{ unit.label }}
        </option>
      </select>
      <input
        v-model.number="editAmount"
        class="edit-amount-input"
        type="number"
        :min="getUnitRule(editUnit).min"
        :max="getUnitRule(editUnit).max"
        :step="getUnitRule(editUnit).step"
        placeholder="Amount"
      />
      <div class="edit-actions">
        <i @click="saveEdit" class="material-icons edit-save">check</i>
        <i @click="cancelEdit" class="material-icons edit-cancel">close</i>
      </div>
      <p v-if="editError" class="edit-error">{{ editError }}</p>
    </div>
    <div v-else class="cart-item" :class="{ purchased: cartItem.isPurchased }">
      <h4
        :class="{
          strikethrough: cartItem.isPurchased,
          'has-saved-delete': isSavedView && canDelete,
        }"
      >
        <span class="item-title-text">
          {{ cartItem.title }}
          <span class="item-measure"
            >{{ itemDisplayAmount(cartItem) }}
            {{ itemDisplayUnit(cartItem) }}</span
          >
        </span>
        <i
          v-if="isSavedView && canDelete"
          @click.stop="requestDelete"
          class="material-icons saved-delete-icon"
          title="Remove saved item"
          >delete</i
        >
      </h4>
      <div class="icon">
        <i
          v-if="!isSavedView"
          @click="startEdit"
          class="material-icons edit-icon"
          title="Edit item"
          >edit</i
        >
        <i
          v-if="!isSavedView"
          @click="cartStore.togglePurchased(cartItem._id)"
          :class="[
            'material-icons',
            cartItem.isPurchased ? 'purchased-icon' : 'purchased-icon-hover',
          ]"
          :title="
            cartItem.isPurchased ? 'Mark as not purchased' : 'Mark as purchased'
          "
          >shopping_cart</i
        >
        <div v-if="!isSavedView" class="more-menu-wrapper">
          <i
            @click="showMoreMenu = !showMoreMenu"
            class="material-icons more-icon"
            title="More actions"
            >more_vert</i
          >
          <div
            v-if="showMoreMenu"
            class="more-menu-backdrop"
            @click="showMoreMenu = false"
          ></div>
          <div v-if="showMoreMenu" class="more-menu-dropdown">
            <button
              type="button"
              class="more-menu-option"
              :disabled="cartStore.isCartItemSaved(cartItem._id)"
              @click="
                showMoreMenu = false;
                !cartStore.isCartItemSaved(cartItem._id) &&
                  cartStore.saveItem(cartItem._id);
              "
            >
              <i class="material-icons">bookmark_add</i>
              {{
                cartStore.isCartItemSaved(cartItem._id)
                  ? 'Already saved'
                  : 'Save item'
              }}
            </button>
            <button
              v-if="moveTargetGroups.length > 0"
              type="button"
              class="more-menu-option"
              @click="
                showMoreMenu = false;
                showMoveMenu = true;
              "
            >
              <i class="material-icons">send</i>
              Move to another shop
            </button>
            <button
              v-if="canDelete"
              type="button"
              class="more-menu-option danger"
              @click="
                showMoreMenu = false;
                requestDelete();
              "
            >
              <i class="material-icons">delete</i>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="showDeleteDialog"
      title="Delete item"
      :message="deleteMessage"
      confirm-text="Delete"
      cancel-text="Keep"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <div
      v-if="showMoveMenu"
      class="move-menu-overlay"
      @click.self="showMoveMenu = false"
    >
      <div class="move-menu">
        <p class="move-menu-label">Move "{{ cartItem.title }}" to</p>
        <button
          v-for="g in moveTargetGroups"
          :key="g"
          type="button"
          class="move-menu-item"
          @click="moveToGroup(g)"
        >
          {{ g }}
        </button>
        <button
          type="button"
          class="move-menu-cancel"
          @click="showMoveMenu = false"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.cart-items {
  padding: spacing.$spacing-base;
  background: color.$light;
  margin-top: spacing.$spacing-s;
  border-radius: size.$sp12;
  box-shadow: size.$sp02 size.$sp04 size.$sp24 color.$dark;
  justify-content: space-between;
  align-items: center;
  transition: 0.2s linear all;

  .cart-item {
    display: inline-flex;
    align-items: center;
    width: 100%;
    flex-direction: column-reverse;
    gap: spacing.$spacing-base;
    color: color.$dark;

    h4 {
      flex: 1;
      word-break: break-word;
      margin: 0;

      &.has-saved-delete {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: spacing.$spacing-xxs;
        width: 100%;
      }
    }

    .saved-delete-icon {
      flex-shrink: 0;
      margin-left: 0;
      padding: spacing.$spacing-base;
      cursor: pointer;
      color: color.$muted;
      @include typography.headline-180;

      &:hover {
        color: color.$danger;
      }
    }

    .icon {
      display: flex;
      width: 100%;
      justify-content: space-around;
      align-items: center;
      gap: spacing.$spacing-xxs;
      flex-shrink: 0;
    }

    i {
      @include typography.headline-200;
      margin-left: spacing.$spacing-xxs;
      cursor: pointer;
      color: color.$dark50;
      transition: 0.2s linear all;
    }

    i.active,
    i:hover {
      color: color.$gold;
    }
  }

    @include breakpoint.media-breakpoint-up(sm) {
      padding: spacing.$spacing-xxs;
  }
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

.purchased-icon-hover {
  &:hover {
    color: color.$blue !important;
  }
}

.more-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.more-icon {
  cursor: pointer;
}

.more-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.more-menu-dropdown {
  position: absolute;
  bottom: calc(100% + #{spacing.$spacing-xxs});
  right: 0;
  z-index: 21;
  display: flex;
  flex-direction: column;
  min-width: 180px;
  background: color.$white;
  border-radius: size.$sp10;
  box-shadow: size.$sp02 size.$sp04 size.$sp24 color.$dark;
  overflow: hidden;
}

.more-menu-option {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
  border: none;
  background: none;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  color: color.$dark;
  cursor: pointer;
  white-space: nowrap;
  @include typography.headline-120-medium;

  .material-icons {
    @include typography.headline-160;
    color: color.$dark50;
    margin-left: 0;
  }

  &:hover {
    background: color.$light-bg-soft;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.danger {
    color: color.$danger-dark;
    .material-icons {
      color: color.$danger;
    }
  }
}

.move-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 500;
}

.move-menu {
  width: 100%;
  background: color.$white;
  padding: spacing.$spacing-s;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;
  border-radius: size.$sp12 size.$sp12 0 0;
}

.move-menu-label {
  @include typography.headline-140-medium;
  color: color.$dark;
  margin: 0 0 spacing.$spacing-xxs;
  text-align: center;
}

.move-menu-item {
  border: size.$sp02 solid color.$border;
  border-radius: size.$sp10;
  padding: spacing.$spacing-xxs spacing.$spacing-base;
  background: color.$white;
  color: color.$dark;
  cursor: pointer;
  @include typography.headline-140-medium;

  &:hover {
    border-color: color.$blue-violet;
    color: color.$blue-violet;
  }
}

.move-menu-cancel {
  background: none;
  border: none;
  cursor: pointer;
  @include typography.headline-120;
  color: color.$muted;
  text-align: center;
  padding: spacing.$spacing-base 0 0;
  &:hover {
    color: color.$dark;
  }
}

.edit-icon {
  cursor: pointer;
  @include typography.headline-180;
  &:hover {
    color: color.$gold-hover !important;
  }
}

.cart-items .cart-item.edit-mode {
  display: flex;
  align-items: stretch;
  flex-direction: column;
  gap: size.$sp08;
  width: 100%;
}

.edit-input,
.edit-select,
.edit-amount-input {
  width: 100%;
  height: size.$sp40;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  border: size.$sp02 solid color.$border;
  border-radius: size.$sp12;
  @include typography.headline-140;
  background: color.$white;
  outline: none;
  box-sizing: border-box;
  line-height: 1.2;

  &:focus {
    border-color: color.$blue-violet;
  }
}

.edit-amount-input {
  appearance: textfield;
}

.edit-unit-select {
  min-width: 0;
  height: auto;
}

.item-measure {
  margin-left: spacing.$spacing-base;
  color: color.$muted;
  @include typography.headline-120;
}

.edit-error {
  width: 100%;
  margin: 0;
  color: color.$danger;
  @include typography.headline-120;
}

.edit-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: size.$sp20;

  .edit-save {
    color: color.$success;
    @include typography.headline-200;
    cursor: pointer;
    &:hover {
      color: color.$success-alt;
    }
  }

  .edit-cancel {
    color: color.$muted;
    @include typography.headline-200;
    cursor: pointer;
    &:hover {
      color: color.$dark;
    }
  }
}

html.dark .cart-items .cart-item {
  color: color.$dark;
  box-shadow: size.$sp02 size.$sp04 size.$sp24 color.$light;
}

html.dark .cart-items h4 {
  color: color.$dark;
}
</style>
