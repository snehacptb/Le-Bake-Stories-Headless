'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { CartItem, WooCommerceProduct, AppliedCoupon, CartTotals, CouponValidationResult } from '@/types'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { cartPersistence } from '@/lib/cart-persistence'
import { cartOperationQueue } from '@/lib/cart-operation-queue'
import { useAuth } from './auth-context'
import { useWooCommerce } from './woocommerce-context'

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isLoading: boolean
  isHydrated: boolean
  error: string | null
  cartToken: string | null
  needsSync: boolean
  appliedCoupons: AppliedCoupon[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  shippingTotal: number
  // Connection retry state
  retryCount: number
  // Individual loading states for better UX
  loadingStates: {
    addingToCart: boolean
    updatingItem: string | null
    removingItem: string | null
    clearingCart: boolean
    applyingCoupon: boolean
    removingCoupon: string | null
  }
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_HYDRATED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: { items: CartItem[]; cartToken?: string; totals?: CartTotals; coupons?: AppliedCoupon[] } }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { key: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART_TOKEN'; payload: string | null }
  | { type: 'SET_NEEDS_SYNC'; payload: boolean }
  | { type: 'ADD_COUPON'; payload: AppliedCoupon }
  | { type: 'REMOVE_COUPON'; payload: string }
  | { type: 'UPDATE_TOTALS'; payload: CartTotals }
  | { type: 'SET_ADDING_TO_CART'; payload: boolean }
  | { type: 'SET_UPDATING_ITEM'; payload: string | null }
  | { type: 'SET_REMOVING_ITEM'; payload: string | null }
  | { type: 'SET_CLEARING_CART'; payload: boolean }
  | { type: 'SET_APPLYING_COUPON'; payload: boolean }
  | { type: 'SET_REMOVING_COUPON'; payload: string | null }
  | { type: 'INCREMENT_RETRY_COUNT' }
  | { type: 'RESET_RETRY_COUNT' }

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  isHydrated: false,
  error: null,
  cartToken: null,
  needsSync: false,
  appliedCoupons: [],
  subtotal: 0,
  discountTotal: 0,
  taxTotal: 0,
  shippingTotal: 0,
  retryCount: 0,
  loadingStates: {
    addingToCart: false,
    updatingItem: null,
    removingItem: null,
    clearingCart: false,
    applyingCoupon: false,
    removingCoupon: null,
  },
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_HYDRATED':
      return { ...state, isHydrated: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_CART':
      const subtotal = action.payload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = action.payload.items.reduce((sum, item) => sum + item.quantity, 0)
      const totals = action.payload.totals || {
        subtotal,
        discountTotal: 0,
        taxTotal: 0,
        shippingTotal: 0,
        total: subtotal
      }
      return {
        ...state,
        items: action.payload.items,
        total: totals.total,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        shippingTotal: totals.shippingTotal,
        itemCount,
        cartToken: action.payload.cartToken || state.cartToken,
        appliedCoupons: action.payload.coupons || [],
        isLoading: false,
        isHydrated: true,
        error: null,
        needsSync: false,
      }
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id)
      let newItems: CartItem[]
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        newItems = [...state.items, action.payload]
      }
      
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
      }
    case 'UPDATE_ITEM':
      const updatedItems = state.items.map(item =>
        item.key === action.payload.key
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0)
      
      const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const updatedItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return {
        ...state,
        items: updatedItems,
        total: updatedTotal,
        itemCount: updatedItemCount,
      }
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.key !== action.payload)
      const filteredTotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const filteredItemCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return {
        ...state,
        items: filteredItems,
        total: filteredTotal,
        itemCount: filteredItemCount,
      }
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        shippingTotal: 0,
        appliedCoupons: [],
        needsSync: true,
        // Don't modify isLoading or error here - let the calling code handle that
      }
    case 'SET_CART_TOKEN':
      return {
        ...state,
        cartToken: action.payload,
      }
    case 'SET_NEEDS_SYNC':
      return {
        ...state,
        needsSync: action.payload,
      }
    case 'ADD_COUPON':
      return {
        ...state,
        appliedCoupons: [...state.appliedCoupons, action.payload],
      }
    case 'REMOVE_COUPON':
      return {
        ...state,
        appliedCoupons: state.appliedCoupons.filter(coupon => coupon.code !== action.payload),
      }
    case 'UPDATE_TOTALS':
      return {
        ...state,
        subtotal: action.payload.subtotal,
        discountTotal: action.payload.discountTotal,
        taxTotal: action.payload.taxTotal,
        shippingTotal: action.payload.shippingTotal,
        total: action.payload.total,
      }
    case 'SET_ADDING_TO_CART':
      return {
        ...state,
        loadingStates: { ...state.loadingStates, addingToCart: action.payload }
      }
    case 'SET_UPDATING_ITEM':
      return {
        ...state,
        loadingStates: { ...state.loadingStates, updatingItem: action.payload }
      }
    case 'SET_REMOVING_ITEM':
      return {
        ...state,
        loadingStates: { ...state.loadingStates, removingItem: action.payload }
      }
    case 'SET_CLEARING_CART':
      return {
        ...state,
        loadingStates: { ...state.loadingStates, clearingCart: action.payload }
      }
    case 'SET_APPLYING_COUPON':
      return {
        ...state,
        loadingStates: { ...state.loadingStates, applyingCoupon: action.payload }
      }
    case 'SET_REMOVING_COUPON':
      return {
        ...state,
        loadingStates: { ...state.loadingStates, removingCoupon: action.payload }
      }
    case 'INCREMENT_RETRY_COUNT':
      return {
        ...state,
        retryCount: state.retryCount + 1
      }
    case 'RESET_RETRY_COUNT':
      return {
        ...state,
        retryCount: 0
      }
    default:
      return state
  }
}

interface CartContextType extends CartState {
  addToCart: (product: WooCommerceProduct, quantity?: number) => Promise<void | unknown>
  updateCartItem: (key: string, quantity: number) => Promise<void | unknown>
  removeFromCart: (key: string) => Promise<void | unknown>
  clearCart: () => Promise<void | unknown>
  refreshCart: () => Promise<void>
  syncWithServer: () => Promise<void>
  applyCoupon: (code: string) => Promise<void | unknown>
  removeCoupon: (code: string) => Promise<void | unknown>
  validateCoupon: (code: string) => Promise<CouponValidationResult>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { user, isAuthenticated } = useAuth()
  const { isAvailable: isWooCommerceAvailable, isLoading: isWooCommerceLoading } = useWooCommerce()

  // Get current user ID for cart operations
  const getCurrentUserId = () => {
    return isAuthenticated && user?.id ? user.id : undefined
  }

  // Get cart token for current user using persistence utility
  const getCartToken = () => {
    return cartPersistence.getCartToken(getCurrentUserId())
  }

  // Set cart token for current user using persistence utility
  const setCartToken = (token: string | null) => {
    cartPersistence.setCartToken(token, getCurrentUserId())
    dispatch({ type: 'SET_CART_TOKEN', payload: token })
    
    // Log token change for debugging
    console.log(`Cart token ${token ? 'set' : 'cleared'} for ${getCurrentUserId() ? `user ${getCurrentUserId()}` : 'guest'}`, 
                token ? token.substring(0, 10) + '...' : 'null')
  }

  // Load cart from WooCommerce Store API
  const loadCartFromServer = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Skip if WooCommerce is not available
      if (!isWooCommerceAvailable) {
        console.warn('Skipping cart load: WooCommerce is not available')
        // Load local cart data as fallback
        const localCartData = cartPersistence.getLocalCartData(getCurrentUserId())
        if (localCartData.length > 0) {
          const localTotal = localCartData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          dispatch({ 
            type: 'SET_CART', 
            payload: { 
              items: localCartData,
              totals: {
                subtotal: localTotal,
                discountTotal: 0,
                taxTotal: 0,
                shippingTotal: 0,
                total: localTotal
              }
            } 
          })
        }
        return true // Return true to indicate successful initialization (using local data)
      }
      
      // Skip if WooCommerce base URL is not configured
      if (!process.env.NEXT_PUBLIC_WORDPRESS_URL) {
        console.warn('Skipping cart load: NEXT_PUBLIC_WORDPRESS_URL not configured')
        // Return true to indicate successful initialization (no server to connect to)
        return true
      }
      const cartToken = getCartToken()
      console.log('Loading cart from server with token:', cartToken ? cartToken.substring(0, 10) + '...' : 'null')
      
      const cartData = await woocommerceApi.getCart(cartToken || undefined)
      console.log('Server cart data received:', cartData)
      console.log('Coupons in cart data:', cartData.coupons)
      console.log('Totals in cart data:', cartData.totals)
      
      if (cartData && cartData.items) {
        // Convert WooCommerce cart format to our CartItem format
        const items: CartItem[] = cartData.items?.map((item: any) => ({
          key: item.key,
          id: item.id,
          quantity: item.quantity,
          name: item.name,
          price: parseFloat(item.prices?.price || '0') / 100, // WC stores in cents
          image: item.images?.[0]?.src || '',
          slug: item.slug || '',
        })) || []

        // Parse coupon data from WooCommerce cart
        console.log('Raw coupons data:', cartData.coupons)
        const appliedCoupons: AppliedCoupon[] = cartData.coupons?.map((coupon: any) => {
          console.log('Processing coupon:', coupon)
          // Woo API returns totals values in cents, but coupon.amount is in store currency units
          const centsValue = coupon.totals?.total_discount || coupon.totals?.discount || coupon.totals?.currency_discount
          const discountTotal = centsValue !== undefined && centsValue !== null
            ? parseFloat(centsValue) / 100
            : parseFloat(coupon.amount || '0') // already in currency units
          return {
            code: coupon.code,
            discount_type: coupon.discount_type || 'fixed_cart',
            amount: (coupon.amount ?? (discountTotal > 0 ? String(discountTotal) : '0')),
            discount_total: isNaN(discountTotal) ? 0 : discountTotal,
            discount_tax: parseFloat(coupon.totals?.discount_tax || '0') / 100,
          }
        }) || []
        console.log('Parsed applied coupons:', appliedCoupons)

        // Parse totals from WooCommerce cart
        console.log('Raw totals data:', cartData.totals)
        console.log('All totals fields:', Object.keys(cartData.totals || {}))
        
        // Calculate discount from coupons if total_discount is not available
        let discountAmount = 0
        
        // Log all possible discount fields for debugging
        console.log('Checking discount fields:', {
          total_discount: cartData.totals?.total_discount,
          total_coupon_discount: cartData.totals?.total_coupon_discount,
          discount_total: cartData.totals?.discount_total,
          coupon_discount: cartData.totals?.coupon_discount,
          coupons_count: cartData.coupons?.length || 0
        })
        
        if (cartData.totals?.total_discount && cartData.totals.total_discount !== '0') {
          discountAmount = parseFloat(cartData.totals.total_discount) / 100
          console.log('Using total_discount:', discountAmount)
        } else if (cartData.totals?.total_coupon_discount && cartData.totals.total_coupon_discount !== '0') {
          discountAmount = parseFloat(cartData.totals.total_coupon_discount) / 100
          console.log('Using total_coupon_discount:', discountAmount)
        } else if (cartData.totals?.discount_total && cartData.totals.discount_total !== '0') {
          discountAmount = parseFloat(cartData.totals.discount_total) / 100
          console.log('Using discount_total:', discountAmount)
        } else if (cartData.coupons && cartData.coupons.length > 0) {
          // Sum up individual coupon discounts
          console.log('Calculating from individual coupons:', cartData.coupons)
          discountAmount = cartData.coupons.reduce((sum: number, coupon: any) => {
            console.log('Coupon object:', coupon)
            console.log('Coupon totals:', coupon.totals)
            const couponDiscount = parseFloat(coupon.totals?.total_discount || coupon.totals?.discount || coupon.totals?.currency_discount || '0') / 100
            console.log(`Coupon ${coupon.code} discount:`, couponDiscount)
            return sum + couponDiscount
          }, 0)
          console.log('Sum of individual coupon discounts:', discountAmount)
        }
        console.log('Final calculated discount total:', discountAmount)
        
        const totals: CartTotals = {
          subtotal: parseFloat(cartData.totals?.total_items || cartData.totals?.subtotal || '0') / 100,
          discountTotal: discountAmount,
          taxTotal: parseFloat(cartData.totals?.total_tax || '0') / 100,
          shippingTotal: parseFloat(cartData.totals?.total_shipping || '0') / 100,
          total: parseFloat(cartData.totals?.total_price || '0') / 100,
        }
        console.log('Parsed totals:', totals)

        console.log(`Successfully loaded ${items.length} items and ${appliedCoupons.length} coupons from server cart`)
        
        dispatch({ 
          type: 'SET_CART', 
          payload: { 
            items, 
            cartToken: cartData.cart_token || cartToken,
            totals,
            coupons: appliedCoupons
          } 
        })

        // Update stored cart token if we got a new one
        if (cartData.cart_token && cartData.cart_token !== cartToken) {
          setCartToken(cartData.cart_token)
        }
        
        // Save cart data locally as backup
        cartPersistence.saveLocalCartData(items, getCurrentUserId())
        
        // Clear any error state
        dispatch({ type: 'SET_ERROR', payload: null })
        return true // Indicate success
      } else {
        console.warn('No cart data or items received from server')
        return false
      }
    } catch (error: any) {
      console.error('Error loading cart from server:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      
      // Provide helpful error messages based on error type
      if (error.code === 'ERR_CERT_AUTHORITY_INVALID') {
        console.error('🔒 SSL Certificate Error: Your WordPress site is using HTTPS with a self-signed certificate.')
        console.error('💡 Solution: Use HTTP for development or accept the certificate in your browser.')
        console.error('📖 See TROUBLESHOOTING.md for detailed instructions.')
      } else if (error.code === 'ERR_NETWORK') {
        console.error('🌐 Network Error: Cannot connect to WordPress server.')
        console.error('💡 Check that your WordPress site is running and accessible.')
        console.error('🔗 WordPress URL:', process.env.NEXT_PUBLIC_WORDPRESS_URL)
      } else if (error.response?.status === 401) {
        console.error('🔑 Authentication Error: WooCommerce API credentials are invalid.')
        console.error('💡 Check your NEXT_PUBLIC_WC_CONSUMER_KEY and NEXT_PUBLIC_WC_CONSUMER_SECRET.')
      } else if (error.response?.status === 404) {
        console.error('🔍 Not Found Error: WooCommerce Store API endpoint not found.')
        console.error('💡 Ensure WooCommerce is installed and Store API is enabled.')
      }
      
      // No fallback - let the error propagate
      return false
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }


  // Initialize cart on mount and when user changes
  useEffect(() => {
    const initializeCart = async () => {
      // console.log('🔄 Initializing cart...', { 
      //   userId: getCurrentUserId(), 
      //   isAuthenticated, 
      //   retryCount: state.retryCount,
      //   hasWordPressUrl: !!process.env.NEXT_PUBLIC_WORDPRESS_URL 
      // })
      
      const success = await loadCartFromServer()
      // console.log('📦 Cart loading result:', { success })
      
      // Only set hydrated to true if we successfully loaded cart data or if there's no WordPress URL configured
      // This prevents showing "empty cart" message when there's a connection issue
      if (success || !process.env.NEXT_PUBLIC_WORDPRESS_URL) {
        // console.log('✅ Cart initialized successfully')
        dispatch({ type: 'SET_HYDRATED', payload: true })
        dispatch({ type: 'RESET_RETRY_COUNT' })
      } else {
        // If loading failed, try again with exponential backoff (max 3 retries)
        const maxRetries = 3
        if (state.retryCount < maxRetries) {
          // console.log(`🔄 Retrying cart load (attempt ${state.retryCount + 1}/${maxRetries})`)
          dispatch({ type: 'INCREMENT_RETRY_COUNT' })
          const delay = Math.pow(2, state.retryCount) * 1000 // 1s, 2s, 4s
          setTimeout(() => {
            initializeCart()
          }, delay)
        } else {
          // After max retries, check if we have any local cart data before showing empty state
          // console.log('⚠️ Max retries reached, checking for local cart data')
          const localCartData = cartPersistence.getLocalCartData(getCurrentUserId())
          // console.log('📱 Local cart data:', localCartData)
          
          if (localCartData.length > 0) {
            // Use local cart data as fallback
            // console.log('📱 Using local cart data as fallback')
            const localTotal = localCartData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            const localItemCount = localCartData.reduce((sum, item) => sum + item.quantity, 0)
            
            dispatch({ 
              type: 'SET_CART', 
              payload: { 
                items: localCartData,
                totals: {
                  subtotal: localTotal,
                  discountTotal: 0,
                  taxTotal: 0,
                  shippingTotal: 0,
                  total: localTotal
                }
              } 
            })
          }
          
          // Set hydrated to true regardless of local data availability
          dispatch({ type: 'SET_HYDRATED', payload: true })
          dispatch({ type: 'SET_ERROR', payload: 'Unable to connect to the store. Please check your connection and try again.' })
        }
      }
    }
    initializeCart()
  }, [user?.id, isAuthenticated, state.retryCount])

  // Handle user authentication changes - properly switch cart context
  useEffect(() => {
    const handleAuthChange = async () => {
      // console.log('🔄 Handling auth change:', { 
      //   previousUser: state.cartToken ? cartPersistence.getUserIdFromToken(state.cartToken) : null,
      //   currentUser: getCurrentUserId(),
      //   isAuthenticated 
      // })
      
      // Set loading state and reset hydrated state during auth change
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_HYDRATED', payload: false })
      
      // Clear current cart state when user changes
      dispatch({ type: 'CLEAR_CART' })
      
      // Clear any existing cart token for the previous user context
      const prevCartToken = state.cartToken
      if (prevCartToken && !cartPersistence.isTokenForUser(prevCartToken, getCurrentUserId())) {
        dispatch({ type: 'SET_CART_TOKEN', payload: null })
      }
      
      // Load cart for the new user context with proper delay
      setTimeout(async () => {
        const success = await loadCartFromServer()
        if (success || !process.env.NEXT_PUBLIC_WORDPRESS_URL) {
          dispatch({ type: 'SET_HYDRATED', payload: true })
        } else {
          // If loading failed, check for local cart data
          const localCartData = cartPersistence.getLocalCartData(getCurrentUserId())
          if (localCartData.length > 0) {
            const localTotal = localCartData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            dispatch({ 
              type: 'SET_CART', 
              payload: { 
                items: localCartData,
                totals: {
                  subtotal: localTotal,
                  discountTotal: 0,
                  taxTotal: 0,
                  shippingTotal: 0,
                  total: localTotal
                }
              } 
            })
          }
          dispatch({ type: 'SET_HYDRATED', payload: true })
        }
      }, 200) // Longer delay to ensure auth state is fully settled
    }

    // Trigger on authentication state changes
    const currentTokenUserId = state.cartToken ? cartPersistence.getUserIdFromToken(state.cartToken) : null
    const actualUserId = getCurrentUserId()
    
    if (currentTokenUserId !== actualUserId) {
      handleAuthChange()
    }
  }, [user?.id, isAuthenticated])


  // Sync cart with server when needed
  useEffect(() => {
    if (state.needsSync && state.cartToken) {
      // Sync cart changes with server
      syncCartWithServer()
    }
  }, [state.needsSync, state.cartToken])

  const syncCartWithServer = async () => {
    try {
      const cartToken = getCartToken()
      if (!cartToken || state.items.length === 0) {
        dispatch({ type: 'SET_NEEDS_SYNC', payload: false })
        return
      }

      // Sync local cart items with server
      for (const item of state.items) {
        try {
          await woocommerceApi.addToCartStore(item.id, item.quantity, cartToken)
        } catch (error) {
          console.warn(`Failed to sync item ${item.id} with server:`, error)
        }
      }
      
      // Refresh cart from server to ensure consistency
      await loadCartFromServer()
    } catch (error) {
      console.error('Error syncing cart with server:', error)
    } finally {
      dispatch({ type: 'SET_NEEDS_SYNC', payload: false })
    }
  }

  const addToCart = async (product: WooCommerceProduct, quantity = 1) => {
    dispatch({ type: 'SET_ADDING_TO_CART', payload: true })
    
    // Queue the operation to prevent concurrent conflicts
    return cartOperationQueue.enqueue(async () => {
      try {
      // If WooCommerce is not available, add to local cart only
      if (!isWooCommerceAvailable) {
        console.warn('WooCommerce not available, adding to local cart only')
        
        const cartItem: CartItem = {
          key: `local_${product.id}_${Date.now()}`,
          id: product.id,
          quantity,
          name: product.name,
          price: parseFloat(product.price) || 0,
          image: product.images?.[0]?.src || '',
          slug: product.slug || '',
        }
        
        dispatch({ type: 'ADD_ITEM', payload: cartItem })
        
        // Save to local storage
        const updatedItems = [...state.items]
        const existingIndex = updatedItems.findIndex(item => item.id === product.id)
        if (existingIndex >= 0) {
          updatedItems[existingIndex].quantity += quantity
        } else {
          updatedItems.push(cartItem)
        }
        cartPersistence.saveLocalCartData(updatedItems, getCurrentUserId())
        
        dispatch({ type: 'SET_ERROR', payload: null })
        return
      }

      const cartToken = getCartToken()
      console.log(`Adding product ${product.name} to cart. Current cart token:`, cartToken ? cartToken.substring(0, 10) + '...' : 'null')
      console.log(`Current cart has ${state.items.length} items before adding`)
      
      try {
        // Try to add to WooCommerce Store API first
        const response = await woocommerceApi.addToCartStore(product.id, quantity, cartToken || undefined)
        
        if (response) {
          console.log('Successfully added to WooCommerce cart:', response)
          
          // Update cart token if we got a new one or generate one if missing
          if (response.cart_token && response.cart_token !== cartToken) {
            console.log('Updating cart token from response:', response.cart_token.substring(0, 10) + '...')
            setCartToken(response.cart_token)
          } else if (!cartToken && response.cart_token) {
            console.log('Setting new cart token from response:', response.cart_token.substring(0, 10) + '...')
            setCartToken(response.cart_token)
          } else if (!cartToken) {
            // Generate a new cart token if none exists
            const newToken = cartPersistence.generateCartToken(getCurrentUserId())
            console.log('Generated new cart token:', newToken.substring(0, 10) + '...')
            setCartToken(newToken)
          }
          
          // Always refresh cart from server after adding to ensure we get the complete cart state
          console.log('Refreshing cart from server after successful add')
          await loadCartFromServer()
          
          dispatch({ type: 'SET_ERROR', payload: null })
          return // Success - exit early
        }
      } catch (apiError: any) {
        console.error('WooCommerce Store API failed:', apiError.message)
        
        // If WooCommerce becomes unavailable during operation, fall back to local cart
        if (apiError.message?.includes('WooCommerce is not available') || 
            apiError.message?.includes('plugin appears to be deactivated')) {
          console.warn('WooCommerce became unavailable, falling back to local cart')
          
          const cartItem: CartItem = {
            key: `local_${product.id}_${Date.now()}`,
            id: product.id,
            quantity,
            name: product.name,
            price: parseFloat(product.price) || 0,
            image: product.images?.[0]?.src || '',
            slug: product.slug || '',
          }
          
          dispatch({ type: 'ADD_ITEM', payload: cartItem })
          cartPersistence.saveLocalCartData([...state.items, cartItem], getCurrentUserId())
          dispatch({ type: 'SET_ERROR', payload: 'Added to local cart (WooCommerce unavailable)' })
          return
        }
        
        throw apiError
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' })
        throw error
      } finally {
        dispatch({ type: 'SET_ADDING_TO_CART', payload: false })
      }
    })
  }

  const updateCartItem = async (key: string, quantity: number) => {
    dispatch({ type: 'SET_UPDATING_ITEM', payload: key })
    
    // Store original state for rollback
    const originalItem = state.items.find(item => item.key === key)
    
    // Optimistic update - update local state immediately
    dispatch({ type: 'UPDATE_ITEM', payload: { key, quantity } })
    
    // Queue the operation to prevent concurrent conflicts
    return cartOperationQueue.enqueue(async () => {
      try {
      const cartToken = getCartToken()
      console.log(`Updating cart item ${key} to quantity ${quantity}. Cart token:`, cartToken ? cartToken.substring(0, 10) + '...' : 'null')
      
      if (cartToken) {
        try {
          // Update via WooCommerce Store API
          const response = await woocommerceApi.updateCartItem(cartToken, key, quantity)
          console.log('Successfully updated item via API')
          
          // Only refresh if we don't get updated cart data in response
          if (!response || !response.items) {
            await loadCartFromServer()
          } else {
            // Use response data to update cart state
            const items = response.items?.map((item: any) => ({
              key: item.key,
              id: item.id,
              quantity: item.quantity,
              name: item.name,
              price: parseFloat(item.prices?.price || '0') / 100,
              image: item.images?.[0]?.src || '',
              slug: item.slug || '',
            })) || []
            
            const totals = {
              subtotal: parseFloat(response.totals?.subtotal || '0') / 100,
              discountTotal: parseFloat(response.totals?.total_discount || '0') / 100,
              taxTotal: parseFloat(response.totals?.total_tax || '0') / 100,
              shippingTotal: parseFloat(response.totals?.total_shipping || '0') / 100,
              total: parseFloat(response.totals?.total_price || '0') / 100,
            }
            
            dispatch({ 
              type: 'SET_CART', 
              payload: { 
                items, 
                cartToken: response.cart_token || cartToken,
                totals,
                coupons: state.appliedCoupons
              } 
            })
          }
        } catch (apiError: any) {
          console.error('API update failed, reverting optimistic update:', apiError.message)
          // Revert optimistic update by refreshing from server
          await loadCartFromServer()
          throw apiError
        }
      } else {
        throw new Error('No cart token available')
      }
      
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (error) {
        console.error('Error updating cart item:', error)
        // Rollback optimistic update
        if (originalItem) {
          dispatch({ type: 'UPDATE_ITEM', payload: { key: originalItem.key, quantity: originalItem.quantity } })
        }
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart item. Changes may not be saved.' })
        throw error
      } finally {
        dispatch({ type: 'SET_UPDATING_ITEM', payload: null })
      }
    })
  }

  const removeFromCart = async (key: string) => {
    dispatch({ type: 'SET_REMOVING_ITEM', payload: key })
    
    // Store original item for potential rollback
    const originalItem = state.items.find(item => item.key === key)
    
    // Optimistic update - remove from local state immediately
    dispatch({ type: 'REMOVE_ITEM', payload: key })
    
    // Queue the operation to prevent concurrent conflicts
    return cartOperationQueue.enqueue(async () => {
      try {
      const cartToken = getCartToken()
      console.log(`Removing cart item ${key}. Cart token:`, cartToken ? cartToken.substring(0, 10) + '...' : 'null')
      
      if (cartToken) {
        try {
          // Remove via WooCommerce Store API
          const response = await woocommerceApi.removeCartItem(cartToken, key)
          console.log('Successfully removed item via API')
          
          // Only refresh if we don't get updated cart data in response
          if (!response || !response.items) {
            await loadCartFromServer()
          } else {
            // Use response data to update cart state
            const items = response.items?.map((item: any) => ({
              key: item.key,
              id: item.id,
              quantity: item.quantity,
              name: item.name,
              price: parseFloat(item.prices?.price || '0') / 100,
              image: item.images?.[0]?.src || '',
              slug: item.slug || '',
            })) || []
            
            const totals = {
              subtotal: parseFloat(response.totals?.subtotal || '0') / 100,
              discountTotal: parseFloat(response.totals?.total_discount || '0') / 100,
              taxTotal: parseFloat(response.totals?.total_tax || '0') / 100,
              shippingTotal: parseFloat(response.totals?.total_shipping || '0') / 100,
              total: parseFloat(response.totals?.total_price || '0') / 100,
            }
            
            dispatch({ 
              type: 'SET_CART', 
              payload: { 
                items, 
                cartToken: response.cart_token || cartToken,
                totals,
                coupons: state.appliedCoupons
              } 
            })
          }
        } catch (apiError: any) {
          console.error('API removal failed, reverting optimistic update:', apiError.message)
          // Revert optimistic update by adding the item back
          if (originalItem) {
            dispatch({ type: 'ADD_ITEM', payload: originalItem })
          }
          throw apiError
        }
      } else {
        throw new Error('No cart token available')
      }
      
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (error) {
        console.error('Error removing cart item:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart. Item may still be in cart.' })
        throw error
      } finally {
        dispatch({ type: 'SET_REMOVING_ITEM', payload: null })
      }
    })
  }

  const clearCart = async () => {
    dispatch({ type: 'SET_CLEARING_CART', payload: true })
    
    // Queue the operation to prevent concurrent conflicts
    return cartOperationQueue.enqueue(async () => {
      try {
      const cartToken = getCartToken()
      console.log('Clearing cart. Cart token:', cartToken ? cartToken.substring(0, 10) + '...' : 'null')
      
      if (cartToken) {
        try {
          // Clear cart via WooCommerce Store API
          await woocommerceApi.clearCartStore(cartToken)
          console.log('Successfully cleared cart via API')
          
          // Clear the cart token as well
          setCartToken(null)
        } catch (apiError: any) {
          console.warn('API clear failed, clearing locally:', apiError.message)
          // Clear cart token even if API fails
          setCartToken(null)
        }
      } else {
        console.log('No cart token, clearing locally only')
      }
      
      // Always clear local cart state
      dispatch({ type: 'CLEAR_CART' })
      
      // Clear local storage as well
      cartPersistence.clearUserCartData(getCurrentUserId())
      
      dispatch({ type: 'SET_ERROR', payload: null })
      console.log('Cart cleared successfully')
    } catch (error) {
        console.error('Error clearing cart:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' })
        throw error
      } finally {
        dispatch({ type: 'SET_CLEARING_CART', payload: false })
      }
    })
  }

  const refreshCart = async () => {
    // Sync with WooCommerce Store API if configured
    if (process.env.NEXT_PUBLIC_WORDPRESS_URL) {
      await loadCartFromServer()
    }
  }


  const validateCoupon = async (code: string): Promise<CouponValidationResult> => {
    try {
      const userEmail = user?.email
      return await woocommerceApi.validateCoupon(code, state.subtotal, userEmail)
    } catch (error) {
      console.error('Error validating coupon:', error)
      return {
        valid: false,
        error: 'Error validating coupon',
        errorCode: 'validation_error'
      }
    }
  }

  const applyCoupon = async (code: string) => {
    dispatch({ type: 'SET_APPLYING_COUPON', payload: true })
    
    // Queue the operation to prevent concurrent conflicts
    return cartOperationQueue.enqueue(async () => {
      try {
      const cartToken = getCartToken()
      if (!cartToken) {
        throw new Error('No cart token available')
      }

      console.log(`Applying coupon ${code} to cart`)

      // Check if coupon is already applied
      if (state.appliedCoupons.some(coupon => coupon.code === code)) {
        throw new Error('Coupon is already applied')
      }

      // Apply coupon via WooCommerce Store API
      const response = await woocommerceApi.applyCoupon(cartToken, code)
      
      if (response) {
        console.log('Coupon applied successfully, using response data directly')
        console.log('Coupon response data:', response)
        console.log('🔍 RESPONSE TOTALS:', response.totals)
        console.log('🔍 RESPONSE COUPONS:', response.coupons)
        
        // Update cart token if we got a new one from the response
        if (response.cart_token && response.cart_token !== cartToken) {
          console.log('Updating cart token after coupon apply:', response.cart_token.substring(0, 10) + '...')
          setCartToken(response.cart_token)
        }
        
        // Use the cart data directly from the applyCoupon response instead of refreshing
        if (response.items) {
          // Convert WooCommerce cart format to our CartItem format
          const items: CartItem[] = response.items?.map((item: any) => ({
            key: item.key,
            id: item.id,
            quantity: item.quantity,
            name: item.name,
            price: parseFloat(item.prices?.price || '0') / 100,
            image: item.images?.[0]?.src || '',
            slug: item.slug || '',
          })) || []

          // Parse coupon data from response
          const appliedCoupons: AppliedCoupon[] = response.coupons?.map((coupon: any) => {
            const centsValue = coupon.totals?.total_discount || coupon.totals?.discount || coupon.totals?.currency_discount
            const discountTotal = centsValue !== undefined && centsValue !== null
              ? parseFloat(centsValue) / 100
              : parseFloat(coupon.amount || '0')
            return {
              code: coupon.code,
              discount_type: coupon.discount_type || 'fixed_cart',
              amount: (coupon.amount ?? (discountTotal > 0 ? String(discountTotal) : '0')),
              discount_total: isNaN(discountTotal) ? 0 : discountTotal,
              discount_tax: parseFloat(coupon.totals?.discount_tax || '0') / 100,
            }
          }) || []

          // Parse totals from response
          // Calculate discount from coupons if total_discount is not available
          let discountAmount = 0
          if (response.totals?.total_discount) {
            discountAmount = parseFloat(response.totals.total_discount) / 100
          } else if (response.totals?.total_coupon_discount) {
            discountAmount = parseFloat(response.totals.total_coupon_discount) / 100
          } else if (response.coupons && response.coupons.length > 0) {
            discountAmount = response.coupons.reduce((sum: number, coupon: any) => {
              return sum + parseFloat(coupon.totals?.total_discount || coupon.totals?.discount || '0') / 100
            }, 0)
          }
          
          console.log('🔍 PARSING TOTALS:')
          console.log('  total_items:', response.totals?.total_items, '→', parseFloat(response.totals?.total_items || '0') / 100)
          console.log('  total_discount:', response.totals?.total_discount, '→', discountAmount)
          console.log('  total_price:', response.totals?.total_price, '→', parseFloat(response.totals?.total_price || '0') / 100)
          
          const totals: CartTotals = {
            subtotal: parseFloat(response.totals?.total_items || response.totals?.subtotal || '0') / 100,
            discountTotal: discountAmount,
            taxTotal: parseFloat(response.totals?.total_tax || '0') / 100,
            shippingTotal: parseFloat(response.totals?.total_shipping || '0') / 100,
            total: parseFloat(response.totals?.total_price || '0') / 100,
          }

          console.log('✅ FINAL TOTALS:', totals)
          console.log('Updated cart after applying coupon:', { items: items.length, coupons: appliedCoupons.length, totals })

          dispatch({ 
            type: 'SET_CART', 
            payload: { 
              items, 
              cartToken: response.cart_token || cartToken,
              totals,
              coupons: appliedCoupons
            } 
          })
        }
        
        dispatch({ type: 'SET_ERROR', payload: null })
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error)
      let errorMessage = 'Failed to apply coupon'
      
      // Handle specific WooCommerce coupon errors
      if (error.code) {
        switch (error.code) {
          case 'woocommerce_coupon_not_exist':
            errorMessage = 'Coupon code not found'
            break
          case 'woocommerce_coupon_expired':
            errorMessage = 'This coupon has expired'
            break
          case 'woocommerce_coupon_usage_limit_reached':
            errorMessage = 'Coupon usage limit has been reached'
            break
          case 'woocommerce_coupon_minimum_amount':
            errorMessage = error.message || 'Minimum order amount not met'
            break
          case 'woocommerce_coupon_maximum_amount':
            errorMessage = error.message || 'Maximum order amount exceeded'
            break
          case 'woocommerce_coupon_not_valid_for_email':
            errorMessage = 'This coupon is not valid for your email address'
            break
          case 'woocommerce_coupon_already_applied':
            errorMessage = 'Coupon is already applied'
            break
          default:
            errorMessage = error.message || 'Failed to apply coupon'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        throw new Error(errorMessage)
      } finally {
        dispatch({ type: 'SET_APPLYING_COUPON', payload: false })
      }
    })
  }

  const removeCoupon = async (code: string) => {
    dispatch({ type: 'SET_REMOVING_COUPON', payload: code })
    
    // Queue the operation to prevent concurrent conflicts
    return cartOperationQueue.enqueue(async () => {
      try {
      const cartToken = getCartToken()
      if (!cartToken) {
        throw new Error('No cart token available')
      }

      console.log(`Removing coupon ${code} from cart`)
      console.log('Frontend thinks these coupons are applied:', state.appliedCoupons.map(c => c.code))
      console.log('Frontend cart token:', cartToken ? cartToken.substring(0, 10) + '...' : 'null')

      // Remove coupon via WooCommerce Store API
      const response = await woocommerceApi.removeCoupon(cartToken, code)
      
      if (response) {
        console.log('Coupon removal response received')
        console.log('Response data:', response)
        
        // Check if this is a synchronization response (when coupon wasn't actually on server)
        const isServerSync = !response.hasOwnProperty('cart_token') && response.coupons !== undefined
        
        if (isServerSync) {
          console.log('Detected synchronization response - frontend and server were out of sync')
          console.log('Server coupons:', response.coupons?.map((c: any) => c.code) || [])
          console.log('Frontend thought these were applied:', state.appliedCoupons.map(c => c.code))
        } else {
          console.log('Coupon removed successfully from server')
        }
        
        // Update cart token if we got a new one from the response
        if (response.cart_token && response.cart_token !== cartToken) {
          console.log('Updating cart token after coupon removal:', response.cart_token.substring(0, 10) + '...')
          setCartToken(response.cart_token)
        }
        
        // Use the cart data directly from the removeCoupon response instead of refreshing (similar to applyCoupon)
        if (response.items) {
          // Convert WooCommerce cart format to our CartItem format
          const items: CartItem[] = response.items?.map((item: any) => ({
            key: item.key,
            id: item.id,
            quantity: item.quantity,
            name: item.name,
            price: parseFloat(item.prices?.price || '0') / 100,
            image: item.images?.[0]?.src || '',
            slug: item.slug || '',
          })) || []

          // Parse coupon data from response
          const appliedCoupons: AppliedCoupon[] = response.coupons?.map((coupon: any) => {
            const centsValue = coupon.totals?.total_discount || coupon.totals?.discount || coupon.totals?.currency_discount
            const discountTotal = centsValue !== undefined && centsValue !== null
              ? parseFloat(centsValue) / 100
              : parseFloat(coupon.amount || '0')
            return {
              code: coupon.code,
              discount_type: coupon.discount_type || 'fixed_cart',
              amount: (coupon.amount ?? (discountTotal > 0 ? String(discountTotal) : '0')),
              discount_total: isNaN(discountTotal) ? 0 : discountTotal,
              discount_tax: parseFloat(coupon.totals?.discount_tax || '0') / 100,
            }
          }) || []

          // Parse totals from response
          // Calculate discount from coupons if total_discount is not available
          let discountAmount = 0
          if (response.totals?.total_discount) {
            discountAmount = parseFloat(response.totals.total_discount) / 100
          } else if (response.totals?.total_coupon_discount) {
            discountAmount = parseFloat(response.totals.total_coupon_discount) / 100
          } else if (response.coupons && response.coupons.length > 0) {
            discountAmount = response.coupons.reduce((sum: number, coupon: any) => {
              return sum + parseFloat(coupon.totals?.total_discount || coupon.totals?.discount || '0') / 100
            }, 0)
          }
          
          const totals: CartTotals = {
            subtotal: parseFloat(response.totals?.total_items || response.totals?.subtotal || '0') / 100,
            discountTotal: discountAmount,
            taxTotal: parseFloat(response.totals?.total_tax || '0') / 100,
            shippingTotal: parseFloat(response.totals?.total_shipping || '0') / 100,
            total: parseFloat(response.totals?.total_price || '0') / 100,
          }

          console.log('Parsed coupons after removal:', appliedCoupons)
          console.log('Parsed totals after removal:', totals)

          dispatch({ 
            type: 'SET_CART', 
            payload: { 
              items, 
              cartToken: response.cart_token || cartToken,
              totals,
              coupons: appliedCoupons
            } 
          })
        } else {
          // Fallback to refreshing cart from server if no cart data in response
          console.log('No cart data in response, refreshing from server')
          await loadCartFromServer()
        }
        
        // Provide user feedback based on the type of operation
        if (isServerSync) {
          console.log('Cart synchronized with server - coupon was already removed')
          // Don't show an error for sync operations, just a neutral message
          dispatch({ type: 'SET_ERROR', payload: null })
        } else {
          dispatch({ type: 'SET_ERROR', payload: null })
        }
      }
    } catch (error: any) {
      console.error('Error removing coupon:', error)
      let errorMessage = 'Failed to remove coupon'
      
      // Handle specific WooCommerce coupon errors
      if (error.code) {
        switch (error.code) {
          case 'woocommerce_rest_cart_coupon_invalid_code':
          case 'woocommerce_coupon_not_applied':
            // This is likely a synchronization issue - refresh cart to sync with server
            console.log('Coupon synchronization issue detected, refreshing cart from server')
            await loadCartFromServer()
            errorMessage = 'Cart synchronized - coupon was already removed'
            break
          case 'woocommerce_coupon_not_exist':
            errorMessage = 'Coupon code not found'
            break
          default:
            errorMessage = error.message || 'Failed to remove coupon'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        throw new Error(errorMessage)
      } finally {
        dispatch({ type: 'SET_REMOVING_COUPON', payload: null })
      }
    })
  }

  const contextValue: CartContextType = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    syncWithServer: syncCartWithServer,
    applyCoupon,
    removeCoupon,
    validateCoupon,
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
