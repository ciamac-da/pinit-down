<script>
import { ref, onMounted } from "vue";
import { useCartStore } from "@/stores/CartStore";
import { useThemeStore } from "@/stores/ThemeStore";
import { useAuthStore } from "@/stores/AuthStore";
import { storeToRefs } from "pinia";
import AppHeader from "@/components/AppHeader.vue";
import FilterNav from "@/components/FilterNav.vue";
import CartItemDetails from "@/components/CartItemDetails.vue";
import CartItemForm from "@/components/CartItemForm.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import LoginForm from "@/components/LoginForm.vue";
import RegisterForm from "@/components/RegisterForm.vue";
import "@/styles/global.scss";

export default {
  components: {
    AppHeader,
    FilterNav,
    CartItemDetails,
    CartItemForm,
    LoadingSpinner,
    LoginForm,
    RegisterForm,
  },

  setup() {
    const cartStore = useCartStore();
    const themeStore = useThemeStore();
    const authStore = useAuthStore();
    const showLoginForm = ref(false);
    const showRegisterForm = ref(false);
    const filter = ref("All");

    const { cartItems, isLoading, favs, totalCount, favCount } = storeToRefs(cartStore);

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
      cartStore.getCartItems();
    };

    const handleLogout = () => {
      authStore.logout();
      cartStore.cartItems = [];
      filter.value = "All";
    };

    const closeAuthModals = () => {
      showLoginForm.value = false;
      showRegisterForm.value = false;
    };

    const switchToRegister = () => {
      showLoginForm.value = false;
      showRegisterForm.value = true;
    };

    const switchToLogin = () => {
      showRegisterForm.value = false;
      showLoginForm.value = true;
    };

    return {
      cartStore,
      themeStore,
      authStore,
      showLoginForm,
      showRegisterForm,
      filter,
      cartItems,
      isLoading,
      favs,
      totalCount,
      favCount,
      onAuthenticated,
      handleLogout,
      closeAuthModals,
      switchToRegister,
      switchToLogin,
    };
  },
};
</script>

<template>
  <main>
    <div v-if="authStore.isAuthenticated">
      <AppHeader 
        :isDark="themeStore.isDark" 
        @toggle-theme="themeStore.toggleTheme()"
        :user="authStore.user"
        @logout="handleLogout"
      />
      <div class="user-welcome">
        <div class="welcome-content">
          <h2>Welcome back, {{ authStore.userName }}!</h2>
          <p>Your personal cart dashboard</p>
          <div class="user-stats">
            <span class="stat">{{ totalCount }} Items</span>
            <span class="stat">{{ favCount }} Favorites</span>
          </div>
        </div>
      </div>
      <div class="is-loading" v-if="isLoading">Loading... <LoadingSpinner /></div>
      <div class="container-wrapper" v-else>
        <div class="container">
          <CartItemForm />
          <FilterNav
            :filter="filter"
            @update:filter="filter = $event"
            @delete-all="cartStore.deleteAllCartItems"
          />
          <div class="cart-item-list" v-if="filter === 'All'">
            <p>
              You have {{ totalCount }}
              {{ totalCount <= 1 ? "Item" : "Items" }}
            </p>
            <div v-for="cartItem in cartItems" :key="cartItem._id">
              <CartItemDetails :cartItem="cartItem" />
            </div>
          </div>
          <div class="cart-item-list" v-if="filter === 'Favs'">
            <p>
              You have {{ favCount }} Fav
              {{ favCount <= 1 ? "Item" : "Items" }}
            </p>
            <div v-for="cartItem in favs" :key="cartItem._id">
              <CartItemDetails :cartItem="cartItem" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="landing-page">
      <div class="landing-content">
        <p class="landing-content__headline">Pinit Down</p>
        <p class="landing-content__copy">Your personal item management dashboard</p>
        <div class="landing-btns">
        <button @click="showLoginForm = true" class="landing-btns__primary">
          Sign In
        </button>
        <button @click="showRegisterForm = true" class="landing-btns__secondary">
          Create Account
        </button>
      </div>
      </div>
    </div>
    <div v-if="showLoginForm" class="auth-overlay" @click="closeAuthModals">
      <LoginForm 
        @close="closeAuthModals"
        @switch-to-register="switchToRegister"
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
  </main>
</template>

<style lang="scss" scoped>
@use "@/styles/abstracts/breakpoint";
@use "@/styles/abstracts/color";
@use "@/styles/abstracts/spacing";
@use "@/styles/abstracts/size";

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
    box-shadow: 0 spacing.$spacing-xxs spacing.$spacing-s rgba(color.$dark50, 0.3);
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
</style>