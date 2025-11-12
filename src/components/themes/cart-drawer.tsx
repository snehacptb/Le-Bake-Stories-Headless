'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CartItem } from '@/types'
import { useCart } from '@/contexts/cart-context'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function CartDrawer({
  isOpen,
  onClose,
  className
}: CartDrawerProps) {
  const { items, total, itemCount, updateCartItem, removeFromCart, clearCart, isLoading, isHydrated } = useCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const handleUpdateQuantity = async (key: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(key)
    } else {
      await updateCartItem(key, newQuantity)
    }
  }

  const handleRemoveItem = async (key: string) => {
    await removeFromCart(key)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  Shopping Cart ({itemCount})
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {isLoading || !isHydrated ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isHydrated && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add some products to get started
                  </p>
                  <Button variant="themes" onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.key}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex space-x-4 p-4 border rounded-lg"
                    >
                      {/* Product Image */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-medium text-sm hover:text-themes-blue-600 transition-colors line-clamp-2"
                          onClick={onClose}
                        >
                          {item.name}
                        </Link>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-themes-blue-600">
                            ${item.price.toFixed(2)}
                          </span>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.key, item.quantity - 1)}
                              disabled={updatingItems.has(item.key) || item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="w-8 text-center text-sm font-medium">
                              {updatingItems.has(item.key) ? '...' : item.quantity}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.key, item.quantity + 1)}
                              disabled={updatingItems.has(item.key)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-auto p-1"
                            onClick={() => handleRemoveItem(item.key)}
                            disabled={updatingItems.has(item.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Subtotal:</span>
                  <span className="text-themes-blue-600">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link href="/cart" onClick={onClose}>
                    <Button variant="themes-outline" className="w-full">
                      View Cart
                    </Button>
                  </Link>
                  
                  <Link href="/checkout" onClick={onClose}>
                    <Button variant="themes" className="w-full">
                      Checkout
                    </Button>
                  </Link>
                  
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={clearCart}
                    >
                      Clear Cart
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
