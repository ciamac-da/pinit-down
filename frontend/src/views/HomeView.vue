<script>
import { ref, onMounted } from 'vue';
import { useCartStore } from '@/stores/CartStore';
import { useThemeStore } from '@/stores/ThemeStore';
import { useAuthStore } from '@/stores/AuthStore';
import { storeToRefs } from 'pinia';
import AppHeader from '@/components/AppHeader.vue';
import FilterNav from '@/components/FilterNav.vue';
import CartItemDetails from '@/components/CartItemDetails.vue';
import CartItemForm from '@/components/CartItemForm.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import LoginForm from '@/components/LoginForm.vue';
import RegisterForm from '@/components/RegisterForm.vue';
import ForgotPasswordModal from '@/components/ForgotPasswordModal.vue';
import UserDashboard from '@/components/UserDashboard.vue';

export default {
  components: {
    AppHeader,
    FilterNav,
    CartItemDetails,
    CartItemForm,
    LoadingSpinner,
    LoginForm,
    RegisterForm,
    ForgotPasswordModal,
    UserDashboard,
  },

  setup() {
    const cartStore = useCartStore();
    const themeStore = useThemeStore();
    const authStore = useAuthStore();
    const showLoginForm = ref(false);
    const showRegisterForm = ref(false);
    const showForgotPasswordForm = ref(false);
    const showDashboard = ref(false);
    const filter = ref('All');

    // drag state
    const draggedId = ref(null);
    const dragOverId = ref(null);
    const draggedGroup = ref(null);
    const dragOverGroup = ref(null);

    const {
      cartItems,
      isLoading,
      savedItems,
      totalCount,
      savedCount,
      itemsByGroup,
      groups,
      savedByGroup,
    } = storeToRefs(cartStore);

    onMounted(() => {
      themeStore.loadTheme();
      authStore.initAuth();
      if (authStore.isAuthenticated) {
        cartStore.getCartItems();
      }
    });

    const onAuthenticated = () => {
      showLoginForm.value = false;
      showRegisterForm.value = false;
      showForgotPasswordForm.value = false;
      cartStore.getCartItems();
    };

    const handleLogout = () => {
      showDashboard.value = false;
      authStore.logout();
      cartStore.clearCart();
      filter.value = 'All';
    };

    const handleDeleteAccount = async () => {
      showDashboard.value = false;
      await authStore.deleteAccount();
      cartStore.clearCart();
      filter.value = 'All';
    };

    const closeAuthModals = () => {
      showLoginForm.value = false;
      showRegisterForm.value = false;
      showForgotPasswordForm.value = false;
    };

    const switchToRegister = () => {
      showLoginForm.value = false;
      showForgotPasswordForm.value = false;
      showRegisterForm.value = true;
    };

    const switchToLogin = () => {
      showRegisterForm.value = false;
      showForgotPasswordForm.value = false;
      showLoginForm.value = true;
    };

    const switchToForgotPassword = () => {
      showLoginForm.value = false;
      showRegisterForm.value = false;
      showForgotPasswordForm.value = true;
    };

    // --- Drag-and-drop items ---
    const onDragStart = (item) => {
      draggedId.value = item._id;
    };

    const onDragOver = (item) => {
      if (item._id !== draggedId.value) {
        dragOverId.value = item._id;
      }
    };

    const onDragLeave = () => {
      dragOverId.value = null;
    };

    const onDrop = (targetItem, groupName) => {
      dragOverId.value = null;
      if (!draggedId.value || draggedId.value === targetItem._id) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged) return;

      const draggedFromGroup = dragged.group || 'General';
      const targetGroup = groupName;

      // If moving to a different group, update the group field
      if (draggedFromGroup !== targetGroup) {
        cartStore.moveItemToGroup(draggedId.value, targetGroup);
      }

      // Reorder within target group
      const groupItems = allItems
        .filter(
          (i) =>
            (i._id === draggedId.value ? targetGroup : i.group || 'General') ===
            targetGroup,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const fromIndex = groupItems.findIndex((i) => i._id === draggedId.value);
      const toIndex = groupItems.findIndex((i) => i._id === targetItem._id);

      if (fromIndex !== -1 && toIndex !== -1) {
        const reordered = [...groupItems];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, dragged);
        const updates = reordered.map((item, idx) => ({
          id: item._id,
          order: idx,
        }));
        cartStore.reorderItems(updates);
      }

      draggedId.value = null;
    };

    const onDropOnGroup = (groupName) => {
      // Drop item onto group header (append to end of that group)
      dragOverGroup.value = null;
      if (!draggedId.value) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged) return;

      const draggedFromGroup = dragged.group || 'General';
      if (draggedFromGroup !== groupName) {
        cartStore.moveItemToGroup(draggedId.value, groupName);
      }

      // Place at end of target group
      const groupItems = allItems
        .filter(
          (i) =>
            (i.group || 'General') === groupName && i._id !== draggedId.value,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const maxOrder = groupItems.length;
      dragged.order = maxOrder;
      const updates = [...groupItems, dragged].map((item, idx) => ({
        id: item._id,
        order: idx,
      }));
      cartStore.reorderItems(updates);

      draggedId.value = null;
    };

    const onDropSaved = (targetItem, groupName) => {
      dragOverId.value = null;
      if (!draggedId.value || draggedId.value === targetItem._id) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged || !dragged.isSaved) return;

      const draggedFromGroup = dragged.group || 'General';
      const targetGroup = groupName;

      if (draggedFromGroup !== targetGroup) {
        cartStore.moveItemToGroup(draggedId.value, targetGroup);
      }

      const groupItems = allItems
        .filter(
          (i) =>
            i.isSaved &&
            (i._id === draggedId.value ? targetGroup : i.group || 'General') ===
              targetGroup,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const fromIndex = groupItems.findIndex((i) => i._id === draggedId.value);
      const toIndex = groupItems.findIndex((i) => i._id === targetItem._id);

      if (fromIndex !== -1 && toIndex !== -1) {
        const reordered = [...groupItems];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, dragged);
        const updates = reordered.map((item, idx) => ({
          id: item._id,
          order: idx,
        }));
        cartStore.reorderItems(updates);
      }

      draggedId.value = null;
    };

    const onDropOnSavedGroup = (groupName) => {
      dragOverGroup.value = null;
      if (!draggedId.value) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged || !dragged.isSaved) return;

      const draggedFromGroup = dragged.group || 'General';
      if (draggedFromGroup !== groupName) {
        cartStore.moveItemToGroup(draggedId.value, groupName);
      }

      const groupItems = allItems
        .filter(
          (i) =>
            i.isSaved &&
            (i.group || 'General') === groupName &&
            i._id !== draggedId.value,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const maxOrder = groupItems.length;
      dragged.order = maxOrder;
      const updates = [...groupItems, dragged].map((item, idx) => ({
        id: item._id,
        order: idx,
      }));
      cartStore.reorderItems(updates);

      draggedId.value = null;
    };

    const onDragEnd = () => {
      draggedId.value = null;
      dragOverId.value = null;
      draggedGroup.value = null;
      dragOverGroup.value = null;
    };

    // --- Drag-and-drop groups ---
    const onGroupDragStart = (groupName) => {
      draggedGroup.value = groupName;
    };

    const onGroupDragOver = (groupName) => {
      if (groupName !== draggedGroup.value && draggedGroup.value) {
        dragOverGroup.value = groupName;
      }
    };

    const onGroupDragLeave = () => {
      dragOverGroup.value = null;
    };

    const onGroupDrop = (targetGroup) => {
      dragOverGroup.value = null;
      if (!draggedGroup.value || draggedGroup.value === targetGroup) return;

      const currentOrder = [...groups.value];
      const fromIdx = currentOrder.indexOf(draggedGroup.value);
      const toIdx = currentOrder.indexOf(targetGroup);
      if (fromIdx === -1 || toIdx === -1) return;

      currentOrder.splice(fromIdx, 1);
      currentOrder.splice(toIdx, 0, draggedGroup.value);
      cartStore.reorderGroups(currentOrder);

      draggedGroup.value = null;
    };

    // Group delete confirmation
    const confirmingGroupDelete = ref(null);

    // Group rename
    const editingGroup = ref(null);
    const editGroupName = ref('');

    const startGroupEdit = (groupName) => {
      editingGroup.value = groupName;
      editGroupName.value = groupName;
    };

    const cancelGroupEdit = () => {
      editingGroup.value = null;
      editGroupName.value = '';
    };

    const saveGroupEdit = (oldName) => {
      const newName = editGroupName.value.trim();
      if (newName && newName !== oldName) {
        cartStore.renameGroup(oldName, newName);
      }
      editingGroup.value = null;
      editGroupName.value = '';
    };

    const requestGroupDelete = (groupName) => {
      confirmingGroupDelete.value = groupName;
    };

    const cancelGroupDelete = () => {
      confirmingGroupDelete.value = null;
    };

    const confirmGroupDelete = (groupName) => {
      cartStore.deleteGroup(groupName);
      confirmingGroupDelete.value = null;
    };

    const confirmSavedGroupDelete = (groupName) => {
      cartStore.deleteSavedGroup(groupName);
      confirmingGroupDelete.value = null;
    };

    return {
      cartStore,
      themeStore,
      authStore,
      showLoginForm,
      showRegisterForm,
      showForgotPasswordForm,
      showDashboard,
      filter,
      cartItems,
      isLoading,
      savedItems,
      totalCount,
      savedCount,
      itemsByGroup,
      groups,
      savedByGroup,
      draggedId,
      dragOverId,
      draggedGroup,
      dragOverGroup,
      confirmingGroupDelete,
      editingGroup,
      editGroupName,
      onAuthenticated,
      handleLogout,
      handleDeleteAccount,
      closeAuthModals,
      switchToRegister,
      switchToLogin,
      switchToForgotPassword,
      onDragStart,
      onDragOver,
      onDragLeave,
      onDrop,
      onDropSaved,
      onDropOnSavedGroup,
      onDropOnGroup,
      onDragEnd,
      onGroupDragStart,
      onGroupDragOver,
      onGroupDragLeave,
      onGroupDrop,
      requestGroupDelete,
      cancelGroupDelete,
      confirmGroupDelete,
      confirmSavedGroupDelete,
      startGroupEdit,
      cancelGroupEdit,
      saveGroupEdit,
    };
  },
};
</script>

<template>
  <main>
    <div v-if="authStore.isAuthenticated" class="authenticated-layout">
      <AppHeader
        :isDark="themeStore.isDark"
        @toggle-theme="themeStore.toggleTheme()"
        :user="authStore.user"
        @open-dashboard="showDashboard = true"
      />
      <UserDashboard
        v-if="showDashboard"
        @close="showDashboard = false"
        @logout="handleLogout"
        @delete-account="handleDeleteAccount"
      />
      <div class="user-welcome">
        <div class="welcome-content">
          <h2>Welcome back, {{ authStore.userName }}!</h2>
          <p>Your personal cart dashboard</p>
          <div class="user-stats">
            <span class="stat">{{ totalCount }} Items</span>
            <span class="stat">{{ groups.length }} Groups</span>
            <span class="stat">{{ savedCount }} Saved</span>
          </div>
        </div>
      </div>
      <div class="is-loading" v-if="isLoading">
        Loading... <LoadingSpinner />
      </div>
      <div class="container-wrapper" v-else>
        <div class="container">
          <CartItemForm v-if="filter === 'All'" />
          <FilterNav
            :filter="filter"
            :savedCount="savedCount"
            @update:filter="filter = $event"
          />

          <!-- All items grouped -->
          <div v-if="filter === 'All'">
            <div
              v-for="groupName in groups"
              :key="groupName"
              class="item-group"
              :class="{ 'group-drag-over': dragOverGroup === groupName }"
            >
              <div
                class="group-header"
                draggable="true"
                @dragstart.stop="onGroupDragStart(groupName)"
                @dragover.prevent="
                  draggedGroup
                    ? onGroupDragOver(groupName)
                    : draggedId
                      ? (dragOverGroup = groupName)
                      : null
                "
                @dragleave="
                  onGroupDragLeave();
                  dragOverGroup = null;
                "
                @drop.prevent="
                  draggedGroup
                    ? onGroupDrop(groupName)
                    : onDropOnGroup(groupName)
                "
                @dragend="onDragEnd"
              >
                <div class="group-header-left">
                  <span class="drag-handle group-drag-handle material-icons"
                    >drag_indicator</span
                  >
                  <template v-if="editingGroup === groupName">
                    <input
                      v-model="editGroupName"
                      class="edit-group-input"
                      @keyup.enter="saveGroupEdit(groupName)"
                      @keyup.escape="cancelGroupEdit"
                      autofocus
                    />
                    <i
                      class="material-icons edit-group-save"
                      @click.stop="saveGroupEdit(groupName)"
                      >check</i
                    >
                    <i
                      class="material-icons edit-group-cancel"
                      @click.stop="cancelGroupEdit"
                      >close</i
                    >
                  </template>
                  <template v-else>
                    <span class="group-name">{{ groupName }}</span>
                    <i
                      class="material-icons edit-group-icon"
                      @click.stop="startGroupEdit(groupName)"
                      title="Rename group"
                      >edit</i
                    >
                  </template>
                </div>
                <div class="group-header-right">
                  <span class="group-count"
                    >{{ itemsByGroup[groupName]?.length ?? 0 }} items</span
                  >
                  <button
                    v-if="confirmingGroupDelete !== groupName"
                    class="delete-group-btn"
                    @click.stop="requestGroupDelete(groupName)"
                    title="Delete group"
                  >
                    <i class="material-icons">delete</i>
                    Delete group
                  </button>
                  <span v-else class="confirm-group-delete">
                    <span class="confirm-text">Delete?</span>
                    <i
                      class="material-icons confirm-yes"
                      @click.stop="confirmGroupDelete(groupName)"
                      >check</i
                    >
                    <i
                      class="material-icons confirm-no"
                      @click.stop="cancelGroupDelete"
                      >close</i
                    >
                  </span>
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
                }"
                @dragstart.stop="onDragStart(item)"
                @dragover.prevent="onDragOver(item)"
                @dragleave="onDragLeave"
                @drop.prevent="onDrop(item, groupName)"
                @dragend="onDragEnd"
              >
                <span class="drag-handle material-icons">drag_indicator</span>
                <CartItemDetails
                  :cartItem="item"
                  :index="idx"
                  :total="itemsByGroup[groupName].length"
                />
              </div>
            </div>
            <p v-if="totalCount === 0" class="empty-state">
              No items yet. Add your first item above!
            </p>
          </div>

          <!-- Saved items grouped -->
          <div v-if="filter === 'Favs'">
            <div
              v-for="groupName in Object.keys(savedByGroup)"
              :key="groupName"
              class="item-group"
              :class="{ 'group-drag-over': dragOverGroup === groupName }"
            >
              <div
                class="group-header"
                @dragover.prevent="
                  draggedId ? (dragOverGroup = groupName) : null
                "
                @dragleave="dragOverGroup = null"
                @drop.prevent="onDropOnSavedGroup(groupName)"
              >
                <div class="group-header-left">
                  <span class="group-name">{{ groupName }}</span>
                </div>
                <div class="group-header-right">
                  <span class="group-count"
                    >{{ savedByGroup[groupName].length }} saved</span
                  >
                  <button
                    v-if="confirmingGroupDelete !== groupName"
                    class="delete-group-btn"
                    @click.stop="requestGroupDelete(groupName)"
                    title="Delete saved group"
                  >
                    <i class="material-icons">delete</i>
                    Delete group
                  </button>
                  <span v-else class="confirm-group-delete">
                    <span class="confirm-text">Delete?</span>
                    <i
                      class="material-icons confirm-yes"
                      @click.stop="confirmSavedGroupDelete(groupName)"
                      >check</i
                    >
                    <i
                      class="material-icons confirm-no"
                      @click.stop="cancelGroupDelete"
                      >close</i
                    >
                  </span>
                </div>
              </div>
              <div
                v-for="(item, idx) in savedByGroup[groupName]"
                :key="item._id"
                draggable="true"
                class="draggable-row"
                :class="{
                  'drag-over': dragOverId === item._id,
                  dragging: draggedId === item._id,
                }"
                @dragstart.stop="onDragStart(item)"
                @dragover.prevent="onDragOver(item)"
                @dragleave="onDragLeave"
                @drop.prevent="onDropSaved(item, groupName)"
                @dragend="onDragEnd"
              >
                <span class="drag-handle material-icons">drag_indicator</span>
                <CartItemDetails
                  :cartItem="item"
                  :index="idx"
                  :total="savedByGroup[groupName].length"
                  :isSavedView="true"
                />
              </div>
            </div>
            <p v-if="savedCount === 0" class="empty-state">
              No saved items yet. Tap the bookmark icon on any item to save a
              copy here.
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="landing-page">
      <div class="landing-content">
        <p class="landing-content__headline">Pinit Down</p>
        <p class="landing-content__copy">
          Your personal item management dashboard
        </p>
        <div class="landing-btns">
          <button @click="showLoginForm = true" class="landing-btns__primary">
            Sign In
          </button>
          <button
            @click="showRegisterForm = true"
            class="landing-btns__secondary"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
    <div v-if="showLoginForm" class="auth-overlay" @click="closeAuthModals">
      <LoginForm
        @close="closeAuthModals"
        @switch-to-register="switchToRegister"
        @switch-to-forgot-password="switchToForgotPassword"
        @authenticated="onAuthenticated"
      />
    </div>
    <div v-if="showRegisterForm" class="auth-overlay" @click="closeAuthModals">
      <RegisterForm
        @close="closeAuthModals"
        @switch-to-login="switchToLogin"
        @authenticated="onAuthenticated"
      />
    </div>
    <div
      v-if="showForgotPasswordForm"
      class="auth-overlay"
      @click="closeAuthModals"
    >
      <ForgotPasswordModal
        @close="closeAuthModals"
        @switch-to-login="switchToLogin"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';

.user-welcome {
  background: color.$gradient;
  color: color.$light;
  padding: spacing.$spacing-xxs 0;

  .welcome-content {
    max-width: 75rem;
    margin: 0 auto;
    text-align: center;
  }

  .welcome-content h2 {
    font-size: size.$sp20;
    margin-bottom: spacing.$spacing-xxs;
    font-weight: 600;
    padding-top: spacing.$spacing-xxs;

    @include breakpoint.media-breakpoint-up(sm) {
      font-size: size.$sp24;
      margin-bottom: spacing.$spacing-xs;
    }
  }

  .welcome-content p {
    font-size: size.$sp12;
    margin-bottom: spacing.$spacing-xxs;
    opacity: 0.9;

    @include breakpoint.media-breakpoint-up(sm) {
      font-size: size.$sp16;
      margin-bottom: spacing.$spacing-xs;
    }
  }

  .user-stats {
    display: flex;
    justify-content: center;
    gap: spacing.$spacing-xxs;
    margin: spacing.$spacing-xxs 0;

    @include breakpoint.media-breakpoint-up(sm) {
      gap: spacing.$spacing-xs;
      margin: spacing.$spacing-xs 0;
    }
  }

  .stat {
    background: rgba(color.$light50, 0.2);
    padding: spacing.$spacing-base spacing.$spacing-xxs;
    border-radius: size.$sp20;
    font-weight: 500;
    font-size: size.$sp12;

    @include breakpoint.media-breakpoint-up(sm) {
      padding: spacing.$spacing-xxs spacing.$spacing-xs;
      font-size: size.$sp16;
    }
  }
  @include breakpoint.media-breakpoint-up(sm) {
    padding: spacing.$spacing-xs 0;
  }
}

.authenticated-layout {
  padding-top: 3.5rem;

  @include breakpoint.media-breakpoint-up(sm) {
    padding-top: 4rem;
  }
}

.landing-page {
  min-height: 100vh;
  background: color.$gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: spacing.$spacing-s;
}

.landing-content {
  text-align: center;
  color: color.$light;
  max-width: 50rem;

  &__headline {
    font-size: size.$sp32;
    font-weight: 700;

    @include breakpoint.media-breakpoint-up(sm) {
      font-size: size.$sp36;
    }
  }

  &__copy {
    font-size: size.$sp20;

    @include breakpoint.media-breakpoint-up(sm) {
      font-size: size.$sp24;
    }
  }
}

.landing-btns {
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xs;
  justify-content: center;

  &__primary,
  &__secondary {
    padding: spacing.$spacing-xs spacing.$spacing-m;
    border: none;
    border-radius: spacing.$spacing-xxs;
    font-size: size.$sp16;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: size.$sp01 * 0.5;
    min-width: 8.75rem;
  }

  &__primary {
    background: color.$light;
    color: color.$dark50;
  }

  &__primary:hover {
    background: color.$light50;
    color: color.$dark50;
    transform: translateY(size.$sp02 * -1);
    box-shadow: 0 spacing.$spacing-xxs spacing.$spacing-s
      rgba(color.$dark50, 0.3);
  }

  &__secondary {
    background: transparent;
    color: color.$light;
    border: size.$sp02 solid rgba(color.$light, 0.7);
  }

  &__secondary:hover {
    background: rgba(color.$light, 0.1);
    border-color: color.$light;
    transform: translateY(size.$sp02 * -1);
  }

  @include breakpoint.media-breakpoint-up(sm) {
    flex-direction: row;
    gap: spacing.$spacing-xs;
    margin-top: spacing.$spacing-s;
  }
}

.auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(color.$dark, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(size.$sp04);
}

.cart-item-list {
  margin-top: spacing.$spacing-2-xl;
}

.item-group {
  padding-top: spacing.$spacing-xl;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: spacing.$spacing-xxs;
  background: color.$gradient;
  border-radius: size.$sp08;
  margin-bottom: spacing.$spacing-xxs;
  cursor: grab;
  transition:
    outline 0.15s,
    background 0.15s;

  &:active {
    cursor: grabbing;
  }

  .group-header-left {
    display: flex;
    align-items: center;
    gap: spacing.$spacing-xxs;
  }

  .group-drag-handle {
    color: rgba(color.$light, 0.6);
    font-size: size.$sp20;
    user-select: none;
  }

  .group-name {
    font-weight: 600;
    font-size: size.$sp16;
    color: color.$light;
    letter-spacing: 0.03em;
  }

  .edit-group-icon {
    font-size: size.$sp16;
    color: rgba(color.$light, 0.8);
    cursor: pointer;
    &:hover {
      color: color.$white;
    }
  }

  .edit-group-input {
    padding: 0.2rem 0.4rem;
    border: 1.5px solid rgba(color.$light, 0.4);
    border-radius: 4px;
    font-size: size.$sp16;
    font-weight: 600;
    background: rgba(color.$light, 0.15);
    color: color.$light;
    outline: none;
    width: 120px;

    &:focus {
      border-color: color.$light;
    }
  }

  .edit-group-save {
    font-size: size.$sp20;
    color: rgba(color.$light, 0.8);
    cursor: pointer;
    &:hover {
      color: color.$light;
    }
  }

  .edit-group-cancel {
    font-size: size.$sp20;
    color: rgba(color.$light, 0.5);
    cursor: pointer;
    &:hover {
      color: color.$light;
    }
  }

  .group-count {
    font-size: size.$sp12;
    color: rgba(color.$light, 0.8);
  }

  .group-header-right {
    display: flex;
    align-items: center;
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
      font-size: size.$sp20;
    }

    &:hover {
      color: color.$light;
    }
  }
}

.item-group.group-drag-over {
  outline: 2px dashed color.$blue-violet;
  outline-offset: 4px;
  border-radius: size.$sp08;
}

.confirm-group-delete {
  display: flex;
  align-items: center;
  gap: 0.3rem;

  .confirm-text {
    font-size: 0.75rem;
    color: color.$light;
    font-weight: 600;
  }

  .confirm-yes {
    color: color.$light;
    font-size: 1.2rem;
    cursor: pointer;
    &:hover {
      color: color.$danger-light;
    }
  }

  .confirm-no {
    color: rgba(color.$light, 0.6);
    font-size: 1.2rem;
    cursor: pointer;
    &:hover {
      color: color.$light;
    }
  }
}

.draggable-row {
  display: flex;
  align-items: center;
  gap: spacing.$spacing-xxs;
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
    outline: 2px dashed color.$blue-violet;
  }
}

.drag-handle {
  color: color.$muted-lightest;
  font-size: size.$sp20;
  user-select: none;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  color: color.$muted-lighter;
  margin-top: spacing.$spacing-s;
}
</style>
