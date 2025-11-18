'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  StarHalf,
  Plus,
  Minus,
  Check,
  X,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn, formatPrice } from '@/lib/utils'
import { WooCommerceProduct } from '@/types'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { ProductCard } from './product-card'
import { ProductVariations } from './product-variations'

interface SingleProductPageProps {
  product: WooCommerceProduct
  relatedProducts?: WooCommerceProduct[]
}

export function SingleProductPage({ product, relatedProducts = [] }: SingleProductPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariation, setSelectedVariation] = useState<any>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [showImageModal, setShowImageModal] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  const { addToCart, loadingStates } = useCart()
  const { user } = useAuth()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const router = useRouter()
  
  // Check if product is in wishlist
  const isWishlisted = isInWishlist(product.id)

  const images = product.images || []
  const primaryImage = images[selectedImageIndex] || images[0]
  
  const discountPercentage = product.regular_price && product.sale_price
    ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.sale_price)) / parseFloat(product.regular_price)) * 100)
    : 0

  // Use variation data if available, otherwise use product data
  const currentProduct = selectedVariation || product
  const isOutOfStock = currentProduct.stock_status === 'outofstock'
  const isLowStock = currentProduct.manage_stock && currentProduct.stock_quantity !== null && currentProduct.stock_quantity <= 5 && currentProduct.stock_quantity > 0
  
  // Calculate discount percentage for current product/variation
  const currentDiscountPercentage = currentProduct.regular_price && currentProduct.sale_price
    ? Math.round(((parseFloat(currentProduct.regular_price) - parseFloat(currentProduct.sale_price)) / parseFloat(currentProduct.regular_price)) * 100)
    : 0

  // Handle variation change
  const handleVariationChange = (variation: any, attributes: Record<string, string>) => {
    setSelectedVariation(variation)
    setSelectedAttributes(attributes)
    
    // Update image if variation has a specific image
    if (variation?.image && images.length > 0) {
      const variationImageIndex = images.findIndex(img => img.id === variation.image.id)
      if (variationImageIndex !== -1) {
        setSelectedImageIndex(variationImageIndex)
      }
    }
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    if (isOutOfStock) return
    
    // For variable products, ensure a variation is selected
    if (product.type === 'variable' && !selectedVariation) {
      // Show error message that variation must be selected
      return
    }
    
    setIsAddingToCart(true)
    try {
      // For variable products, we need to pass variation info differently
      if (selectedVariation) {
        // Create a modified product with variation data for cart
        const productWithVariation: WooCommerceProduct = {
          ...product,
          id: selectedVariation.id,
          price: selectedVariation.price,
          regular_price: selectedVariation.regular_price,
          sale_price: selectedVariation.sale_price,
          stock_status: selectedVariation.stock_status,
          stock_quantity: selectedVariation.stock_quantity,
          manage_stock: selectedVariation.manage_stock,
        }
        
        await addToCart(productWithVariation, quantity)
      } else {
        await addToCart(product, quantity)
      }
      // Show success message or toast here
    } catch (error) {
      console.error('Error adding to cart:', error)
      // Show error message or toast here
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    if (currentProduct.manage_stock && currentProduct.stock_quantity && newQuantity > currentProduct.stock_quantity) return
    setQuantity(newQuantity)
  }

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  // Handle quick view for related products
  const handleQuickView = (relatedProduct: WooCommerceProduct) => {
    router.push(`/product/${relatedProduct.slug}`)
  }

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Render star rating
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

  // Image navigation
  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/shop" className="hover:text-gray-900 transition-colors">
              Shop
            </Link>
            {product.categories && product.categories.length > 0 && (
              <>
                <span className="text-gray-400">/</span>
                <Link
                  href={`/shop?category=${product.categories[0].slug}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white overflow-hidden">
              {/* HOT Badge */}
              {product.on_sale && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase">
                    HOT
                  </span>
                </div>
              )}

              {primaryImage && (
                <Image
                  src={primaryImage.src}
                  alt={primaryImage.alt || product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
              )}
              
              {/* WoodMart Style Image Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full shadow-lg hover:scale-110"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full shadow-lg hover:scale-110"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* WoodMart Style Zoom Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full shadow-lg hover:scale-110"
                onClick={() => setShowImageModal(true)}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>

              {/* WoodMart Style Badges */}
              <div className="absolute top-6 left-6 flex flex-col space-y-3">
                {product.on_sale && discountPercentage > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-3 py-1.5 rounded-full shadow-lg">
                    -{discountPercentage}%
                  </Badge>
                )}
                {product.featured && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium px-3 py-1.5 rounded-full shadow-lg">
                    Featured
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium px-3 py-1.5 rounded-full shadow-lg">
                    Out of Stock
                  </Badge>
                )}
                {isLowStock && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium px-3 py-1.5 rounded-full shadow-lg">
                    Only {product.stock_quantity} left!
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    className={cn(
                      "relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors",
                      selectedImageIndex === index 
                        ? "border-themes-blue-600" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt || product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Title */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Price */}
              <div className="mb-6">
                {currentProduct.on_sale && currentProduct.sale_price ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(currentProduct.sale_price)}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(currentProduct.regular_price)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(currentProduct.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div 
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {isOutOfStock ? (
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-4 w-4" />
                  <span className="font-medium">Out of Stock</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">In Stock</span>
                  {isLowStock && (
                    <span className="text-orange-600 text-sm">
                      (Only {currentProduct.stock_quantity} left!)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product Variations */}
            <ProductVariations
              product={product}
              onVariationChange={handleVariationChange}
              selectedAttributes={selectedAttributes}
            />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center border border-gray-300 rounded-full">
                  <button
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-600 rounded-l-full"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="w-12 h-10 text-center border-0 focus:outline-none text-gray-900"
                  />
                  <button
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-600 rounded-r-full"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={currentProduct.manage_stock && currentProduct.stock_quantity ? quantity >= currentProduct.stock_quantity : false}
                  >
                    +
                  </button>
                </div>

                {/* Add to Basket Button */}
                <Button
                  className="h-10 px-6 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-full uppercase tracking-wide transition-colors"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAddingToCart || loadingStates.addingToCart}
                >
                  {isAddingToCart || loadingStates.addingToCart
                    ? 'Adding...'
                    : isOutOfStock
                      ? 'Out of Stock'
                      : 'Add to Basket'
                  }
                </Button>
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-4 text-sm">
                <button
                  className="text-gray-700 hover:text-gray-900 flex items-center gap-2"
                  onClick={handleWishlistToggle}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isWishlisted ? "text-red-500" : "text-gray-600"
                    )}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                  <span>{isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Category */}
            {product.categories && product.categories.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-700">Category:</span>
                  <Link
                    href={`/shop?category=${product.categories[0].slug}`}
                    className="text-gray-900 hover:text-orange-500 transition-colors"
                  >
                    {product.categories[0].name}
                  </Link>
                </div>
              </div>
            )}

            {/* Share */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-700">Share:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-400 transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
                    aria-label="Share on Pinterest"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-700 transition-colors"
                    aria-label="Share on LinkedIn"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-500 transition-colors"
                    aria-label="Share on Telegram"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="space-y-3 pt-6 border-t">
                <h3 className="font-semibold text-gray-900">Product Details</h3>
                <div className="space-y-2">
                  {product.attributes.map((attribute) => (
                    <div key={attribute.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{attribute.name}:</span>
                      <span className="text-gray-900">{attribute.options.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="additional">Additional Info</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.rating_count})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="p-6">
              {product.description ? (
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-gray-500">No description available.</p>
              )}
            </TabsContent>
            
            <TabsContent value="additional" className="p-6">
              <div className="space-y-4">
                {product.weight && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Weight</span>
                    <span>{product.weight} kg</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Dimensions</span>
                    <span>{product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">SKU</span>
                    <span>{product.sku}</span>
                  </div>
                )}
                {product.categories && product.categories.length > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Categories</span>
                    <span>{product.categories.map(cat => cat.name).join(', ')}</span>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Tags</span>
                    <span>{product.tags.map(tag => tag.name).join(', ')}</span>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Reviews functionality coming soon!</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex">
                    {renderStars(parseFloat(product.average_rating))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.average_rating} out of 5 ({product.rating_count} reviews)
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              <Link 
                href="/shop" 
                className="text-themes-blue-600 hover:text-themes-blue-700 font-medium"
              >
                View All Products
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={addToCart}
                  onQuickView={handleQuickView}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && primaryImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={primaryImage.src}
                alt={primaryImage.alt || product.name}
                width={800}
                height={600}
                className="object-contain max-h-[80vh]"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white"
                onClick={() => setShowImageModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
