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
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="overflow-hidden bg-white transition-all duration-300" style={{ border: 'none', borderRadius: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Link href={`/product/${product.slug}`}>
          <div className="relative">
            {/* Product Image */}
            <div className="block relative aspect-square overflow-hidden bg-gray-50">
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
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
          </div>

          {/* Badges - Manila Style */}
          <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
            {product.on_sale && discountPercentage > 0 && (
              <div style={{
                backgroundColor: '#e74c3c',
                color: '#ffffff',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '2px'
              }}>
                -{discountPercentage}%
              </div>
            )}
            {product.stock_status === 'outofstock' && (
              <div style={{
                backgroundColor: '#000000',
                color: '#ffffff',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '2px'
              }}>
                Out of Stock
              </div>
            )}
          </div>

          {/* Action Buttons - Manila Style */}
          <div className={cn(
            "absolute top-3 right-3 flex flex-col space-y-1 transition-all duration-300 z-10",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          )}>
            {showWishlist && (
              <button
                className="w-9 h-9 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
                style={{ borderRadius: '0', border: '1px solid #e5e5e5' }}
                onClick={handleAddToWishlist}
              >
                <Heart
                  className={cn("h-4 w-4", isWishlisted ? "text-red-500" : "text-gray-700")}
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              </button>
            )}

            {showQuickView && (
              <button
                className="w-9 h-9 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
                style={{ borderRadius: '0', border: '1px solid #e5e5e5' }}
                onClick={handleQuickView}
              >
                <Eye className="h-4 w-4 text-gray-700" />
              </button>
            )}
          </div>

          {/* Quick Add to Cart - Manila Style */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 transition-all duration-300 z-10",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
          )}>
            <button
              className="w-full hover:opacity-90 transition-opacity font-medium"
              style={{
                backgroundColor: '#32373c',
                color: '#ffffff',
                padding: '12px',
                border: 'none',
                borderRadius: '0',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onClick={handleAddToCart}
              disabled={product.stock_status === 'outofstock'}
            >
              {product.stock_status === 'outofstock' ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
        </Link>

        <div style={{ padding: '20px' }}>
          {/* Product Category */}
          {product.categories && product.categories.length > 0 && (
            <div className="mb-2">
              <span style={{
                fontSize: '11px',
                color: '#999999',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {product.categories[0].name}
              </span>
            </div>
          )}

          {/* Product Name */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 group-hover:opacity-70 transition-opacity" style={{
              fontSize: '15px',
              fontWeight: '400',
              lineHeight: '1.4',
              color: '#000000',
              marginBottom: '8px'
            }}>
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {parseFloat(product.average_rating) > 0 && (
            <div className="flex items-center mb-2" style={{ gap: '6px' }}>
              <div className="flex">
                {renderStars(parseFloat(product.average_rating))}
              </div>
              <span style={{
                fontSize: '11px',
                color: '#999999'
              }}>
                ({product.rating_count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            {product.on_sale && product.sale_price ? (
              <>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  {formatPrice(product.sale_price)}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#999999',
                  textDecoration: 'line-through'
                }}>
                  {formatPrice(product.regular_price)}
                </span>
              </>
            ) : (
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#000000'
              }}>
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
