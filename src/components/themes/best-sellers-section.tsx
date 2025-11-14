'use client'

import React from 'react'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ProductGrid } from './product-grid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { WooCommerceProduct } from '@/types'
import { useCart } from '@/contexts/cart-context'

interface BestSellersSectionProps {
  products: WooCommerceProduct[]
  className?: string
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BestSellersSection({ products, className }: BestSellersSectionProps) {
  const { addToCart } = useCart()
  const router = useRouter()

  const handleAddToCart = async (product: WooCommerceProduct) => {
    try {
      await addToCart(product, 1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const handleQuickView = (product: WooCommerceProduct) => {
    // Navigate to the product page
    router.push(`/product/${product.slug}`)
  }

  return (
    <section className={`py-16 lg:py-20 bg-white ${className || ''}`}>
      <div className="container mx-auto px-4">
        {/* WoodMart Style Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
            <Badge variant="secondary" className="mx-4 px-6 py-2 bg-orange-100 text-orange-800 border-orange-200 font-medium uppercase tracking-wide">
              Featured Products
            </Badge>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Best Sellers
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the confections Le Bake Stories regulars recommend first. 
            <span className="block mt-2 text-base text-gray-500">
              Handpicked favorites that keep our customers coming back for more.
            </span>
          </p>
        </div>

        {/* WoodMart Style Product Grid */}
        <div className="relative">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid
              products={products}
              showFilters={false}
              showSorting={false}
              showViewToggle={false}
              onAddToCart={handleAddToCart}
              onQuickView={handleQuickView}
            />
          </Suspense>
        </div>

        {/* WoodMart Style CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center">
            <Link href="/shop">
              <Button 
                size="lg" 
                className="px-12 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                View All Products
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-3">
              Over 200+ premium products available
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
