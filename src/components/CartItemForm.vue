<script>
import { ref, computed, watch } from 'vue';
import { useCartStore } from '@/stores/CartStore';
import { storeToRefs } from 'pinia';

export default {
  props: {
    presetGroup: {
      type: String,
      default: null,
    },
    open: {
      type: Boolean,
      default: false,
    },
    hideToggle: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:open'],
  setup(props, { emit }) {
    const cartStore = useCartStore();
    const { groups } = storeToRefs(cartStore);

    const newCartItem = ref('');
    const newAmount = ref(null);
    const selectedUnit = ref('__placeholder__');
    const selectedGroup = ref('__placeholder__');
    const newGroupName = ref('');
    const creatingGroup = ref(false);
    const formError = ref('');
    const isExpanded = ref(false);

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
      pieces: {
        min: 1,
        step: 1,
        max: 9999999999999999999999999999,
        label: 'whole pieces',
      },
      gram: { min: 1, step: 1, max: 50000000000, label: 'grams' },
      kilo: { min: 0.1, step: 0.1, max: 50000000000, label: 'kilos' },
      milliliter: { min: 1, step: 1, max: 50000000000, label: 'milliliters' },
      liter: { min: 0.1, step: 0.1, max: 50000000000, label: 'liters' },
      ounces: { min: 0.1, step: 0.1, max: 50000000000, label: 'ounces' },
      pound: { min: 0.1, step: 0.1, max: 50000000000, label: 'pounds' },
    };

    const activeUnitRule = computed(
      () =>
        unitRules[selectedUnit.value] || {
          min: 0.01,
          step: 0.01,
          max: 9999999999999999999999999999,
          label: 'amount',
        },
    );

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

    const effectiveGroup = computed(() =>
      creatingGroup.value
        ? newGroupName.value.trim() || null
        : selectedGroup.value === '__placeholder__'
          ? null
          : selectedGroup.value,
    );

    const finalizeSuccessfulAdd = () => {
      newCartItem.value = '';
      newAmount.value = null;
      selectedUnit.value = '__placeholder__';
      selectedGroup.value = '__placeholder__';
      creatingGroup.value = false;
      newGroupName.value = '';
      formError.value = '';
      isExpanded.value = false;
      emit('update:open', false);
    };

    const handleAddGroup = () => {
      const groupName = newGroupName.value.trim();
      if (!groupName) return;

      if (cartStore.groupExists(groupName)) {
        formError.value = `A shop named "${groupName}" already exists.`;
        return;
      }

      const resolvedGroupName = cartStore.addCustomGroup(groupName);
      selectedGroup.value = resolvedGroupName;
      creatingGroup.value = false;
      newGroupName.value = '';
      formError.value = '';

      // If the user had already typed an item name, add it now
      if (
        newCartItem.value.trim() &&
        Number(newAmount.value) > 0 &&
        selectedUnit.value !== '__placeholder__'
      ) {
        const normalizedAmount = normalizeAmountForUnit(
          newAmount.value,
          selectedUnit.value,
        );
        const amountError = validateAmountByUnit(
          normalizedAmount,
          selectedUnit.value,
        );
        if (amountError) {
          formError.value = amountError;
          return;
        }
        cartStore.addCartItem({
          title: newCartItem.value.trim(),
          amount: normalizedAmount,
          unit: selectedUnit.value,
          isFav: false,
          group: resolvedGroupName,
        });
        finalizeSuccessfulAdd();
      }
    };

    const handleSubmit = () => {
      formError.value = '';
      if (!newCartItem.value.trim()) {
        formError.value = 'Please enter an item name.';
        return;
      }
      if (!newAmount.value || Number(newAmount.value) <= 0) {
        formError.value = 'Please enter a valid amount.';
        return;
      }
      if (selectedUnit.value === '__placeholder__') {
        formError.value = 'Please select a unit.';
        return;
      }
      const normalizedAmount = normalizeAmountForUnit(
        newAmount.value,
        selectedUnit.value,
      );
      const amountError = validateAmountByUnit(
        normalizedAmount,
        selectedUnit.value,
      );
      if (amountError) {
        formError.value = amountError;
        return;
      }
      if (!effectiveGroup.value || effectiveGroup.value === '__placeholder__') {
        formError.value = 'Please select a shop or create a new one first.';
        return;
      }
      if (
        cartStore.itemExistsInGroup(newCartItem.value, effectiveGroup.value)
      ) {
        formError.value = `"${newCartItem.value.trim()}" is already in shop "${effectiveGroup.value}". Go to that shop and edit its amount/unit instead.`;
        return;
      }
      cartStore.addCartItem({
        title: newCartItem.value.trim(),
        amount: normalizedAmount,
        unit: selectedUnit.value,
        isFav: false,
        group: effectiveGroup.value,
      });
      finalizeSuccessfulAdd();
    };

    const toggleExpanded = () => {
      isExpanded.value = !isExpanded.value;
      if (!isExpanded.value) {
        creatingGroup.value = false;
        newGroupName.value = '';
        formError.value = '';
      } else if (props.presetGroup) {
        selectedGroup.value = props.presetGroup;
      }
      emit('update:open', isExpanded.value);
    };

    watch(
      () => props.open,
      (val) => {
        if (val === isExpanded.value) return;
        isExpanded.value = val;
        if (val && props.presetGroup) {
          selectedGroup.value = props.presetGroup;
          creatingGroup.value = false;
        }
        if (!val) {
          formError.value = '';
        }
      },
    );

    const onGroupChange = () => {
      if (selectedGroup.value === '__new__') {
        creatingGroup.value = true;
        selectedGroup.value = '__placeholder__';
      }
    };

    const onUnitChange = () => {
      if (selectedUnit.value === '__placeholder__') return;
      if (newAmount.value === null || newAmount.value === '') return;
      const normalizedAmount = normalizeAmountForUnit(
        newAmount.value,
        selectedUnit.value,
      );
      if (normalizedAmount !== null) {
        newAmount.value = normalizedAmount;
      }
    };

    const cancelNewGroup = () => {
      creatingGroup.value = false;
      newGroupName.value = '';
    };

    return {
      handleSubmit,
      handleAddGroup,
      newCartItem,
      newAmount,
      selectedUnit,
      unitOptions,
      activeUnitRule,
      groups,
      selectedGroup,
      newGroupName,
      creatingGroup,
      formError,
      onGroupChange,
      onUnitChange,
      cancelNewGroup,
      isExpanded,
      toggleExpanded,
    };
  },
};
</script>

<template>
  <div class="form-wrapper">
    <button
      v-if="!presetGroup && !hideToggle"
      type="button"
      class="toggle-add-btn"
      @click="toggleExpanded"
    >
      <i class="material-icons">add</i>
      ADD
    </button>

    <div
      v-if="isExpanded"
      class="add-modal-overlay"
      @click.self="toggleExpanded"
    >
      <div class="form-panel" role="dialog" aria-modal="true">
        <div class="form-panel-header">
          <h3>
            {{ presetGroup ? `Add Item to "${presetGroup}"` : 'Add Item' }}
          </h3>
          <button type="button" class="modal-close-btn" @click="toggleExpanded">
            <i class="material-icons">close</i>
          </button>
        </div>

        <div v-if="creatingGroup && !presetGroup" class="create-group-row">
          <div class="group-input-wrapper">
            <input
              v-model="newGroupName"
              type="text"
              placeholder="Shop name..."
              class="group-input"
              autofocus
              @keyup.enter="handleAddGroup"
            />
            <button
              type="button"
              class="cancel-group-btn"
              @click="cancelNewGroup"
            >
              ✕
            </button>
          </div>
          <button type="button" class="add-group-btn" @click="handleAddGroup">
            <i class="material-icons">create_new_folder</i>
            Add Shop
          </button>
        </div>

        <form v-else class="submit-form" @submit.prevent="handleSubmit">
          <input type="text" v-model="newCartItem" placeholder="New Item..." />
          <div class="item-meta-row">
            <select
              v-model="selectedUnit"
              class="unit-select"
              @change="onUnitChange"
            >
              <option value="__placeholder__" disabled>Select unit</option>
              <option
                v-for="unit in unitOptions"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }}
              </option>
            </select>
            <input
              v-model.number="newAmount"
              class="amount-input"
              type="number"
              :min="activeUnitRule.min"
              :max="activeUnitRule.max"
              :step="activeUnitRule.step"
              placeholder="Amount"
            />
          </div>
          <div v-if="presetGroup" class="group-select-wrapper">
            <button type="submit">
              <i class="material-icons">add_shopping_cart</i>
              Add Item
            </button>
          </div>
          <div v-else class="group-select-wrapper">
            <select
              v-model="selectedGroup"
              @change="onGroupChange"
              class="group-select"
            >
              <option class="dropdown-default" value="__placeholder__" disabled>
                Select shop
              </option>
              <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
              <option value="__new__">+ New Shop</option>
            </select>
            <button type="submit">
              <i class="material-icons">add_shopping_cart</i>
              Add Item
            </button>
          </div>
        </form>

        <p v-if="formError" class="form-error">
          <i class="material-icons">warning</i>
          {{ formError }}
        </p>

        <p v-if="!presetGroup" class="groups-hint">
          <i class="material-icons">info</i>
          Use <strong>shops</strong> to organise your items by shop or category
          — select <strong>+ New Shop</strong> to create one. Drag shops or
          items by the handle to reorder, and drop items onto another shop to
          move them.
        </p>

        <p v-if="!presetGroup" class="favorites-hint">
          <i class="material-icons">bookmark_add</i>
          Mark shops as <strong>saved</strong> so you can keep reusable
          templates from cart and recipes. Saved templates are
          <strong>read-only templates</strong>, and you can delete what you no
          longer need.
        </p>
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

.form-wrapper {
  display: flex;
  flex-direction: column;
  gap: size.$sp08;

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xl 0 spacing.$spacing-s 0;
  }
}

.toggle-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: size.$sp06;
  align-self: flex-start;
  background: color.$gold;
  color: color.$light;
  border: none;
  border-radius: size.$sp08;
  padding: spacing.$spacing-xxs spacing.$spacing-m;
  cursor: pointer;
  width: 100%;
  @include typography.headline-140-medium;
  transition: 0.2s linear all;

  .material-icons {
    @include typography.headline-180;
  }

  &:hover {
    filter: brightness(0.95);
  }

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xs spacing.$spacing-m;
    align-self: flex-start;
  }
}

.add-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: spacing.$spacing-s;
  z-index: 200;
}

.form-panel {
  width: min(100%, spacing.$spacing-2-xl * 10);
  max-height: calc(100vh - spacing.$spacing-m);
  overflow-y: auto;
  background: color.$white;
  border-radius: size.$sp12;
  padding: spacing.$spacing-s;
  box-shadow: 0 14px 28px rgba(color.$dark, 0.2);
  display: flex;
  flex-direction: column;
  gap: size.$sp08;

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-m;
  }
}

.form-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    color: color.$dark;
    @include typography.headline-180-medium;
  }
}

.modal-close-btn {
  border: none;
  background: transparent;
  color: color.$muted;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .material-icons {
    @include typography.headline-200;
  }

  &:hover {
    color: color.$dark;
  }
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;
  padding-top: spacing.$spacing-s;

  input {
    border: size.$sp02 solid color.$border;
    height: size.$sp40;
    padding: spacing.$spacing-base;
    border-radius: size.$sp12;
    @include typography.headline-140;
    background: color.$white;

    &:focus,
    &:active {
      outline: none;
      border-color: color.$blue-violet;
    }
  }

  button {
    display: flex;
    flex-direction: row;
    gap: spacing.$spacing-xxs;
    align-items: center;
    background-color: color.$gold;
    color: color.$light;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: 0.2s linear all;
    border-radius: size.$sp06;
    @include typography.headline-140-medium;
    width: 100%;

    @include breakpoint.media-breakpoint-up(sm) {
      width: inherit;
      padding: spacing.$spacing-xxs;
    }

    &:hover {
      scale: 1.04;
    }
  }
  @include breakpoint.media-breakpoint-up(sm) {
    padding-top: spacing.$spacing-m;
  }
}

.create-group-row {
  display: flex;
  flex-direction: column;
  gap: size.$sp08;
  margin-top: spacing.$spacing-xs;

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
    align-items: center;
    margin-top: spacing.$spacing-s;
  }

  @include breakpoint.media-breakpoint-up(lg) {
    margin-top: spacing.$spacing-m;
  }
}

.group-input-wrapper {
  display: flex;
  align-items: center;
  gap: size.$sp08;
  flex: 1;
  width: 100%;

  @include breakpoint.media-breakpoint-up(sm) {
    width: auto;
  }
}

.group-select-wrapper {
  display: flex;
  flex-direction: row;
  gap: size.$sp08;
  width: 100%;

  @include breakpoint.media-breakpoint-up(sm) {
  }
}

.item-meta-row {
  display: flex;
  gap: size.$sp08;

  .unit-select,
  .amount-input {
    flex: 0 0 calc(50% - size.$sp04);
    width: calc(50% - size.$sp04);
    max-width: calc(50% - size.$sp04);
  }
}

.amount-input,
.unit-select,
.group-select {
  border: size.$sp02 solid color.$border;
  border-radius: size.$sp12;
  min-height: size.$sp40;
  padding: spacing.$spacing-base spacing.$spacing-xxs;
  @include typography.headline-160;
  background: color.$white;
  outline: none;
  width: inherit;

  &:focus {
    border-color: color.$blue-violet;
  }
}

.amount-input {
  flex: 1;
}

.unit-select {
  flex: 1;
}

.group-select,
.group-input {
  padding: spacing.$spacing-base;
  border: size.$sp02 solid color.$border;
  border-radius: size.$sp12;
  @include typography.headline-160;
  font-family: 'Poppins', sans-serif;
  background: color.$white;

  @include breakpoint.media-breakpoint-up(sm) {
    width: inherit;
  }
}

.group-input {
  flex: 1;
  min-width: 0;
  text-transform: uppercase;
}

.add-group-btn {
  display: flex;
  align-items: center;
  gap: size.$sp04;
  padding: spacing.$spacing-xs spacing.$spacing-m;
  background: color.$blue-violet;
  color: color.$white;
  border: none;
  border-radius: size.$sp06;
  @include typography.headline-160-medium;
  cursor: pointer;
  height: size.$sp40;
  white-space: nowrap;
  width: 100%;
  justify-content: center;

  @include breakpoint.media-breakpoint-up(sm) {
    width: auto;
  }

  .material-icons {
    @include typography.headline-140;
  }

  &:hover {
    background: color.$blue-violet-dark;
  }
}

.cancel-group-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: color.$muted;
  padding: spacing.$spacing-base;
  @include typography.headline-180;

  &:hover {
    color: color.$dark;
  }
}

.form-error {
  color: color.$danger;
  margin: 0;
  display: flex;
  align-items: center;
  gap: size.$sp04;
  @include typography.headline-140;

  .material-icons {
    @include typography.headline-160;
  }
}

.groups-hint {
  @include typography.headline-120;
  color: color.$muted;
  text-align: -webkit-center;

  .material-icons {
    color: color.$blue-violet;
    margin-right: spacing.$spacing-base * 0.5;
    @include typography.headline-160;
  }
}

.favorites-hint {
  @include typography.headline-120;
  color: color.$muted;
  text-align: -webkit-center;

  .material-icons {
    color: color.$danger;
    margin-right: spacing.$spacing-base * 0.5;
    @include typography.headline-160;
  }
}

:global(.dark) .submit-form input {
  background-color: color.$dark50;
  color: color.$light;
}

:global(.dark) .submit-form input::placeholder {
  color: color.$light;
}

:global(.dark) .form-panel {
  background: color.$dark-medium;
}

:global(.dark) .form-panel-header h3 {
  color: color.$light;
}

:global(.dark) .modal-close-btn {
  color: color.$light50;
}

:global(.dark) .modal-close-btn:hover {
  color: color.$light;
}
</style>
