import { Capacitor } from '@capacitor/core'
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'

// Public RevenueCat SDK keys, set per environment in .env (see .env.example).
const REVENUECAT_API_KEYS = {
  ios: import.meta.env.VITE_REVENUECAT_IOS_API_KEY || '',
  android: import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY || '',
}

export const PRO_ENTITLEMENT_ID = 'pro'

let configured = false

function isNative() {
  return Capacitor.isNativePlatform()
}

async function configure() {
  if (configured || !isNative()) return
  const platform = Capacitor.getPlatform()
  const apiKey = REVENUECAT_API_KEYS[platform]
  if (!apiKey) return

  await Purchases.setLogLevel({ level: LOG_LEVEL.WARN })
  await Purchases.configure({ apiKey })
  configured = true
}

async function getCustomerInfo() {
  if (!isNative()) return null
  await configure()
  if (!configured) return null
  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo
}

async function getOfferings() {
  if (!isNative()) return null
  await configure()
  if (!configured) return null
  const offerings = await Purchases.getOfferings()
  return offerings.current
}

async function purchasePackage(pkg) {
  await configure()
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return customerInfo
}

async function restorePurchases() {
  await configure()
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}

function hasProEntitlement(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT_ID]
}

export const purchasesService = {
  isNative,
  configure,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasProEntitlement,
}
