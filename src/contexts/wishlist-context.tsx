'use client'

import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react'
import { WooCommerceProduct } from '@/types'
import { wishlistPersistence } from '@/lib/wishlist-persistence'
import { useAuth } from './auth-context'

// Wishlist item interface
interface WishlistItem {
  id: number
  product: WooCommerceProduct
  addedAt: string
}

// Wishlist state interface
interface WishlistState {
  items: WishlistItem[]
  isLoading: boolean
  isHydrated: boolean
}

// Wishlist actions
type WishlistAction =
  | { type: 'ADD_TO_WISHLIST'; payload: WooCommerceProduct }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: number }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'HYDRATE_WISHLIST'; payload: WishlistItem[] }
  | { type: 'SET_HYDRATED'; payload: boolean }

// Wishlist context interface
interface WishlistContextType {
  state: WishlistState
  addToWishlist: (product: WooCommerceProduct) => void
  removeFromWishlist: (productId: number) => void
  clearWishlist: () => void
  clearGuestWishlist: () => void
  isInWishlist: (productId: number) => boolean
  getWishlistCount: () => number
  getWishlistItems: () => WishlistItem[]
}

// Initial state
const initialState: WishlistState = {
  items: [],
  isLoading: false,
  isHydrated: false,
}

// Wishlist reducer
function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'ADD_TO_WISHLIST': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      if (existingItem) {
        return state // Item already in wishlist
      }
      
      const newItem: WishlistItem = {
        id: action.payload.id,
        product: action.payload,
        addedAt: new Date().toISOString(),
      }
      
      return {
        ...state,
        items: [...state.items, newItem],
      }
    }
    
    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      }
    
    case 'CLEAR_WISHLIST':
      return {
        ...state,
        items: [],
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    
    case 'HYDRATE_WISHLIST':
      return {
        ...state,
        items: action.payload,
      }
    
    case 'SET_HYDRATED':
      return {
        ...state,
        isHydrated: action.payload,
      }
    
    default:
      return state
  }
}

// Create context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

// Wishlist provider props
interface WishlistProviderProps {
  children: ReactNode
}

// Local storage key
const WISHLIST_STORAGE_KEY = 'headless-wordpress-wishlist'

// Wishlist provider component
export function WishlistProvider({ children }: WishlistProviderProps) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState)
  const { user, isAuthenticated } = useAuth()

  // Get current user ID for wishlist operations
  const getCurrentUserId = () => {
    return isAuthenticated && user?.id ? user.id : undefined
  }

  // Load wishlist from user-specific storage on mount and when user changes
  useEffect(() => {
    const loadWishlistFromStorage = () => {
      try {
        const userId = getCurrentUserId()
        console.log('Loading wishlist for:', userId ? `user ${userId}` : 'guest')
        
        const storedWishlist = wishlistPersistence.getWishlistItems(userId)
        dispatch({ type: 'HYDRATE_WISHLIST', payload: storedWishlist })
      } catch (error) {
        console.error('Error loading wishlist from storage:', error)
        // Clear corrupted data
        wishlistPersistence.clearWishlistData(getCurrentUserId())
      } finally {
        dispatch({ type: 'SET_HYDRATED', payload: true })
      }
    }

    loadWishlistFromStorage()
  }, [user?.id, isAuthenticated])

  // Handle user authentication changes - migrate wishlist data
  useEffect(() => {
    // Skip if wishlist hasn't hydrated yet - initial load is handled separately
    if (!state.isHydrated) {
      return
    }

    // Track previous user ID using a ref or localStorage check
    let previousUserWasGuest = false
    const currentUserId = getCurrentUserId()
    
    // Check if we had a guest wishlist before
    const guestWishlist = wishlistPersistence.getWishlistItems() // Check guest storage
    previousUserWasGuest = guestWishlist.length > 0 && !currentUserId

    const handleAuthChange = () => {
      console.log('Handling wishlist auth change:', { 
        previousUserWasGuest,
        currentUser: currentUserId,
        isAuthenticated,
        hasGuestItems: guestWishlist.length > 0,
        hasCurrentItems: state.items.length > 0
      })
      
      // If user is logging in (transitioning from guest to authenticated)
      if (currentUserId && isAuthenticated) {
        console.log('💝 User logging in, checking for saved wishlist')
        // Get existing user wishlist from storage
        const userWishlist = wishlistPersistence.getWishlistItems(currentUserId)
        
        // If there's a saved wishlist, restore it
        if (userWishlist.length > 0) {
          console.log('💝 Found saved wishlist for user:', userWishlist.length, 'items')
          dispatch({ type: 'HYDRATE_WISHLIST', payload: userWishlist })
        }
        
        // Also migrate guest wishlist if exists
        if (guestWishlist.length > 0) {
          console.log('💝 Migrating guest wishlist to user wishlist on login')
          // Merge wishlists (avoid duplicates)
          const mergedWishlist = [...userWishlist]
          guestWishlist.forEach(item => {
            if (!mergedWishlist.some(existing => existing.id === item.id)) {
              mergedWishlist.push(item)
            }
          })
          
          // Save merged wishlist to user context
          wishlistPersistence.saveWishlistItems(mergedWishlist, currentUserId)
          
          // Clear guest wishlist
          wishlistPersistence.clearWishlistData()
          
          // Update state with merged wishlist
          dispatch({ type: 'HYDRATE_WISHLIST', payload: mergedWishlist })
          return
        }
        
        // If no guest wishlist but user wishlist exists, it's already loaded above
        if (userWishlist.length > 0) {
          return
        }
      }
      
      // If user context changed, load wishlist for the new user
      // Check if current state items match current user storage
      const storageItems = wishlistPersistence.getWishlistItems(currentUserId)
      if (storageItems.length !== state.items.length || 
          storageItems.some((item, idx) => item.id !== state.items[idx]?.id)) {
        // Load wishlist for the new user context
        setTimeout(() => {
          const wishlistItems = wishlistPersistence.getWishlistItems(currentUserId)
          console.log('💝 Loading wishlist for user context:', wishlistItems.length, 'items')
          dispatch({ type: 'HYDRATE_WISHLIST', payload: wishlistItems })
        }, 150) // Small delay to ensure auth state is settled
      }
    }

    handleAuthChange()
  }, [user?.id, isAuthenticated, state.isHydrated])

  // Save wishlist to user-specific storage whenever items change (but only after hydration)
  useEffect(() => {
    if (state.isHydrated) {
      try {
        const userId = getCurrentUserId()
        wishlistPersistence.saveWishlistItems(state.items, userId)
      } catch (error) {
        console.error('Error saving wishlist to storage:', error)
      }
    }
  }, [state.items, state.isHydrated, user?.id])

  // Add product to wishlist
  const addToWishlist = (product: WooCommerceProduct) => {
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product })
  }

  // Remove product from wishlist
  const removeFromWishlist = (productId: number) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId })
  }

  // Clear entire wishlist
  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' })
  }

  // Clear guest wishlist specifically (used on logout)
  const clearGuestWishlist = () => {
    console.log('Clearing guest wishlist on logout')
    wishlistPersistence.clearWishlistData() // Clear guest data
    dispatch({ type: 'CLEAR_WISHLIST' })
  }

  // Check if product is in wishlist
  const isInWishlist = (productId: number): boolean => {
    return state.items.some(item => item.id === productId)
  }

  // Get wishlist count
  const getWishlistCount = (): number => {
    return state.items.length
  }

  // Get all wishlist items
  const getWishlistItems = (): WishlistItem[] => {
    return state.items
  }

  // Memoize context value - only recreate when state changes
  // Functions are stable (they just dispatch), so only state matters for reactivity
  const contextValue: WishlistContextType = useMemo(() => ({
    state,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    clearGuestWishlist,
    isInWishlist,
    getWishlistCount,
    getWishlistItems,
  }), [state]) // Only depend on state - functions are stable dispatch wrappers

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  )
}

// Custom hook to use wishlist context
export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

// Export types for external use
export type { WishlistItem, WishlistState }
