'use client'

import React, { useState } from 'react'
import { ThemesHeader } from './header'
import { ThemesFooter } from './footer'
import { CartDrawer } from './cart-drawer'
import { cn } from '@/lib/utils'
import { useCart } from '@/contexts/cart-context'

interface ThemesLayoutProps {
  children: React.ReactNode
  headerProps?: any
  footerProps?: any
  showHeader?: boolean
  showFooter?: boolean
  className?: string
}

export function ThemesLayout({
  children,
  headerProps = {},
  footerProps = {},
  showHeader = true,
  showFooter = true,
  className
}: ThemesLayoutProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { itemCount } = useCart()

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Header */}
      {showHeader && (
        <ThemesHeader
          cartItemCount={itemCount}
          onCartClick={openCart}
          {...headerProps}
        />
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <ThemesFooter {...footerProps} />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
      />
    </div>
  )
}
