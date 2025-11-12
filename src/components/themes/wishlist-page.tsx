'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  ShoppingCart, 
  X, 
  Star,
  StarHalf,
  ArrowLeft,
  Share2,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn, formatPrice } from '@/lib/utils'
import { useWishlist } from '@/contexts/wishlist-context'
import { useCart } from '@/contexts/cart-context'
import { WooCommerceProduct } from '@/types'

export function WishlistPage() {
  const { getWishlistItems, removeFromWishlist, clearWishlist, getWishlistCount, state } = useWishlist()
  const { addToCart, loadingStates } = useCart()
  
  const wishlistItems = getWishlistItems()
  const wishlistCount = getWishlistCount()

  const handleAddToCart = (product: WooCommerceProduct) => {
    addToCart(product, 1)
  }

  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlist(productId)
  }

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlist()
    }
  }

  const handleShare = async (product: WooCommerceProduct) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description,
          url: `${window.location.origin}/product/${product.slug}`,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/product/${product.slug}`)
      // You could show a toast notification here
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return stars
  }

  // Show skeleton loader during initial hydration (Amazon/Flipkart style)
  if (!state.isHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8 animate-pulse">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        <div className="h-px bg-gray-200 mb-8"></div>

        {/* Wishlist Items Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              {/* Product Image Skeleton */}
              <div className="relative aspect-square bg-gray-200">
                {/* Remove Button Skeleton */}
                <div className="absolute top-2 right-2 w-8 h-8 bg-gray-300 rounded-full"></div>
                
                {/* Badges Skeleton */}
                <div className="absolute top-3 left-3 space-y-2">
                  <div className="w-12 h-5 bg-gray-300 rounded"></div>
                </div>
              </div>

              {/* Product Content Skeleton */}
              <div className="p-4 space-y-3">
                {/* Category */}
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                
                {/* Product Name */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="w-4 h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                </div>

                {/* Added Date */}
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show empty state only after hydration is complete
  if (wishlistCount === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">Save your favorite items for later</p>
          </div>
          <Link href="/shop">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Continue Shopping</span>
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start adding products you love to your wishlist. You can save items for later and easily find them here.
          </p>
          <Link href="/shop">
            <Button size="lg" className="px-8">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2">
            {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleClearWishlist}
            disabled={wishlistCount === 0}
          >
            Clear All
          </Button>
          <Link href="/shop">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Continue Shopping</span>
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {wishlistItems.map((item) => {
            const product = item.product
            const primaryImage = product.images?.[0]
            const discountPercentage = product.regular_price && product.sale_price
              ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.sale_price)) / parseFloat(product.regular_price)) * 100)
              : 0

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Remove Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-md"
                    onClick={() => handleRemoveFromWishlist(product.id)}
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </Button>

                  {/* Product Image */}
                  <Link href={`/product/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden">
                      {primaryImage && (
                        <Image
                          src={primaryImage.src}
                          alt={primaryImage.alt || product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-2">
                        {product.on_sale && discountPercentage > 0 && (
                          <Badge variant="sale" className="text-xs font-bold">
                            -{discountPercentage}%
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge variant="featured" className="text-xs">
                            Featured
                          </Badge>
                        )}
                        {product.stock_status === 'outofstock' && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  <CardContent className="p-4">
                    {/* Product Category */}
                    {product.categories && product.categories.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2">
                        {product.categories[0].name}
                      </p>
                    )}

                    {/* Product Name */}
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-medium text-sm line-clamp-2 mb-2 hover:text-themes-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    {parseFloat(product.average_rating) > 0 && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {renderStars(parseFloat(product.average_rating))}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({product.rating_count})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center space-x-2 mb-4">
                      {product.on_sale && product.sale_price ? (
                        <>
                          <span className="text-lg font-bold text-themes-blue-600">
                            {formatPrice(product.sale_price)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.regular_price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        variant="themes"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_status === 'outofstock' || loadingStates.addingToCart}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.stock_status === 'outofstock' ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleShare(product)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Added Date */}
                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Continue Shopping CTA */}
      <div className="text-center mt-12 py-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Looking for more products?
        </h3>
        <p className="text-gray-600 mb-6">
          Discover more amazing products in our shop
        </p>
        <Link href="/shop">
          <Button size="lg" className="px-8">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  )
}
