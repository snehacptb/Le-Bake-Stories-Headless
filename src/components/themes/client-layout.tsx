'use client'

import { ThemesLayout } from './layout'
import { CartProvider } from '@/contexts/cart-context'
import { WishlistProvider } from '@/contexts/wishlist-context'
import { AuthProvider } from '@/contexts/auth-context'
import { WooCommerceProvider } from '@/contexts/woocommerce-context'

interface ClientLayoutProps {
  children: React.ReactNode
  headerProps?: any
  footerProps?: any
  showHeader?: boolean
  showFooter?: boolean
  className?: string
}

export function ClientLayout(props: ClientLayoutProps) {
  return (
    <AuthProvider>
      <WooCommerceProvider>
        <CartProvider>
          <WishlistProvider>
            <ThemesLayout {...props} />
          </WishlistProvider>
        </CartProvider>
      </WooCommerceProvider>
    </AuthProvider>
  )
}
