/**
 * Wishlist Persistence Utility for User Session Management
 * 
 * This utility handles:
 * 1. User-specific wishlist storage and isolation
 * 2. Guest vs authenticated user wishlist management
 * 3. Wishlist migration when authentication changes
 * 4. Data cleanup and maintenance
 */

import { WishlistItem } from '@/contexts/wishlist-context'

export class WishlistPersistence {
  private static instance: WishlistPersistence
  private readonly WISHLIST_PREFIX = 'headless-wordpress-wishlist'
  
  static getInstance(): WishlistPersistence {
    if (!WishlistPersistence.instance) {
      WishlistPersistence.instance = new WishlistPersistence()
    }
    return WishlistPersistence.instance
  }

  /**
   * Generate user-specific storage key
   */
  private getStorageKey(userId?: number | string): string {
    const userSuffix = userId ? `user-${userId}` : 'guest'
    return `${this.WISHLIST_PREFIX}-${userSuffix}`
  }

  /**
   * Get wishlist items for current user context
   */
  getWishlistItems(userId?: number | string): WishlistItem[] {
    try {
      const storageKey = this.getStorageKey(userId)
      const storedWishlist = localStorage.getItem(storageKey)
      
      if (storedWishlist) {
        const parsedWishlist: WishlistItem[] = JSON.parse(storedWishlist)
        console.log(`Loaded ${parsedWishlist.length} wishlist items for ${userId ? `user ${userId}` : 'guest'}`)
        return Array.isArray(parsedWishlist) ? parsedWishlist : []
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error)
      // Clear corrupted data
      this.clearWishlistData(userId)
    }
    
    return []
  }

  /**
   * Save wishlist items for current user context
   */
  saveWishlistItems(items: WishlistItem[], userId?: number | string): void {
    try {
      const storageKey = this.getStorageKey(userId)
      localStorage.setItem(storageKey, JSON.stringify(items))
      console.log(`Saved ${items.length} wishlist items for ${userId ? `user ${userId}` : 'guest'}`)
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error)
    }
  }

  /**
   * Clear wishlist data for a specific user
   */
  clearWishlistData(userId?: number | string): void {
    try {
      const storageKey = this.getStorageKey(userId)
      localStorage.removeItem(storageKey)
      console.log(`Cleared wishlist data for ${userId ? `user ${userId}` : 'guest'}`)
    } catch (error) {
      console.warn('Failed to clear wishlist data from localStorage:', error)
    }
  }

  /**
   * Migrate wishlist data when user authentication changes
   */
  migrateWishlistOnAuthChange(fromUserId?: number | string, toUserId?: number | string): WishlistItem[] {
    try {
      // Get wishlist data from the previous user context
      const fromWishlistData = this.getWishlistItems(fromUserId)
      
      if (fromWishlistData.length > 0) {
        console.log(`Migrating ${fromWishlistData.length} wishlist items from ${fromUserId ? `user ${fromUserId}` : 'guest'} to ${toUserId ? `user ${toUserId}` : 'guest'}`)
        
        // Get existing wishlist data for the target user
        const toWishlistData = this.getWishlistItems(toUserId)
        
        // Merge wishlists, avoiding duplicates
        const mergedWishlist = this.mergeWishlists(toWishlistData, fromWishlistData)
        
        // Save merged wishlist to new user context
        this.saveWishlistItems(mergedWishlist, toUserId)
        
        // Clear old user context if it was a guest wishlist
        if (!fromUserId) {
          this.clearWishlistData(fromUserId)
        }
        
        return mergedWishlist
      }
    } catch (error) {
      console.warn('Failed to migrate wishlist data:', error)
    }
    
    return this.getWishlistItems(toUserId)
  }

  /**
   * Merge two wishlists, avoiding duplicates
   */
  private mergeWishlists(existingItems: WishlistItem[], newItems: WishlistItem[]): WishlistItem[] {
    const merged = [...existingItems]
    
    newItems.forEach(newItem => {
      const exists = merged.some(existingItem => existingItem.id === newItem.id)
      if (!exists) {
        merged.push(newItem)
      }
    })
    
    return merged
  }

  /**
   * Check if a product is in the wishlist for a specific user
   */
  isProductInWishlist(productId: number, userId?: number | string): boolean {
    const wishlistItems = this.getWishlistItems(userId)
    return wishlistItems.some(item => item.id === productId)
  }

  /**
   * Add product to wishlist for a specific user
   */
  addToWishlist(item: WishlistItem, userId?: number | string): WishlistItem[] {
    const currentItems = this.getWishlistItems(userId)
    
    // Check if item already exists
    const exists = currentItems.some(existingItem => existingItem.id === item.id)
    if (exists) {
      return currentItems
    }
    
    const updatedItems = [...currentItems, item]
    this.saveWishlistItems(updatedItems, userId)
    return updatedItems
  }

  /**
   * Remove product from wishlist for a specific user
   */
  removeFromWishlist(productId: number, userId?: number | string): WishlistItem[] {
    const currentItems = this.getWishlistItems(userId)
    const updatedItems = currentItems.filter(item => item.id !== productId)
    this.saveWishlistItems(updatedItems, userId)
    return updatedItems
  }

  /**
   * Get wishlist count for a specific user
   */
  getWishlistCount(userId?: number | string): number {
    return this.getWishlistItems(userId).length
  }

  /**
   * Clean up old wishlist data (useful for maintenance)
   */
  cleanupOldWishlists(): void {
    try {
      const keysToRemove: string[] = []
      
      // Check all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.WISHLIST_PREFIX)) {
          // You could add logic here to remove wishlists older than X days
          // For now, we'll just log them
          console.log('Found wishlist storage key:', key)
        }
      }
      
      // Remove identified old keys
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old wishlist storage keys`)
      }
    } catch (error) {
      console.warn('Failed to cleanup old wishlist data:', error)
    }
  }

  /**
   * Debug: Log all wishlist-related storage
   */
  debugWishlistStorage(): void {
    try {
      console.group('Wishlist Storage Debug')
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.WISHLIST_PREFIX)) {
          const value = localStorage.getItem(key)
          console.log(`${key}:`, value)
        }
      }
      
      console.groupEnd()
    } catch (error) {
      console.warn('Failed to debug wishlist storage:', error)
    }
  }

  /**
   * Clear all guest wishlist data (for guest users only)
   */
  clearAllGuestData(): void {
    try {
      this.clearWishlistData() // Clear guest wishlist (undefined userId = guest)
      console.log('Cleared all guest wishlist data')
    } catch (error) {
      console.warn('Failed to clear guest wishlist data:', error)
    }
  }

  /**
   * Get all user-specific wishlist keys (for debugging)
   */
  getAllWishlistKeys(): string[] {
    const keys: string[] = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.WISHLIST_PREFIX)) {
          keys.push(key)
        }
      }
    } catch (error) {
      console.warn('Failed to get wishlist keys:', error)
    }
    
    return keys
  }
}

// Export singleton instance
export const wishlistPersistence = WishlistPersistence.getInstance()
