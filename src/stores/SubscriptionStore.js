import { defineStore } from 'pinia'
import { purchasesService } from '@/services/purchasesService'

const DEV_PRO_KEY = 'pinit_dev_pro_override'

export const FREE_LIMITS = {
  groups: 1,
  items: 15,
  radiusKm: 1,
}

function loadDevOverride() {
  try {
    return localStorage.getItem(DEV_PRO_KEY) === 'true'
  } catch {
    return false
  }
}

export const useSubscriptionStore = defineStore('subscriptionStore', {
  state: () => ({
    isPro: false,
    offerings: null,
    loading: false,
    error: '',
    paywallOpen: false,
    paywallReason: '',
    // Dev-only toggle so Pro features can be tested in the browser, where
    // RevenueCat/native purchases are unavailable.
    devOverride: loadDevOverride(),
  }),

  getters: {
    // Store review guidelines require IAP for paid features on native apps,
    // but the browser build has no app store to enforce that, so it's all free there.
    effectiveIsPro: (state) => !purchasesService.isNative() || state.isPro || state.devOverride,
  },

  actions: {
    async init() {
      this.loading = true
      try {
        const customerInfo = await purchasesService.getCustomerInfo()
        this.isPro = purchasesService.hasProEntitlement(customerInfo)
        this.offerings = await purchasesService.getOfferings()
      } catch (err) {
        this.error = err?.message || 'Could not load subscription status.'
      } finally {
        this.loading = false
      }
    },

    openPaywall(reason = '') {
      this.paywallReason = reason
      this.paywallOpen = true
    },

    closePaywall() {
      this.paywallOpen = false
      this.paywallReason = ''
    },

    async purchase(pkg) {
      this.loading = true
      this.error = ''
      try {
        const customerInfo = await purchasesService.purchasePackage(pkg)
        this.isPro = purchasesService.hasProEntitlement(customerInfo)
        if (this.isPro) this.closePaywall()
        return this.isPro
      } catch (err) {
        this.error = err?.message || 'Purchase failed.'
        return false
      } finally {
        this.loading = false
      }
    },

    async restore() {
      this.loading = true
      this.error = ''
      try {
        const customerInfo = await purchasesService.restorePurchases()
        this.isPro = purchasesService.hasProEntitlement(customerInfo)
        if (this.isPro) this.closePaywall()
        return this.isPro
      } catch (err) {
        this.error = err?.message || 'Restore failed.'
        return false
      } finally {
        this.loading = false
      }
    },

    // Dev-only helper, never exposed in production UI.
    setDevOverride(value) {
      this.devOverride = value
      try {
        localStorage.setItem(DEV_PRO_KEY, value ? 'true' : 'false')
      } catch {
        // ignore storage failures
      }
    },
  },
})
