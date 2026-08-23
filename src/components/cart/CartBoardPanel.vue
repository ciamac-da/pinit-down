<script>
import CartItemDetails from '@/components/CartItemDetails.vue';
import CartItemForm from '@/components/CartItemForm.vue';
import NearbyStoresModal from '@/components/NearbyStoresModal.vue';

export default {
  components: {
    CartItemDetails,
    CartItemForm,
    NearbyStoresModal,
  },
  props: {
    cartStore: {
      type: Object,
      required: true,
    },
    canDownloadCartPdf: {
      type: Boolean,
      default: false,
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    groups: {
      type: Array,
      default: () => [],
    },
    itemsByGroup: {
      type: Object,
      default: () => ({}),
    },
    draggedId: {
      type: [String, Number, null],
      default: null,
    },
    dragOverId: {
      type: [String, Number, null],
      default: null,
    },
    draggedGroup: {
      type: [String, null],
      default: null,
    },
    dragOverGroup: {
      type: [String, null],
      default: null,
    },
    editingGroup: {
      type: [String, null],
      default: null,
    },
    editGroupName: {
      type: String,
      default: '',
    },
  },
  emits: [
    'download-cart-pdf',
    'group-drag-start',
    'group-drag-over',
    'group-drag-leave',
    'set-drag-over-group',
    'group-drop',
    'drop-on-group',
    'drag-end',
    'update-edit-group-name',
    'save-group-edit',
    'cancel-group-edit',
    'start-group-edit',
    'add-group-to-favorites',
    'request-group-delete',
    'drag-start',
    'drag-over',
    'drag-leave',
    'drop-item',
  ],
  data() {
    return {
      quickAddGroup: null,
      nearbyShopName: '',
    };
  },
  methods: {
    onGroupDragStart(event, groupName) {
      const groupEl = event.currentTarget.closest('.item-group');
      if (groupEl && event.dataTransfer) {
        // Use the whole group block (header + items) as the drag ghost.
        event.dataTransfer.setDragImage(groupEl, event.offsetX, event.offsetY);
      }
      this.$emit('group-drag-start', groupName);
    },
    onGroupHeaderDragOver(groupName) {
      if (this.draggedGroup) return;

      if (this.draggedId) {
        this.$emit('set-drag-over-group', groupName);
      }
    },
    onGroupHeaderDragLeave() {
      this.$emit('group-drag-leave');
      this.$emit('set-drag-over-group', null);
    },
    onGroupHeaderDrop(groupName) {
      if (this.draggedGroup) return;

      this.$emit('drop-on-group', groupName);
    },
    onRowDragOver(item, groupName) {
      if (this.draggedGroup) return;

      if (this.draggedId) {
        this.$emit('drag-over', item);
      }
    },
    onRowDrop(item, groupName) {
      if (this.draggedGroup) return;

      if (this.draggedId) {
        this.$emit('drop-item', item, groupName);
      }
    },
    onGroupContainerDragOver(event, groupName) {
      if (!this.draggedGroup || this.draggedGroup === groupName) return;
      this.$emit('group-drag-over', groupName);
    },
    onGroupContainerDrop(event, groupName) {
      if (!this.draggedGroup || this.draggedGroup === groupName) return;
      // Use the whole group block's midpoint so hovering its last item still resolves correctly.
      this.$emit('group-drop', groupName, this.getDropPosition(event));
    },
    getDropPosition(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      return event.clientY - rect.top > rect.height / 2 ? 'after' : 'before';
    },
    onEditGroupNameInput(event) {
      this.$emit('update-edit-group-name', event.target.value);
    },
  },
};
</script>

<template>
  <div>
    <div class="cart-board-toolbar">
      <CartItemForm />

      <button
        v-if="canDownloadCartPdf"
        type="button"
        class="download-collection-btn"
        @click="$emit('download-cart-pdf')"
      >
        <i class="material-icons">picture_as_pdf</i>
        DOWNLOAD CART
      </button>
    </div>

    <div>
      <div
        v-for="(groupName, groupIndex) in groups"
        :key="groupName"
        class="item-group"
        :class="{
          'group-drag-over': dragOverGroup === groupName,
          'dragging-group': draggedGroup === groupName,
        }"
        @dragover.prevent="onGroupContainerDragOver($event, groupName)"
        @drop.prevent="onGroupContainerDrop($event, groupName)"
      >
        <div
          class="group-header"
          draggable="true"
          @dragstart.stop="onGroupDragStart($event, groupName)"
          @dragover.prevent="onGroupHeaderDragOver(groupName)"
          @dragleave="onGroupHeaderDragLeave"
          @drop.prevent="onGroupHeaderDrop(groupName)"
          @dragend="$emit('drag-end')"
        >
          <div class="group-header-top">
            <span class="drag-handle group-drag-handle material-icons"
              >drag_indicator</span
            >
            <template v-if="editingGroup === groupName">
              <input
                :value="editGroupName"
                class="edit-group-input"
                @input="onEditGroupNameInput"
                @keyup.enter="$emit('save-group-edit', groupName)"
                @keyup.escape="$emit('cancel-group-edit')"
                autofocus
              />
              <i
                class="material-icons edit-group-save"
                @click.stop="$emit('save-group-edit', groupName)"
                >check</i
              >
              <i
                class="material-icons edit-group-cancel"
                @click.stop="$emit('cancel-group-edit')"
                >close</i
              >
            </template>
            <template v-else>
              <span class="group-name"
                >{{ groupIndex + 1 }}- {{ groupName }}</span
              >
              <i
                class="material-icons edit-group-icon"
                @click.stop="$emit('start-group-edit', groupName)"
                title="Rename shop"
                >edit</i
              >
              <span class="group-count"
                >{{ itemsByGroup[groupName]?.length ?? 0 }}
                {{
                  (itemsByGroup[groupName]?.length ?? 0) === 1 ||
                  (itemsByGroup[groupName]?.length ?? 0) === 0
                    ? 'item'
                    : 'items'
                }}</span
              >
            </template>
          </div>
          <div class="group-header-bottom">
            <button
              class="add-item-to-group-btn"
              @click.stop="quickAddGroup = groupName"
              title="Add item to this shop"
            >
              <i class="material-icons">add_circle</i>
            </button>
            <button
              class="nearby-store-btn"
              @click.stop="nearbyShopName = groupName"
              title="Find this store nearby"
            >
              <i class="material-icons">near_me</i>
            </button>
            <button
              class="favorite-group-btn"
              :class="{
                'save-all-saved':
                  cartStore.isCartGroupFullyFavorited(groupName),
              }"
              :disabled="cartStore.isCartGroupFullyFavorited(groupName)"
              @click.stop="
                !cartStore.isCartGroupFullyFavorited(groupName) &&
                $emit('add-group-to-favorites', groupName)
              "
              :title="
                cartStore.isCartGroupFullyFavorited(groupName)
                  ? 'All items already saved'
                  : 'Save shop as template'
              "
            >
              <i class="material-icons">bookmark_add</i>
            </button>
            <button
              class="delete-group-btn"
              @click.stop="$emit('request-group-delete', groupName)"
              title="Delete shop"
            >
              <i class="material-icons">delete</i>
            </button>
          </div>
        </div>
        <div
          v-for="(item, idx) in itemsByGroup[groupName]"
          :key="item._id"
          draggable="true"
          class="draggable-row"
          :class="{
            'drag-over': dragOverId === item._id,
            dragging: draggedId === item._id,
            'group-item-dragging': draggedGroup === groupName,
          }"
          @dragstart.stop="$emit('drag-start', item)"
          @dragover.prevent="onRowDragOver(item, groupName)"
          @dragleave="$emit('drag-leave')"
          @drop.prevent="onRowDrop(item, groupName)"
          @dragend="$emit('drag-end')"
        >
          <span class="drag-handle material-icons">drag_indicator</span>
          <CartItemDetails
            :cart-item="item"
            :index="idx"
            :total="itemsByGroup[groupName].length"
          />
        </div>
      </div>

      <div
        v-if="draggedGroup"
        class="group-end-dropzone"
        :class="{ 'group-drag-over': dragOverGroup === '__group_end__' }"
        @dragover.prevent="$emit('group-drag-over', '__group_end__')"
        @drop.prevent="$emit('group-drop', '__group_end__')"
      >
        Drop here to move to end
      </div>

      <p v-if="totalCount === 0" class="empty-state">
        No items yet. Add your first item above!
      </p>
    </div>

    <CartItemForm
      :preset-group="quickAddGroup"
      :open="quickAddGroup !== null"
      hide-toggle
      @update:open="
        (val) => {
          if (!val) quickAddGroup = null;
        }
      "
    />

    <NearbyStoresModal
      :shop-name="nearbyShopName"
      @close="nearbyShopName = ''"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';
@use '@/styles/abstracts/breakpoint';

.cart-board-toolbar {
  position: sticky;
  top: 0;
  z-index: 8;
  background: color.$light;
  padding: spacing.$spacing-l 0 spacing.$spacing-base 0;

  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xs 0 spacing.$spacing-base 0;
  }
}

.download-collection-btn {
  align-self: center;
  margin: spacing.$spacing-xs 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: spacing.$spacing-base;
  border: none;
  width: 100%;
  border-radius: size.$sp10;
  background: rgba(color.$danger, 0.12);
  color: color.$danger-dark;
  padding: spacing.$spacing-xxs spacing.$spacing-m;
  cursor: pointer;
  @include typography.headline-120-medium;

  .material-icons {
    @include typography.headline-140;
  }

  @include breakpoint.media-breakpoint-up(sm) {
    margin: 0;
    margin-bottom: spacing.$spacing-m;
    padding: spacing.$spacing-xs spacing.$spacing-m;
  }
}

.item-group {
  margin-bottom: spacing.$spacing-s;
  padding-bottom: spacing.$spacing-m;
  border-bottom: size.$sp02 solid color.$border-dark;
}

.item-group:last-of-type {
  border-bottom: none;
}

.group-header {
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;
  align-items: center;
  justify-content: space-between;
  padding: spacing.$spacing-base;
  background: color.$gradient;
  border-radius: size.$sp10;
  cursor: grab;
  transition:
    outline 0.15s,
    background 0.15s;

  &:active {
    cursor: grabbing;
  }

  .group-header-top {
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
  }

  .group-drag-handle {
    color: rgba(color.$light, 0.6);
    @include typography.headline-200;
    user-select: none;
  }

  .group-name {
    @include typography.headline-160-medium;
    color: color.$light;
    letter-spacing: spacing.$spacing-base * 0.5;
    text-transform: uppercase;
  }

  .edit-group-icon {
    @include typography.headline-160;
    color: rgba(color.$light, 0.8);
    cursor: pointer;
    &:hover {
      color: color.$white;
    }
  }

  .edit-group-input {
    padding: spacing.$spacing-base spacing.$spacing-xxs;
    border: size.$sp02 solid rgba(color.$light, 0.4);
    border-radius: size.$sp06;
    @include typography.headline-160-medium;
    background: rgba(color.$light, 0.15);
    color: color.$light;
    outline: none;
    width: spacing.$spacing-4-xl;
    text-transform: uppercase;

    &:focus {
      border-color: color.$light;
    }
  }

  .edit-group-save {
    @include typography.headline-200;
    color: rgba(color.$light, 0.8);
    cursor: pointer;
    &:hover {
      color: color.$light;
    }
  }

  .edit-group-cancel {
    @include typography.headline-200;
    color: rgba(color.$light, 0.5);
    cursor: pointer;
    &:hover {
      color: color.$light;
    }
  }

  .group-count {
    @include typography.headline-120;
    color: rgba(color.$light, 0.8);
  }

  .group-header-bottom {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    gap: spacing.$spacing-xxs;
  }

  .delete-group-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(color.$light, 0.7);
    display: flex;
    align-items: center;
    padding: 0;
    transition: color 0.15s;

    .material-icons {
      @include typography.headline-200;
    }

    &:hover {
      color: color.$light;
    }
  }

  .favorite-group-btn,
  .copy-group-btn,
  .add-item-to-group-btn,
  .nearby-store-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(color.$light, 0.8);
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
    padding: 0;
    transition: color 0.15s;

    .material-icons {
      @include typography.headline-200;
    }

    &:hover {
      color: color.$light;
    }

    &.save-all-saved,
    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  @include breakpoint.media-breakpoint-up(sm) {
    gap: 0;
    padding: spacing.$spacing-xxs;
  }
}

.item-group.group-drag-over {
  outline: size.$sp02 dashed color.$blue-violet;
  outline-offset: size.$sp04;
  border-radius: size.$sp06;
}

.item-group.dragging-group {
  opacity: 0.4;
  outline: size.$sp02 dashed color.$blue-violet;
  outline-offset: size.$sp04;
  border-radius: size.$sp06;
}

.group-end-dropzone {
  margin: 0 spacing.$spacing-base spacing.$spacing-s;
  padding: spacing.$spacing-xs;
  border: size.$sp02 dashed color.$muted-lightest;
  border-radius: size.$sp06;
  text-align: center;
  color: color.$muted-lighter;
  @include typography.headline-120;

  &.group-drag-over {
    border-color: color.$blue-violet;
    color: color.$blue-violet;
    background: rgba(color.$blue-violet, 0.06);
  }
}

.draggable-row {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-base;
  padding: 0 spacing.$spacing-base;
  cursor: grab;
  border-radius: size.$sp08;
  transition:
    background 0.15s,
    opacity 0.15s;
  width: 100%;

  :deep(.cart-items) {
    flex: 1;
    margin-top: spacing.$spacing-xxs;
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.4;
  }

  &.drag-over {
    background: rgba(color.$blue-violet, 0.08);
    outline: size.$sp02 dashed color.$blue-violet;
  }

  &.group-item-dragging {
    opacity: 0.5;
    background: rgba(color.$blue-violet, 0.08);
  }
}

.drag-handle {
  color: color.$muted-lightest;
  @include typography.headline-200;
  user-select: none;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  @include typography.headline-160;
  color: color.$muted-lighter;
  margin-top: spacing.$spacing-s;
}

html.dark .cart-board-toolbar {
  background: color.$dark;
}

html.dark .download-collection-btn {
  background: color.$blue-violet;
  color: color.$light;
}

html.dark .item-group {
  border-color: rgba(color.$white, 0.5);
  box-shadow: 0 size.$sp04 size.$sp12 rgba(color.$white, 0.25);
}
</style>
