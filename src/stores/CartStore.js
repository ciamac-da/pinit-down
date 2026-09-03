import { defineStore } from 'pinia'
import { useSubscriptionStore, FREE_LIMITS } from './SubscriptionStore'

const STORAGE_KEY = 'pinit_cart_items'
const TOAST_TIMEOUT_MS = 2600
let toastTimer = null

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function loadStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function normalizeItemMeasure(item) {
  const parsedAmount = Number(item.amount)
  const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0
  return {
    ...item,
    amount: hasValidAmount ? parsedAmount : 1,
    unit: item.unit || 'pieces',
  }
}

function normalizeGroupName(name) {
  const trimmed = (name || 'General').trim()
  if (!trimmed) return 'General'
  return trimmed.replace(/\p{L}+/gu, word => word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
}

function getGroupKey(name) {
  return normalizeGroupName(name).toLocaleLowerCase()
}

function resolveGroupName(items, customGroups, groupName, isSavedScope = false) {
  const key = getGroupKey(groupName)

  const fromCustom = (customGroups || []).find(name => getGroupKey(name) === key)
  if (fromCustom) return fromCustom

  const fromItems = (items || []).find(
    item =>
      item.isSaved === isSavedScope &&
      getGroupKey(item.group || 'General') === key,
  )
  if (fromItems) return normalizeGroupName(fromItems.group || 'General')

  return normalizeGroupName(groupName)
}

function getItemSignature(item) {
  return [
    (item.title || '').trim().toLowerCase(),
    Number(item.amount),
    item.unit || 'pieces',
    item.group || 'General',
  ].join('::')
}

function getGroupSignatures(items, isSaved, groupName) {
  return items
    .filter(item => item.isSaved === isSaved && (item.group || 'General') === groupName)
    .map(item => getItemSignature(item))
}

export const useCartStore = defineStore('cartStore', {
  state: () => ({
    cartItems: [],
    isLoading: false,
    savedPlaces: loadStoredArray('pinit_saved_places'),
    toast: {
      visible: false,
      message: '',
      kind: 'info',
    },
    customGroups: loadStoredArray('pinit_custom_groups'),
    groupOrder: loadStoredArray('pinit_group_order'),
  }),

  getters: {
    savedItems() {
      return (this.cartItems || []).filter(t => t.isSaved)
    },
    savedCount() {
      return (this.cartItems || []).reduce((count, item) => item.isSaved ? count + 1 : count, 0)
    },
    totalCount(state) {
      return (state.cartItems || []).filter(t => !t.isSaved).length
    },
    isCartItemSaved: (state) => (cartItemId) => {
      const cartItem = state.cartItems.find(i => i._id === cartItemId)
      if (!cartItem) return false
      const saved = state.cartItems.find(i => i.isSaved && i.savedFrom === cartItemId)
      if (!saved) return false
      // Re-saveable if amount or unit changed since last save.
      return Number(saved.amount) === Number(cartItem.amount) && saved.unit === (cartItem.unit || 'pieces')
    },
    groups() {
      const fromItems = (this.cartItems || []).filter(i => !i.isSaved).map(item => item.group || 'General')
      const all = [...new Set([...this.customGroups, ...fromItems])]
      return all.sort((a, b) => a.localeCompare(b))
    },
    itemsByGroup() {
      const grouped = {}
      const sorted = [...(this.cartItems || [])].filter(i => !i.isSaved).sort((a, b) => a.title.localeCompare(b.title))
      for (const item of sorted) {
        const g = item.group || 'General'
        if (!grouped[g]) grouped[g] = []
        grouped[g].push(item)
      }
      return grouped
    },
    savedByGroup() {
      const grouped = {}
      const sorted = [...(this.cartItems || [])].filter(i => i.isSaved).sort((a, b) => a.title.localeCompare(b.title))
      for (const item of sorted) {
        const g = item.group || 'General'
        if (!grouped[g]) grouped[g] = []
        grouped[g].push(item)
      }
      return grouped
    },
  },

  actions: {
    showToast(message, kind = 'info') {
      this.toast = {
        visible: true,
        message,
        kind,
      }

      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => {
        this.dismissToast()
      }, TOAST_TIMEOUT_MS)
    },

    dismissToast() {
      this.toast.visible = false
    },

    loadCartItems() {
      const loaded = loadItems()

      const scopedCanon = {
        cart: {},
        favorites: {},
      }

      this.cartItems = loaded.map(normalizeItemMeasure).map(item => {
        const scope = item.isSaved ? 'favorites' : 'cart'
        const key = getGroupKey(item.group || 'General')
        if (!scopedCanon[scope][key]) {
          scopedCanon[scope][key] = normalizeGroupName(item.group || 'General')
        }
        return {
          ...item,
          group: scopedCanon[scope][key],
        }
      })

      const uniqueCustomGroups = []
      const seenCustomKeys = new Set()
      this.customGroups.forEach(name => {
        const normalized = normalizeGroupName(name)
        const key = getGroupKey(normalized)
        if (!seenCustomKeys.has(key)) {
          seenCustomKeys.add(key)
          uniqueCustomGroups.push(normalized)
        }
      })
      this.customGroups = uniqueCustomGroups
      localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))

      saveItems(this.cartItems)
    },

    addCartItem(cartItem) {
      const subscriptionStore = useSubscriptionStore()
      if (!subscriptionStore.effectiveIsPro && this.totalCount >= FREE_LIMITS.items) {
        subscriptionStore.openPaywall('cart-item-limit')
        return
      }

      const resolvedGroup = resolveGroupName(
        this.cartItems,
        this.customGroups,
        cartItem.group || 'General',
        false,
      )

      const item = {
        _id: generateId(),
        title: cartItem.title,
        amount: Number(cartItem.amount),
        unit: cartItem.unit,
        group: resolvedGroup,
        isSaved: false,
        isPurchased: false,
        order: cartItem.order ?? Date.now(),
      }
      this.cartItems.push(item)
      saveItems(this.cartItems)
    },

    itemExistsInGroup(title, group) {
      const titleKey = (title || '').trim().toLocaleLowerCase()
      const groupKey = getGroupKey(group || 'General')
      return this.cartItems.some(
        item =>
          !item.isSaved &&
          item.title.trim().toLocaleLowerCase() === titleKey &&
          getGroupKey(item.group || 'General') === groupKey,
      )
    },

    saveItem(id) {
      const subscriptionStore = useSubscriptionStore()
      if (!subscriptionStore.effectiveIsPro) {
        subscriptionStore.openPaywall('saved-templates')
        return
      }

      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return

      const existingFavorite = this.cartItems.find(
        item => item.isSaved && item.savedFrom === cartItem._id,
      )

      if (existingFavorite) {
        const currentCartSignature = getItemSignature(cartItem)
        const existingFavoriteSignature = getItemSignature(existingFavorite)

        if (existingFavoriteSignature === currentCartSignature) {
          this.showToast('This item is already saved.', 'info')
          return
        }

        existingFavorite.title = cartItem.title
        existingFavorite.amount = cartItem.amount
        existingFavorite.unit = cartItem.unit
        existingFavorite.group = cartItem.group || 'General'
        saveItems(this.cartItems)
        this.showToast('Saved item updated from cart.', 'success')
        return
      }

      const newItem = {
        _id: generateId(),
        title: cartItem.title,
        amount: cartItem.amount,
        unit: cartItem.unit,
        group: normalizeGroupName(cartItem.group || 'General'),
        isSaved: true,
        favoriteSource: 'cart',
        savedFrom: id,
        isPurchased: false,
        order: Date.now(),
      }
      this.cartItems.push(newItem)
      saveItems(this.cartItems)
      this.showToast(`"${cartItem.title}" added to favorites.`, 'success')
    },

    saveGroupAsFavorites(groupName) {
      const subscriptionStore = useSubscriptionStore()
      if (!subscriptionStore.effectiveIsPro) {
        subscriptionStore.openPaywall('saved-templates')
        return
      }

      const groupItems = this.cartItems.filter(
        item => !item.isSaved && (item.group || 'General') === groupName,
      )

      if (groupItems.length === 0) {
        this.showToast('No cart items found in this group.', 'warning')
        return
      }

      let addedCount = 0
      let updatedCount = 0

      const newFavorites = []
      groupItems.forEach((item, idx) => {
        const existingFavorite = this.cartItems.find(
          existing => existing.isSaved && existing.savedFrom === item._id,
        )

        if (!existingFavorite) {
          newFavorites.push({
            _id: generateId(),
            title: item.title,
            amount: item.amount,
            unit: item.unit,
            group: item.group || 'General',
            isSaved: true,
            favoriteSource: 'cart',
            savedFrom: item._id,
            isPurchased: false,
            order: Date.now() + idx,
          })
          addedCount += 1
          return
        }

        const cartSignature = getItemSignature(item)
        const favoriteSignature = getItemSignature(existingFavorite)
        if (cartSignature !== favoriteSignature) {
          existingFavorite.title = item.title
          existingFavorite.amount = item.amount
          existingFavorite.unit = item.unit
          existingFavorite.group = item.group || 'General'
          updatedCount += 1
        }
      })

      if (newFavorites.length === 0 && updatedCount === 0) {
        this.showToast('List is already fully saved.', 'info')
        return
      }

      if (newFavorites.length > 0) {
        this.cartItems.push(...newFavorites)
      }
      saveItems(this.cartItems)

      const messages = []
      if (addedCount > 0) {
        messages.push(`added ${addedCount}`)
      }
      if (updatedCount > 0) {
        messages.push(`updated ${updatedCount}`)
      }
      this.showToast(`Favorites synced: ${messages.join(', ')}.`, 'success')
    },

    addItemsToFavorites(items, groupName = 'Recipes', options = {}) {
      const subscriptionStore = useSubscriptionStore()
      if (!subscriptionStore.effectiveIsPro) {
        subscriptionStore.openPaywall('saved-templates')
        return
      }

      if (!Array.isArray(items) || items.length === 0) {
        this.showToast('No items available to save.', 'warning')
        return
      }

      const sourceType = options.sourceType || 'cart'
      const recipeMeta = options.recipeMeta || null
      const foodFactMeta = options.foodFactMeta || null
      const resolvedGroup = resolveGroupName(this.cartItems, [], groupName, true)
      const savedFavorites = this.cartItems.filter(item => item.isSaved)
      const existingBySignature = new Map(
        savedFavorites.map(item => [getItemSignature(item), item]),
      )

      let updatedCount = 0
      const favoritesToAdd = []

      items.forEach((item, idx) => {
        const normalizedFavorite = {
          _id: generateId(),
          title: item.title,
          amount: Number(item.amount),
          unit: item.unit || 'pieces',
          group: resolvedGroup,
          isSaved: true,
          favoriteSource: sourceType,
          recipeMeta: sourceType === 'recipe' ? recipeMeta : null,
          foodFactMeta: sourceType === 'food-fact' ? foodFactMeta : null,
          isPurchased: false,
          order: Date.now() + idx,
        }

        const signature = getItemSignature(normalizedFavorite)
        const existingFavorite = existingBySignature.get(signature)

        if (!existingFavorite) {
          favoritesToAdd.push(normalizedFavorite)
          existingBySignature.set(signature, normalizedFavorite)
          return
        }

        if (sourceType === 'recipe') {
          let changed = false

          if (existingFavorite.favoriteSource !== 'recipe') {
            existingFavorite.favoriteSource = 'recipe'
            changed = true
          }

          if (existingFavorite.group !== resolvedGroup) {
            existingFavorite.group = resolvedGroup
            changed = true
          }

          if (recipeMeta && !existingFavorite.recipeMeta) {
            existingFavorite.recipeMeta = recipeMeta
            changed = true
          }

          if (changed) {
            updatedCount += 1
          }
        } else if (sourceType === 'food-fact') {
          let changed = false

          if (existingFavorite.favoriteSource !== 'food-fact') {
            existingFavorite.favoriteSource = 'food-fact'
            changed = true
          }

          if (existingFavorite.group !== resolvedGroup) {
            existingFavorite.group = resolvedGroup
            changed = true
          }

          if (foodFactMeta && !existingFavorite.foodFactMeta) {
            existingFavorite.foodFactMeta = foodFactMeta
            changed = true
          }

          if (changed) {
            updatedCount += 1
          }
        }
      })

      if (favoritesToAdd.length === 0 && updatedCount === 0) {
        this.showToast('These items are already saved.', 'info')
        return
      }

      if (favoritesToAdd.length > 0) {
        this.cartItems.push(...favoritesToAdd)
      }
      saveItems(this.cartItems)

      const messages = []
      if (favoritesToAdd.length > 0) {
        const addedNames = favoritesToAdd.map(item => item.title)
        messages.push(
          addedNames.length <= 3
            ? `"${addedNames.join('", "')}" added`
            : `${addedNames.length} items added`,
        )
      }
      if (updatedCount > 0) {
        messages.push(`${updatedCount} updated`)
      }
      this.showToast(`${messages.join(', ')} to favorites.`, 'success')
    },

    hasMatchingFavoriteForCartItem(cartItem) {
      if (!cartItem || cartItem.isSaved) return false
      const cartSignature = getItemSignature(cartItem)
      return this.cartItems.some(
        item =>
          item.isSaved &&
          item.savedFrom === cartItem._id &&
          getItemSignature(item) === cartSignature,
      )
    },

    isCartGroupFullyFavorited(groupName) {
      const cartSignatures = getGroupSignatures(this.cartItems, false, groupName)
      if (cartSignatures.length === 0) return false

      const favoriteSignatures = new Set(getGroupSignatures(this.cartItems, true, groupName))
      return cartSignatures.every(signature => favoriteSignatures.has(signature))
    },

    editCartItem(id, { title, amount, unit, group }) {
      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return

      if (title !== undefined) cartItem.title = title
      if (amount !== undefined) cartItem.amount = amount
      if (unit !== undefined) cartItem.unit = unit
      if (group !== undefined) {
        cartItem.group = resolveGroupName(
          this.cartItems,
          this.customGroups,
          group,
          cartItem.isSaved,
        )
      }
      saveItems(this.cartItems)
    },

    togglePurchased(id) {
      const cartItem = this.cartItems.find(t => t._id === id)
      if (!cartItem) return
      cartItem.isPurchased = !cartItem.isPurchased
      saveItems(this.cartItems)
    },

    deleteCartItem(id) {
      this.cartItems = this.cartItems.filter(t => t._id !== id)
      saveItems(this.cartItems)
    },

    deleteAllCartItems() {
      this.cartItems = this.cartItems.filter(i => i.isSaved)
      this.customGroups = []
      this.groupOrder = []
      localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))
      localStorage.setItem('pinit_group_order', JSON.stringify(this.groupOrder))
      saveItems(this.cartItems)
    },

    addCustomGroup(name) {
      const subscriptionStore = useSubscriptionStore()
      if (!subscriptionStore.effectiveIsPro && this.groups.length >= FREE_LIMITS.groups) {
        subscriptionStore.openPaywall('cart-group-limit')
        return null
      }

      const resolved = resolveGroupName(this.cartItems, this.customGroups, name, false)
      const key = getGroupKey(resolved)
      const exists = this.customGroups.some(group => getGroupKey(group) === key)

      if (!exists) {
        this.customGroups.push(resolved)
        localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))
      }

      return resolved
    },

    groupExists(name) {
      const key = getGroupKey(name)
      return this.groups.some(group => getGroupKey(group) === key)
    },

    renameGroup(oldName, newName) {
      const trimmed = normalizeGroupName(newName)
      if (!trimmed) return

      const resolvedTarget = resolveGroupName(
        this.cartItems,
        this.customGroups,
        trimmed,
        false,
      )
      const oldKey = getGroupKey(oldName)
      const newKey = getGroupKey(resolvedTarget)

      this.cartItems.forEach(item => {
        if (!item.isSaved && getGroupKey(item.group || 'General') === oldKey) {
          item.group = resolvedTarget
        }
      })

      const filtered = this.customGroups.filter(g => getGroupKey(g) !== oldKey)
      if (!filtered.some(g => getGroupKey(g) === newKey)) {
        filtered.push(resolvedTarget)
      }
      this.customGroups = filtered
      localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))

      const orderIdx = this.groupOrder.indexOf(oldName)
      if (orderIdx !== -1) {
        this.groupOrder[orderIdx] = resolvedTarget
      }
      localStorage.setItem('pinit_group_order', JSON.stringify(this.groupOrder))
      saveItems(this.cartItems)
    },

    renameSavedGroup(oldName, newName) {
      const trimmed = normalizeGroupName(newName)
      if (!trimmed) return
      const oldKey = getGroupKey(oldName)
      const resolvedTarget = resolveGroupName(
        this.cartItems,
        [],
        trimmed,
        true,
      )

      this.cartItems.forEach(item => {
        if (item.isSaved && getGroupKey(item.group || 'General') === oldKey) {
          item.group = resolvedTarget
        }
      })

      saveItems(this.cartItems)
    },

    deleteSavedItem(savedItemId) {
      this.cartItems = this.cartItems.filter(i => i._id !== savedItemId)
      saveItems(this.cartItems)
      this.showToast('Saved item removed.', 'info')
    },

    deleteSavedGroup(groupName) {
      this.cartItems = this.cartItems.filter(i => !(i.isSaved && (i.group || 'General') === groupName))
      saveItems(this.cartItems)
    },

    deleteFavoriteRecipeTemplate(templateKey) {
      this.cartItems = this.cartItems.filter(item => {
        if (!item.isSaved) return true
        if (!(item.favoriteSource === 'recipe' || !!item.recipeMeta)) return true

        const meta = item.recipeMeta || {}
        const itemTemplateKey = meta.idMeal || `group:${item.group || 'Recipes'}`
        return itemTemplateKey !== templateKey
      })

      saveItems(this.cartItems)
    },

    deleteFavoriteFoodFactTemplate(foodFactKey) {
      this.cartItems = this.cartItems.filter(item => {
        if (!item.isSaved) return true
        if (!(item.favoriteSource === 'food-fact' || !!item.foodFactMeta)) return true

        const meta = item.foodFactMeta || {}
        const itemFoodKey = meta.key || `${meta.fdcId || 'no-id'}:${item.title || ''}`
        return itemFoodKey !== foodFactKey
      })

      saveItems(this.cartItems)
    },

    deleteGroup(groupName) {
      this.cartItems = this.cartItems.filter(i => i.isSaved || (i.group || 'General') !== groupName)
      this.customGroups = this.customGroups.filter(g => g !== groupName)
      localStorage.setItem('pinit_custom_groups', JSON.stringify(this.customGroups))
      saveItems(this.cartItems)
    },

    reorderItems(updates) {
      updates.forEach(({ id, order }) => {
        const item = this.cartItems.find(i => i._id === id)
        if (item) item.order = order
      })
      saveItems(this.cartItems)
    },

    moveItemToGroup(itemId, newGroup) {
      const item = this.cartItems.find(i => i._id === itemId)
      if (!item) return
      item.group = newGroup
      saveItems(this.cartItems)
    },

    clearCart() {
      this.cartItems = []
      this.customGroups = []
      this.groupOrder = []
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('pinit_custom_groups')
      localStorage.removeItem('pinit_group_order')
    },

    savePlace(place) {
      const subscriptionStore = useSubscriptionStore()
      if (!subscriptionStore.effectiveIsPro) {
        subscriptionStore.openPaywall('saved-places')
        return
      }

      const already = this.savedPlaces.some(p => Math.abs(p.lat - place.lat) < 0.0001 && Math.abs(p.lon - place.lon) < 0.0001)
      if (already) { this.showToast('Place already saved.', 'info'); return }
      this.savedPlaces.push({ id: generateId(), ...place, savedAt: Date.now() })
      localStorage.setItem('pinit_saved_places', JSON.stringify(this.savedPlaces))
      this.showToast('Place saved.', 'success')
    },

    deleteSavedPlace(id) {
      this.savedPlaces = this.savedPlaces.filter(p => p.id !== id)
      localStorage.setItem('pinit_saved_places', JSON.stringify(this.savedPlaces))
      this.showToast('Saved place removed.', 'info')
    },

    isPlaceSaved(lat, lon) {
      return this.savedPlaces.some(p => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lon - lon) < 0.0001)
    },
  }
})
