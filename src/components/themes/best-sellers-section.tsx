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
    <section className={`py-12 lg:py-16 bg-gray-50 ${className || ''}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        {/* Manila Theme Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal text-black mb-4" style={{ fontWeight: 400 }}>
            SALE PRODUCTS
          </h2>
        </div>

        {/* Manila Theme Product Grid */}
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

        {/* Manila Theme CTA */}
        {products.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/shop">
              <Button
                className="text-white font-medium transition-all duration-300"
                style={{
                  backgroundColor: '#32373c',
                  padding: 'calc(0.667em + 2px) calc(1.333em + 2px)',
                }}
              >
                View All Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
