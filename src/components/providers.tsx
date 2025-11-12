'use client'

import React from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { WooCommerceProvider } from '@/contexts/woocommerce-context'
import { CartProvider } from '@/contexts/cart-context'
import { WishlistProvider } from '@/contexts/wishlist-context'

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
          </WishlistProvider>
        </CartProvider>
      </WooCommerceProvider>
    </AuthProvider>
  )
}
