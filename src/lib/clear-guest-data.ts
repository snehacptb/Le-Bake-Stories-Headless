/**
 * Utility to clear all guest user data (cart, wishlist, etc.)
 * This should be called when you want to remove all guest data
 */

import { cartPersistence } from './cart-persistence'
import { wishlistPersistence } from './wishlist-persistence'

export function clearAllGuestData(): void {
  try {
    console.log('🧹 Clearing all guest data...')
    
    // Clear guest cart data
    cartPersistence.clearAllGuestData()
    
    // Clear guest wishlist data
    wishlistPersistence.clearAllGuestData()
    
    // Clear any other guest-specific localStorage data
    const guestDataKeys = Object.keys(localStorage).filter(key => 
      key.includes('-guest') || 
      key.includes('guest-') ||
      (key.startsWith('headless-wordpress-') && !key.includes('-user-')) ||
      key.startsWith('cart-token-guest') ||
      key.startsWith('woocommerce-cart-guest')
    )
    
    guestDataKeys.forEach(key => {
      localStorage.removeItem(key)
      console.log(`Cleared guest data: ${key}`)
    })
    
    console.log('✅ Successfully cleared all guest data')
  } catch (error) {
    console.error('❌ Failed to clear guest data:', error)
    throw error
  }
}

/**
 * Check if user is a guest (not authenticated)
 */
export function isGuestUser(): boolean {
  const token = localStorage.getItem('wc-auth-token')
  const userId = localStorage.getItem('wc-user-id')
  return !token || !userId
}

/**
 * Clear guest data if user is not authenticated
 */
export function clearGuestDataIfNotAuthenticated(): void {
  if (isGuestUser()) {
    console.log('User is not authenticated, clearing guest data...')
    clearAllGuestData()
  }
}
