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
  Zap
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
  
  // Use wishlist context instead of local state
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const isWishlisted = isInWishlist(product.id)

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
    <Link href={`/product/${product.slug}`}>
      <motion.div
        className={cn("group cursor-pointer", className)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="relative">
            {/* Product Image */}
            <div className="block relative aspect-square overflow-hidden">
            {primaryImage && (
              <>
                <Image
                  src={primaryImage.src}
                  alt={primaryImage.alt || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  priority={priority}
                  className={cn(
                    "object-cover transition-all duration-500",
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
                      "object-cover transition-all duration-500",
                      isHovered ? "opacity-100" : "opacity-0"
                    )}
                  />
                )}
              </>
            )}
            
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
          </div>

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

          {/* Action Buttons */}
          <div className={cn(
            "absolute top-3 right-3 flex flex-col space-y-2 transition-all duration-300",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          )}>
            {showWishlist && (
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/90 hover:bg-white shadow-md"
                onClick={handleAddToWishlist}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
                )} />
              </Button>
            )}
            
            {showQuickView && (
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/90 hover:bg-white shadow-md"
                onClick={handleQuickView}
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </Button>
            )}
          </div>

          {/* Quick Add to Cart */}
          <div className={cn(
            "absolute bottom-3 left-3 right-3 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Button
              className="w-full"
              variant="themes"
              onClick={handleAddToCart}
              disabled={product.stock_status === 'outofstock'}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock_status === 'outofstock' ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Product Category */}
          {product.categories && product.categories.length > 0 && (
            <p className="text-xs text-gray-500 mb-2">
              {product.categories[0].name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-themes-blue-600 transition-colors">
            {product.name}
          </h3>

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
          <div className="flex items-center space-x-2">
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

          {/* Stock Status */}
          {product.manage_stock && product.stock_quantity !== null && (
            <div className="mt-2">
              {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <Zap className="h-3 w-3" />
                  <span className="text-xs">Only {product.stock_quantity} left!</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
    </Link>
  )
}
