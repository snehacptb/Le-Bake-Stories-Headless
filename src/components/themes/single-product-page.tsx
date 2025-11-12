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
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-themes-blue-600">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-themes-blue-600">Shop</Link>
            {product.categories && product.categories.length > 0 && (
              <>
                <span>/</span>
                <Link 
                  href={`/shop?category=${product.categories[0].slug}`}
                  className="hover:text-themes-blue-600"
                >
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden group">
              {primaryImage && (
                <Image
                  src={primaryImage.src}
                  alt={primaryImage.alt || product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              )}
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Zoom Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowImageModal(true)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
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
                {isOutOfStock && (
                  <Badge variant="destructive" className="text-xs">
                    Out of Stock
                  </Badge>
                )}
                {isLowStock && (
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
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

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Title and Category */}
            <div>
              {product.categories && product.categories.length > 0 && (
                <p className="text-sm text-gray-500 mb-2">
                  {product.categories[0].name}
                </p>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Rating */}
              {parseFloat(product.average_rating) > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex">
                    {renderStars(parseFloat(product.average_rating))}
                  </div>
                  <span className="text-sm text-gray-500">
                    ({product.rating_count} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              {currentProduct.on_sale && currentProduct.sale_price ? (
                <>
                  <span className="text-3xl font-bold text-themes-blue-600">
                    {formatPrice(currentProduct.sale_price)}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(currentProduct.regular_price)}
                  </span>
                  <Badge variant="sale" className="text-sm">
                    Save {currentDiscountPercentage}%
                  </Badge>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(currentProduct.price)}
                </span>
              )}
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
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={currentProduct.manage_stock && currentProduct.stock_quantity ? quantity >= currentProduct.stock_quantity : false}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  className="flex-1 h-12"
                  variant="themes"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAddingToCart || loadingStates.addingToCart}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isAddingToCart || loadingStates.addingToCart 
                    ? 'Adding...' 
                    : isOutOfStock 
                      ? 'Out of Stock' 
                      : 'Add to Cart'
                  }
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={cn(
                    "h-4 w-4 mr-2",
                    isWishlisted ? "fill-red-500 text-red-500" : ""
                  )} />
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RotateCcw className="h-4 w-4" />
                <span>Easy Returns</span>
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
