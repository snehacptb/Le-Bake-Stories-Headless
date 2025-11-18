'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Star,
  StarHalf,
  Zap,
  BarChart3,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatPrice } from '@/lib/utils'
import { WooCommerceProduct } from '@/types'
import { useWishlist } from '@/contexts/wishlist-context'

interface ProductCardProps {
  product: WooCommerceProduct
  variant?: 'default' | 'compact' | 'featured'
  priority?: boolean
  showQuickView?: boolean
  showWishlist?: boolean
  showCompare?: boolean
  onAddToCart?: (product: WooCommerceProduct) => void
  onAddToWishlist?: (productId: number) => void
  onQuickView?: (product: WooCommerceProduct) => void
  className?: string
}

export function ProductCard({
  product,
  variant = 'default',
  priority = false,
  showQuickView = true,
  showWishlist = true,
  showCompare = false,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  className
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  
  // Use wishlist context instead of local state - access state.items directly to trigger re-renders
  const { state: wishlistState, isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const isWishlisted = wishlistState.items.some(item => item.id === product.id)

  const primaryImage = product.images?.[0]
  const secondaryImage = product.images?.[1]
  const discountPercentage = product.regular_price && product.sale_price
    ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.sale_price)) / parseFloat(product.regular_price)) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent link navigation
    e.stopPropagation() // Stop event bubbling
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(product)
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
    
    // Call optional callback for backward compatibility
    onAddToWishlist?.(product.id)
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

  if (variant === 'compact') {
    return (
      <Link href={`/product/${product.slug}`}>
        <Card className={cn("group cursor-pointer hover:shadow-lg transition-shadow", className)}>
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                {primaryImage && (
                  <Image
                    src={primaryImage.src}
                    alt={primaryImage.alt || product.name}
                    fill
                    sizes="80px"
                    priority={priority}
                    className="object-cover rounded-md"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-themes-blue-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <motion.div
      className={cn("group cursor-pointer", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border-0">
        <Link href={`/product/${product.slug}`}>
          <div className="relative">
            {/* Product Image */}
            <div className="block relative aspect-square overflow-hidden rounded-t-2xl bg-gray-50">
            {primaryImage && (
              <>
                <Image
                  src={primaryImage.src}
                  alt={primaryImage.alt || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  priority={priority}
                  className={cn(
                    "object-cover transition-all duration-700 group-hover:scale-110",
                    isHovered && secondaryImage ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setImageLoading(false)}
                />
                {secondaryImage && (
                  <Image
                    src={secondaryImage.src}
                    alt={secondaryImage.alt || product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    priority={priority}
                    className={cn(
                      "object-cover transition-all duration-700 group-hover:scale-110",
                      isHovered ? "opacity-100" : "opacity-0"
                    )}
                  />
                )}
              </>
            )}
            
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-t-2xl" />
            )}
          </div>

          {/* Badges - WoodMart Style */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
            {product.on_sale && discountPercentage > 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                -{discountPercentage}%
              </div>
            )}
            {product.featured && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                ⭐ Featured
              </div>
            )}
            {product.stock_status === 'outofstock' && (
              <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                Out of Stock
              </div>
            )}
          </div>

          {/* Action Buttons - WoodMart Style */}
          <div className={cn(
            "absolute top-4 right-4 flex flex-col space-y-2 transition-all duration-500 z-10",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
          )}>
            {showWishlist && (
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 bg-white/95 hover:bg-white shadow-lg rounded-full backdrop-blur-sm border border-gray-100 hover:scale-110 transition-all duration-300"
                onClick={handleAddToWishlist}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isWishlisted ? "text-red-500" : "text-gray-600 hover:text-red-500"
                  )}
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              </Button>
            )}
            
            {showQuickView && (
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 bg-white/95 hover:bg-white shadow-lg rounded-full backdrop-blur-sm border border-gray-100 hover:scale-110 transition-all duration-300"
                onClick={handleQuickView}
              >
                <Eye className="h-4 w-4 text-gray-600 hover:text-blue-600 transition-colors" />
              </Button>
            )}
            
            {showCompare && (
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 bg-white/95 hover:bg-white shadow-lg rounded-full backdrop-blur-sm border border-gray-100 hover:scale-110 transition-all duration-300"
              >
                <BarChart3 className="h-4 w-4 text-gray-600 hover:text-green-600 transition-colors" />
              </Button>
            )}
          </div>

          {/* Quick Add to Cart - WoodMart Style */}
          <div className={cn(
            "absolute bottom-4 left-4 right-4 transition-all duration-500 z-10",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}>
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              onClick={handleAddToCart}
              disabled={product.stock_status === 'outofstock'}
            >
              {product.stock_status === 'outofstock' ? (
                <span>Out of Stock</span>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
        </Link>

        <CardContent className="p-6 space-y-3">
          {/* Product Category */}
          {product.categories && product.categories.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {product.categories[0].name}
              </span>
            </div>
          )}

          {/* Product Name */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors leading-tight">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {parseFloat(product.average_rating) > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex">
                {renderStars(parseFloat(product.average_rating))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                ({product.rating_count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {product.on_sale && product.sale_price ? (
                <>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(product.sale_price)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.regular_price)}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            {/* Mobile Add to Cart */}
            <Button
              size="icon"
              className="lg:hidden w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg"
              onClick={handleAddToCart}
              disabled={product.stock_status === 'outofstock'}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Stock Status */}
          {product.manage_stock && product.stock_quantity !== null && (
            <div className="">
              {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-full">
                  <Zap className="h-3 w-3" />
                  <span className="text-xs font-medium">Only {product.stock_quantity} left!</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
