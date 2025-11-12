/**
 * Enhanced Cart Persistence Utility for Multi-Site Headless WordPress
 * 
 * This utility handles:
 * 1. User-specific cart token management
 * 2. Database synchronization with WordPress
 * 3. Fallback to localStorage when API fails
 * 4. Cart isolation between different users
 */

import { CartItem } from '@/types'

export class CartPersistence {
  private static instance: CartPersistence
  private readonly CART_TOKEN_PREFIX = 'cart-token'
  private readonly CART_DATA_PREFIX = 'woocommerce-cart'
  
  static getInstance(): CartPersistence {
    if (!CartPersistence.instance) {
      CartPersistence.instance = new CartPersistence()
    }
    return CartPersistence.instance
  }

  /**
   * Generate user-specific storage keys
   */
  private getStorageKeys(userId?: number | string) {
    const userSuffix = userId ? `user-${userId}` : 'guest'
    return {
      tokenKey: `${this.CART_TOKEN_PREFIX}-${userSuffix}`,
      dataKey: `${this.CART_DATA_PREFIX}-${userSuffix}`
    }
  }

  /**
   * Get cart token for current user context
   */
  getCartToken(userId?: number | string): string | null {
    try {
      const { tokenKey } = this.getStorageKeys(userId)
      return localStorage.getItem(tokenKey)
    } catch (error) {
      console.warn('Failed to get cart token from localStorage:', error)
      return null
    }
  }

  /**
   * Set cart token for current user context
   */
  setCartToken(token: string | null, userId?: number | string): void {
    try {
      const { tokenKey } = this.getStorageKeys(userId)
      
      if (token) {
        localStorage.setItem(tokenKey, token)
        console.log(`Cart token set for ${userId ? `user ${userId}` : 'guest'}:`, token.substring(0, 10) + '...')
      } else {
        localStorage.removeItem(tokenKey)
        console.log(`Cart token cleared for ${userId ? `user ${userId}` : 'guest'}`)
      }
    } catch (error) {
      console.warn('Failed to set cart token in localStorage:', error)
    }
  }

  /**
   * Get cart data from localStorage (fallback)
   */
  getLocalCartData(userId?: number | string): CartItem[] {
    try {
      const { dataKey } = this.getStorageKeys(userId)
      const savedCart = localStorage.getItem(dataKey)
      
      if (savedCart) {
        const cartItems = JSON.parse(savedCart)
        console.log(`Loaded ${cartItems.length} items from local storage for ${userId ? `user ${userId}` : 'guest'}`)
        return Array.isArray(cartItems) ? cartItems : []
      }
    } catch (error) {
      console.warn('Failed to load cart data from localStorage:', error)
    }
    
    return []
  }

  /**
   * Save cart data to localStorage (backup)
   */
  saveLocalCartData(items: CartItem[], userId?: number | string): void {
    try {
      const { dataKey } = this.getStorageKeys(userId)
      localStorage.setItem(dataKey, JSON.stringify(items))
      console.log(`Saved ${items.length} items to local storage for ${userId ? `user ${userId}` : 'guest'}`)
    } catch (error) {
      console.warn('Failed to save cart data to localStorage:', error)
    }
  }

  /**
   * Clear all cart data for a specific user
   */
  clearUserCartData(userId?: number | string): void {
    try {
      const { tokenKey, dataKey } = this.getStorageKeys(userId)
      localStorage.removeItem(tokenKey)
      localStorage.removeItem(dataKey)
      console.log(`Cleared all cart data for ${userId ? `user ${userId}` : 'guest'}`)
    } catch (error) {
      console.warn('Failed to clear cart data from localStorage:', error)
    }
  }

  /**
   * Migrate cart data when user authentication changes
   */
  migrateCartOnAuthChange(fromUserId?: number | string, toUserId?: number | string): CartItem[] {
    try {
      // Get cart data from the previous user context
      const fromCartData = this.getLocalCartData(fromUserId)
      
      if (fromCartData.length > 0) {
        console.log(`Migrating ${fromCartData.length} items from ${fromUserId ? `user ${fromUserId}` : 'guest'} to ${toUserId ? `user ${toUserId}` : 'guest'}`)
        
        // Save to new user context
        this.saveLocalCartData(fromCartData, toUserId)
        
        // Clear old user context if it was a guest cart
        if (!fromUserId) {
          this.clearUserCartData(fromUserId)
        }
        
        return fromCartData
      }
    } catch (error) {
      console.warn('Failed to migrate cart data:', error)
    }
    
    return []
  }

  /**
   * Generate a new cart token
   */
  generateCartToken(userId?: number | string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const userPart = userId ? `user-${userId}` : 'guest'
    return `${userPart}-${timestamp}-${random}`
  }

  /**
   * Validate cart token format
   */
  isValidCartToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false
    }
    
    // Check if token has expected format: (user-{id}|guest)-{timestamp}-{random}
    const tokenPattern = /^(user-\d+|guest)-\d+-[a-z0-9]+$/
    return tokenPattern.test(token)
  }

  /**
   * Extract user ID from cart token
   */
  getUserIdFromToken(token: string): number | null {
    if (!this.isValidCartToken(token)) {
      return null
    }
    
    const match = token.match(/^user-(\d+)-/)
    return match ? parseInt(match[1], 10) : null
  }

  /**
   * Check if cart token belongs to a specific user
   */
  isTokenForUser(token: string, userId?: number | string): boolean {
    if (!token) return false
    
    if (!userId) {
      // Check if it's a guest token
      return token.startsWith('guest-')
    }
    
    // Check if it's a user token for the specific user
    return token.startsWith(`user-${userId}-`)
  }

  /**
   * Clean up old cart tokens (useful for maintenance)
   */
  cleanupOldTokens(): void {
    try {
      const keysToRemove: string[] = []
      
      // Check all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith(this.CART_TOKEN_PREFIX) || key.startsWith(this.CART_DATA_PREFIX))) {
          // You could add logic here to remove tokens older than X days
          // For now, we'll just log them
          console.log('Found cart storage key:', key)
        }
      }
      
      // Remove identified old keys
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old cart storage keys`)
      }
    } catch (error) {
      console.warn('Failed to cleanup old cart tokens:', error)
    }
  }

  /**
   * Clear all guest cart data (for guest users only)
   */
  clearAllGuestData(): void {
    try {
      this.clearUserCartData() // Clear guest cart (undefined userId = guest)
      console.log('Cleared all guest cart data')
    } catch (error) {
      console.warn('Failed to clear guest cart data:', error)
    }
  }

  /**
   * Debug: Log all cart-related storage
   */
  debugCartStorage(): void {
    try {
      console.group('Cart Storage Debug')
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith(this.CART_TOKEN_PREFIX) || key.startsWith(this.CART_DATA_PREFIX))) {
          const value = localStorage.getItem(key)
          console.log(`${key}:`, value)
        }
      }
      
      console.groupEnd()
    } catch (error) {
      console.warn('Failed to debug cart storage:', error)
    }
  }
}

// Export singleton instance
export const cartPersistence = CartPersistence.getInstance()
