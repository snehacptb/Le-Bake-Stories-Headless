'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { wooCommerceStatus, WooCommerceStatus } from '@/lib/woocommerce-status'

interface WooCommerceContextType {
  status: WooCommerceStatus
  isAvailable: boolean
  isConfigured: boolean
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  getStatusMessage: () => string
}

const WooCommerceContext = createContext<WooCommerceContextType | undefined>(undefined)

export function WooCommerceProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WooCommerceStatus>({
    isActive: false,
    isConfigured: false,
    lastChecked: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Initialize and subscribe to status changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeStatus = async () => {
      try {
        setIsLoading(true)
        
        // Get initial status
        const initialStatus = await wooCommerceStatus.checkStatus()
        setStatus(initialStatus)
        
        // Subscribe to status changes
        unsubscribe = wooCommerceStatus.subscribe((newStatus) => {
          console.log('WooCommerce status updated in context:', newStatus)
          setStatus(newStatus)
        })
        
      } catch (error) {
        console.error('Error initializing WooCommerce status:', error)
        setStatus({
          isActive: false,
          isConfigured: false,
          lastChecked: Date.now(),
          error: 'Failed to check WooCommerce status'
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeStatus()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Manual refresh function
  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const newStatus = await wooCommerceStatus.refresh()
      setStatus(newStatus)
    } catch (error) {
      console.error('Error refreshing WooCommerce status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get user-friendly status message
  const getStatusMessage = useCallback(() => {
    return wooCommerceStatus.getStatusMessage()
  }, [status])

  const contextValue: WooCommerceContextType = {
    status,
    isAvailable: status.isActive && status.isConfigured,
    isConfigured: status.isConfigured,
    isLoading,
    error: status.error || null,
    refresh,
    getStatusMessage
  }

  return (
    <WooCommerceContext.Provider value={contextValue}>
      {children}
    </WooCommerceContext.Provider>
  )
}

export function useWooCommerce() {
  const context = useContext(WooCommerceContext)
  if (context === undefined) {
    throw new Error('useWooCommerce must be used within a WooCommerceProvider')
  }
  return context
}

// Hook for components that need to conditionally render based on WooCommerce availability
export function useWooCommerceFeatures() {
  const { isAvailable, isConfigured, isLoading, error } = useWooCommerce()
  
  return {
    // WooCommerce is fully available (active and configured)
    isAvailable,
    
    // WooCommerce is configured but may not be active
    isConfigured,
    
    // Still checking status
    isLoading,
    
    // Error message if any
    error,
    
    // Helper functions for conditional rendering
    shouldShowShop: () => isAvailable,
    shouldShowCart: () => isAvailable,
    shouldShowCheckout: () => isAvailable,
    shouldShowProducts: () => isAvailable,
    shouldShowWishlist: () => isAvailable,
    shouldShowMyAccount: () => isAvailable,
    shouldShowAuth: () => isAvailable, // Login/Register only for ecommerce sites
    
    // Show loading state
    shouldShowLoading: () => isLoading
  }
}
