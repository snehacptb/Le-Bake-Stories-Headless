
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, X, ShoppingBag, ArrowRight, Trash2, Loader2, Frown, Heart, Shield, Truck, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { CouponInput } from '@/components/ui/coupon-input'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { woocommerceApi } from '@/lib/woocommerce-api'

interface CartPageProps {
  className?: string
}

export function CartPage({ className }: CartPageProps) {
  const { 
    items, 
    total, 
    subtotal, 
    discountTotal, 
    taxTotal, 
    shippingTotal, 
    itemCount, 
    appliedCoupons,
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    isLoading, 
    isHydrated,
    error,
    loadingStates,
    refreshCart,
    retryCount,
    addToCart
  } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())
  const [newProducts, setNewProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [addingToCart, setAddingToCart] = useState<Set<number>>(new Set())

  // Fetch new products when cart is empty
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      fetchNewProducts()
    }
  }, [isHydrated, items.length])

  const fetchNewProducts = async () => {
    setLoadingProducts(true)
    try {
      const products = await woocommerceApi.getProducts({
        per_page: 4,
        orderby: 'date',
        order: 'desc',
        status: 'publish'
      })
      setNewProducts(products)
    } catch (error) {
      console.error('Failed to fetch new products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleAddToCart = async (product: any) => {
    setAddingToCart(prev => new Set(prev).add(product.id))
    try {
      // Pass the complete product object to addToCart
      await addToCart(product, 1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }
  }

  const handleToggleWishlist = (product: any) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      // Pass the complete product object to addToWishlist
      addToWishlist(product)
    }
  }

  const handleQuantityChange = async (itemKey: string, newQuantity: number) => {
    // Validate quantity
    if (newQuantity < 0) {
      return // Don't allow negative quantities
    }
    
    // Add item to processing set
    setProcessingItems(prev => new Set(prev).add(itemKey))
    
    try {
      if (newQuantity === 0) {
        // Remove item if quantity is 0
        await removeFromCart(itemKey)
      } else {
        // Update quantity
        await updateCartItem(itemKey, newQuantity)
      }
    } finally {
      // Remove item from processing set
      setProcessingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemKey)
        return newSet
      })
    }
  }

  const finalTotal: number = total

  // Show skeleton loader during initial hydration (Amazon/Flipkart style)
  if (!isHydrated) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>

              {/* Cart Items Skeleton */}
              <div className="divide-y divide-gray-200">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse">
                    <div className="flex items-center gap-4">
                      {/* Product Image Skeleton */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>

                      {/* Product Details Skeleton */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                      </div>

                      {/* Quantity Controls Skeleton */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-200 rounded-md">
                          <div className="h-8 w-8 bg-gray-200 rounded-none"></div>
                          <div className="w-16 h-8 bg-gray-200 rounded-none"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded-none"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              
              {/* Coupon Input Skeleton */}
              <div className="mb-6">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>

              {/* Totals Skeleton */}
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>

              {/* Checkout Button Skeleton */}
              <div className="mt-6">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state only after hydration is complete
  if (items.length === 0) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        {/* Empty Cart Icon and Message */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
            <Frown className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is currently empty!</h2>
          <p className="text-gray-600">
            <Link href="/shop" className="text-themes-pink-600 hover:underline">Return to shop</Link>
          </p>
        </div>

        {/* New in Store Section */}
        <div className="mt-16 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">New in store</h2>
          
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newProducts.map((product) => (
                <div key={product.id} className="group relative">
                  <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Product Image */}
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-square bg-gray-100">
                        {product.images?.[0]?.src ? (
                          <Image
                            src={product.images[0].src}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Sale Badge */}
                        {product.on_sale && (
                          <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                            Sale
                          </div>
                        )}

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleToggleWishlist(product)
                          }}
                          className={cn(
                            "absolute top-2 left-2 p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all",
                            isInWishlist(product.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
                          )}
                          aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart className={cn("h-5 w-5", isInWishlist(product.id) && "fill-current")} />
                        </button>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link href={`/product/${product.slug}`}>
                        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-themes-pink-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mb-3">
                        {product.on_sale && product.regular_price ? (
                          <>
                            <span className="text-lg font-bold text-gray-900">
                              ${parseFloat(product.sale_price || product.price).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${parseFloat(product.regular_price).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCart.has(product.id)}
                        className="w-full"
                        size="sm"
                      >
                        {addingToCart.has(product.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue Shopping Button */}
          <div className="text-center mt-8">
            <Link href="/shop">
              <Button 
                variant="outline" 
                className="px-8 py-3 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 rounded-xl font-semibold"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800 text-sm">{error}</p>
            {error.includes('connect') && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCart}
                disabled={isLoading}
                className="ml-4 text-red-700 border-red-300 hover:bg-red-100"
              >
                {isLoading ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* WoodMart Style Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-8 py-6 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-orange-900">Cart Items</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  disabled={loadingStates.clearingCart}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-xl font-medium"
                >
                  {loadingStates.clearingCart ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cart
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* WoodMart Style Items List */}
            <div className="divide-y divide-gray-100">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-8 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-6">
                      {/* WoodMart Style Product Image */}
                      <div className="relative w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* WoodMart Style Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-bold text-gray-900 truncate mb-2">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 mb-3">SKU: {item.slug}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            per item
                          </span>
                        </div>
                      </div>

                      {/* WoodMart Style Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.key, item.quantity - 1)}
                            disabled={loadingStates.updatingItem === item.key || processingItems.has(item.key)}
                            className="h-12 w-12 p-0 rounded-none hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="h-5 w-5" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value)
                              if (!isNaN(newQty) && newQty !== item.quantity) {
                                handleQuantityChange(item.key, newQty)
                              }
                            }}
                            onBlur={(e) => {
                              const newQty = parseInt(e.target.value)
                              if (isNaN(newQty) || newQty < 1) {
                                handleQuantityChange(item.key, 1)
                              }
                            }}
                            className="w-20 h-12 text-center border-0 focus:ring-0 rounded-none font-bold text-lg bg-gray-50"
                            min="1"
                            disabled={loadingStates.updatingItem === item.key || processingItems.has(item.key)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.key, item.quantity + 1)}
                            disabled={loadingStates.updatingItem === item.key || processingItems.has(item.key)}
                            className="h-12 w-12 p-0 rounded-none hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>

                        {/* WoodMart Style Subtotal */}
                        <div className="text-right min-w-[120px]">
                          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
                            <p className="text-sm text-green-700 font-medium mb-1">Subtotal</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* WoodMart Style Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.key)}
                          disabled={loadingStates.removingItem === item.key}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-12 w-12 p-0 rounded-xl border-2 border-transparent hover:border-red-200 transition-all duration-300"
                        >
                          {loadingStates.removingItem === item.key ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* WoodMart Style Continue Shopping */}
          <div className="mt-8 text-center">
            <Link href="/shop">
              <Button 
                variant="outline" 
                className="px-8 py-4 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 rounded-xl font-semibold text-lg"
              >
                <ArrowRight className="h-5 w-5 mr-3 rotate-180" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* WoodMart Style Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sticky top-4 shadow-lg">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Summary</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto"></div>
            </div>

            {/* Coupon Code */}
            <div className="mb-6">
              <CouponInput compact />
            </div>

            <Separator className="mb-4" />

            {/* WoodMart Style Order Totals */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="text-lg font-bold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Discount</span>
                  <span className="text-lg font-bold text-green-600">-${discountTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Shipping</span>
                <span className="text-lg font-bold text-gray-900">
                  {shippingTotal === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `$${shippingTotal.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Tax</span>
                <span className="text-lg font-bold text-gray-900">${taxTotal.toFixed(2)}</span>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-orange-900">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* WoodMart Style Checkout Button */}
            <div className="mt-8">
              <Link href="/checkout">
                <Button 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" 
                  disabled={items.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* WoodMart Style Security Features */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-green-50 p-3 rounded-xl border border-green-200">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium">256-bit SSL Secure Checkout</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>Secure</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Truck className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Fast Shipping</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
