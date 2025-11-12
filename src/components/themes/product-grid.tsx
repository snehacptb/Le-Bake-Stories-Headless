'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid, List, Filter, SortAsc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from './product-card'
import { cn } from '@/lib/utils'
import { WooCommerceProduct, ProductFilters } from '@/types'

interface ProductGridProps {
  products: WooCommerceProduct[]
  loading?: boolean
  showFilters?: boolean
  showSorting?: boolean
  showViewToggle?: boolean
  filters?: ProductFilters
  onFiltersChange?: (filters: ProductFilters) => void
  onAddToCart?: (product: WooCommerceProduct) => void
  onAddToWishlist?: (productId: number) => void
  onQuickView?: (product: WooCommerceProduct) => void
  className?: string
}

type ViewMode = 'grid' | 'list'
type SortOption = 'default' | 'price-low' | 'price-high' | 'name' | 'date' | 'popularity' | 'rating'

const sortOptions = [
  { value: 'default' as SortOption, label: 'Default sorting' },
  { value: 'popularity' as SortOption, label: 'Sort by popularity' },
  { value: 'rating' as SortOption, label: 'Sort by average rating' },
  { value: 'date' as SortOption, label: 'Sort by latest' },
  { value: 'price-low' as SortOption, label: 'Sort by price: low to high' },
  { value: 'price-high' as SortOption, label: 'Sort by price: high to low' },
  { value: 'name' as SortOption, label: 'Sort by name: A to Z' },
]

export function ProductGrid({
  products = [],
  loading = false,
  showFilters = true,
  showSorting = true,
  showViewToggle = true,
  filters,
  onFiltersChange,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  className
}: ProductGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [sortedProducts, setSortedProducts] = useState<WooCommerceProduct[]>(products || [])

  useEffect(() => {
    if (!products || !Array.isArray(products)) {
      setSortedProducts([])
      return
    }

    let sorted = [...products]

    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
      case 'price-high':
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'date':
        sorted.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
        break
      case 'popularity':
        sorted.sort((a, b) => b.total_sales - a.total_sales)
        break
      case 'rating':
        sorted.sort((a, b) => parseFloat(b.average_rating) - parseFloat(a.average_rating))
        break
      default:
        // Keep original order
        break
    }

    setSortedProducts(sorted)
  }, [products, sortBy])

  const ProductSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600">
            Showing {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
          </p>
          
          {/* Active Filters */}
          {filters && (
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="text-xs">
                  Category: {filters.category}
                </Badge>
              )}
              {filters.minPrice && (
                <Badge variant="secondary" className="text-xs">
                  Min: ${filters.minPrice}
                </Badge>
              )}
              {filters.maxPrice && (
                <Badge variant="secondary" className="text-xs">
                  Max: ${filters.maxPrice}
                </Badge>
              )}
              {filters.onSale && (
                <Badge variant="sale" className="text-xs">
                  On Sale
                </Badge>
              )}
              {filters.featured && (
                <Badge variant="featured" className="text-xs">
                  Featured
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Sorting */}
          {showSorting && (
            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-themes-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none border-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filter criteria to find what you're looking for.
                </p>
                <Button
                  variant="themes-outline"
                  onClick={() => onFiltersChange?.({})}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}>
              {sortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    variant={viewMode === 'list' ? 'compact' : 'default'}
                    priority={index < 4} // Add priority to first 4 products for LCP optimization
                    onAddToCart={onAddToCart}
                    onAddToWishlist={onAddToWishlist}
                    onQuickView={onQuickView}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
