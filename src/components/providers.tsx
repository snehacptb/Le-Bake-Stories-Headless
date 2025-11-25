'use client'

import React from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { WooCommerceProvider } from '@/contexts/woocommerce-context'
import { CartProvider } from '@/contexts/cart-context'
import { WishlistProvider } from '@/contexts/wishlist-context'
import { AdminPanelWrapper } from './admin/admin-panel-wrapper'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <WooCommerceProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            {/* Admin Panel - Shows only for authenticated admin users */}
            <AdminPanelWrapper />
          </WishlistProvider>
        </CartProvider>
      </WooCommerceProvider>
    </AuthProvider>
  )
}
