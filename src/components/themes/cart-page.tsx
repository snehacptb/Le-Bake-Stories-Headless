
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
  const [showCouponInput, setShowCouponInput] = useState(false)

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
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Manila Style Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Shopping Cart</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Manila Style Coupon Section */}
        <div className="mb-8 bg-gray-50 border border-gray-200 p-4 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Have a coupon?{' '}
              <button 
                onClick={() => setShowCouponInput(!showCouponInput)}
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Click here to enter your code
              </button>
            </span>
          </div>
          {showCouponInput && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded">
              <div className="text-sm text-gray-600 mb-3">
                If you have a coupon code, please apply it below.
              </div>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Coupon code"
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  APPLY COUPON
                </Button>
              </div>
            </div>
          )}
        </div>

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

        {/* Manila Style Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <span className="ml-2 text-orange-500 font-medium">SHOPPING CART</span>
            </div>
            <div className="w-16 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <span className="ml-2 text-gray-500">CHECKOUT</span>
            </div>
            <div className="w-16 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <span className="ml-2 text-gray-500">ORDER COMPLETE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manila Style Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Manila Style Table Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 uppercase tracking-wide">
                  <div className="col-span-6">PRODUCT</div>
                  <div className="col-span-2 text-center">PRICE</div>
                  <div className="col-span-2 text-center">QUANTITY</div>
                  <div className="col-span-2 text-center">SUBTOTAL</div>
                </div>
              </div>

              {/* Manila Style Items List */}
              <div className="divide-y divide-gray-100">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 py-6 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Product Column */}
                        <div className="col-span-6 flex items-center space-x-4">
                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.key)}
                            disabled={loadingStates.removingItem === item.key}
                            className="text-gray-400 hover:text-red-500 p-1 h-auto w-auto"
                          >
                            {loadingStates.removingItem === item.key ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {/* Product Image */}
                          <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">SKU: {item.slug}</p>
                          </div>
                        </div>

                        {/* Price Column */}
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity Column */}
                        <div className="col-span-2 flex justify-center">
                          <div className="flex items-center border border-gray-300 rounded">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.key, item.quantity - 1)}
                              disabled={loadingStates.updatingItem === item.key || processingItems.has(item.key)}
                              className="h-8 w-8 p-0 rounded-none hover:bg-gray-100"
                            >
                              <Minus className="h-3 w-3" />
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
                              className="w-12 h-8 text-center border-0 focus:ring-0 rounded-none text-sm"
                              min="1"
                              disabled={loadingStates.updatingItem === item.key || processingItems.has(item.key)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.key, item.quantity + 1)}
                              disabled={loadingStates.updatingItem === item.key || processingItems.has(item.key)}
                              className="h-8 w-8 p-0 rounded-none hover:bg-gray-100"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Subtotal Column */}
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Manila Style Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={loadingStates.clearingCart}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {loadingStates.clearingCart ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear Shopping Cart'
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Update Shopping Cart
              </Button>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link href="/shop" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Manila Style YOUR ORDER Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-8">YOUR ORDER</h3>

              {/* Order Items Table */}
              <div className="bg-white border border-gray-200 mb-6">
                {/* Table Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                  <span className="font-semibold text-gray-900">PRODUCT</span>
                  <span className="font-semibold text-gray-900">SUBTOTAL</span>
                </div>

                {/* Order Items */}
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-4">
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-sm text-gray-500 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="divide-y divide-gray-200 border-t border-gray-200">
                  <div className="flex justify-between items-center p-4">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between items-center p-4">
                      <span className="text-gray-700">Discount</span>
                      <span className="font-medium text-green-600">-${discountTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-4">
                    <span className="text-gray-700">Shipping</span>
                    <span className="text-sm text-gray-600">Flat rate</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 font-bold">
                    <span className="text-lg text-gray-900">Total</span>
                    <span className="text-lg text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="bg-white border border-gray-200 p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    id="cash-delivery" 
                    name="payment-method" 
                    defaultChecked 
                    className="w-4 h-4 text-orange-500"
                  />
                  <label htmlFor="cash-delivery" className="font-medium text-gray-900">
                    Cash on delivery
                  </label>
                </div>
                <div className="mt-3 ml-7 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  Pay with cash upon delivery.
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="text-xs text-gray-600 mb-6 leading-relaxed">
                Your personal data will be used to process your order, support your experience throughout 
                this website, and for other purposes described in our{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                  privacy policy
                </Link>
                .
              </div>

              {/* Place Order Button */}
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-sm font-medium rounded-full" 
                disabled={items.length === 0}
              >
                PLACE ORDER
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


