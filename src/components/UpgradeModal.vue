<script>
import { useSubscriptionStore } from '@/stores/SubscriptionStore';

export default {
  setup() {
    const subscriptionStore = useSubscriptionStore();
    return { subscriptionStore };
  },
  computed: {
    monthlyPackage() {
      return this.subscriptionStore.offerings?.availablePackages?.find(
        (pkg) => pkg.packageType === 'MONTHLY',
      );
    },
    annualPackage() {
      return this.subscriptionStore.offerings?.availablePackages?.find(
        (pkg) => pkg.packageType === 'ANNUAL',
      );
    },
  },
  methods: {
    async buy(pkg) {
      if (!pkg) return;
      await this.subscriptionStore.purchase(pkg);
    },
    async restore() {
      await this.subscriptionStore.restore();
    },
  },
};
</script>

<template>
  <div
    v-if="subscriptionStore.paywallOpen"
    class="paywall-overlay"
    @click.self="subscriptionStore.closePaywall()"
  >
    <div class="paywall-card">
      <button class="paywall-close" @click="subscriptionStore.closePaywall()">
        <i class="material-icons">close</i>
      </button>

      <i class="material-icons paywall-icon">workspace_premium</i>
      <h2>Upgrade to Pro</h2>
      <p class="paywall-tagline">
        Unlock unlimited shopping lists, recipe downloads, and saved
        favorites.
      </p>

      <ul class="paywall-features">
        <li>Unlimited shopping lists + item management</li>
        <li>Saved templates for repeat shoppers</li>
        <li>Download recipe PDFs and watch YouTube videos</li>
        <li>Save recipes, food facts &amp; favorite places</li>
      </ul>

      <div class="paywall-plans">
        <button
          class="paywall-plan"
          :disabled="subscriptionStore.loading || !monthlyPackage"
          @click="buy(monthlyPackage)"
        >
          <span class="plan-name">Monthly</span>
          <span class="plan-price">{{
            monthlyPackage?.product?.priceString || '$2.99/mo'
          }}</span>
        </button>
        <button
          class="paywall-plan featured"
          :disabled="subscriptionStore.loading || !annualPackage"
          @click="buy(annualPackage)"
        >
          <span class="plan-badge">Best value</span>
          <span class="plan-name">Yearly</span>
          <span class="plan-price">{{
            annualPackage?.product?.priceString || '$19.99/yr'
          }}</span>
        </button>
      </div>

      <p v-if="subscriptionStore.error" class="paywall-error">
        {{ subscriptionStore.error }}
      </p>

      <button
        class="paywall-restore"
        :disabled="subscriptionStore.loading"
        @click="restore"
      >
        Restore purchases
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

.paywall-overlay {
  position: fixed;
  inset: 0;
  background: rgba(color.$dark, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: spacing.$spacing-s;
}

.paywall-card {
  position: relative;
  background: color.$white;
  border-radius: size.$sp16;
  padding: spacing.$spacing-l;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 size.$sp10 size.$sp24 rgba(color.$dark, 0.3);
}

.paywall-close {
  position: absolute;
  top: spacing.$spacing-s;
  right: spacing.$spacing-s;
  border: none;
  background: none;
  cursor: pointer;
  color: color.$muted;
}

.paywall-icon {
  color: color.$blue-violet;
  @include typography.headline-360-medium;
}

.paywall-tagline {
  color: color.$muted;
  margin: spacing.$spacing-xxs 0 spacing.$spacing-s;
}

.paywall-features {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 0 0 spacing.$spacing-m;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;

  li {
    @include typography.headline-120;
    padding-left: spacing.$spacing-s;
    position: relative;

    &::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: color.$success;
      font-weight: 700;
    }
  }
}

.paywall-plans {
  display: flex;
  gap: spacing.$spacing-xs;
  margin-bottom: spacing.$spacing-s;
}

.paywall-plan {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: spacing.$spacing-xxs;
  padding: spacing.$spacing-s;
  border: size.$sp02 solid color.$border-dark;
  border-radius: size.$sp10;
  background: none;
  cursor: pointer;

  &.featured {
    border-color: color.$blue-violet;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .plan-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: color.$blue-violet;
    color: color.$white;
    padding: 2px spacing.$spacing-xxs;
    border-radius: size.$sp06;
    @include typography.headline-100;
  }

  .plan-name {
    @include typography.headline-140-medium;
  }

  .plan-price {
    color: color.$muted;
  }
}

.paywall-error {
  color: color.$danger-text;
  @include typography.headline-100;
}

.paywall-restore {
  border: none;
  background: none;
  color: color.$muted;
  text-decoration: underline;
  cursor: pointer;
}
</style>
