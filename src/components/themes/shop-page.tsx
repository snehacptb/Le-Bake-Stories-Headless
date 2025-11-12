'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Grid, List, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductGrid } from './product-grid'
import { ProductCard } from './product-card'
import { useCart } from '@/contexts/cart-context'
import { useWooCommerceFeatures } from '@/contexts/woocommerce-context'
// import { cachedAPI } from '@/lib/cached-api' // replaced by API route fetches
import { WooCommerceProduct } from '@/types'
import { cn } from '@/lib/utils'

interface ShopPageProps {
  initialProducts?: WooCommerceProduct[]
  className?: string
}

interface ShopFilters {
  search: string
  category: string
  minPrice: number
  maxPrice: number
  onSale: boolean
  featured: boolean
  inStock: boolean
  rating: number
}

type SortOption = 'menu_order' | 'popularity' | 'rating' | 'date' | 'price' | 'price-desc' | 'title'
type ViewMode = 'grid' | 'list'

const sortOptions = [
  { value: 'menu_order' as SortOption, label: 'Default sorting' },
  { value: 'popularity' as SortOption, label: 'Sort by popularity' },
  { value: 'rating' as SortOption, label: 'Sort by average rating' },
  { value: 'date' as SortOption, label: 'Sort by newness' },
  { value: 'price' as SortOption, label: 'Sort by price: low to high' },
  { value: 'price-desc' as SortOption, label: 'Sort by price: high to low' },
  { value: 'title' as SortOption, label: 'Sort by name: A to Z' },
]

export function ShopPage({ initialProducts = [], className }: ShopPageProps) {
  const { addToCart } = useCart()
  const { shouldShowShop } = useWooCommerceFeatures()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [products, setProducts] = useState<WooCommerceProduct[]>(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState<WooCommerceProduct[]>(initialProducts)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('menu_order')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [productsPerPage, setProductsPerPage] = useState(12)

  const [filters, setFilters] = useState<ShopFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: parseInt(searchParams.get('minPrice') || '0'),
    maxPrice: parseInt(searchParams.get('maxPrice') || '0'),
    onSale: searchParams.get('onSale') === 'true',
    featured: searchParams.get('featured') === 'true',
    inStock: searchParams.get('inStock') === 'true',
    rating: parseInt(searchParams.get('rating') || '0'),
  })

  // Fetch products and categories
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [currentPage, sortBy])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [products, filters])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice > 0) params.set('maxPrice', filters.maxPrice.toString())
    if (filters.onSale) params.set('onSale', 'true')
    if (filters.featured) params.set('featured', 'true')
    if (filters.inStock) params.set('inStock', 'true')
    if (filters.rating > 0) params.set('rating', filters.rating.toString())
    
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    
    // Only update URL if it's different from current URL
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [filters, pathname, router])

  // Handle URL parameter changes (e.g., browser back/forward)
  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      minPrice: parseInt(searchParams.get('minPrice') || '0'),
      maxPrice: parseInt(searchParams.get('maxPrice') || '0'),
      onSale: searchParams.get('onSale') === 'true',
      featured: searchParams.get('featured') === 'true',
      inStock: searchParams.get('inStock') === 'true',
      rating: parseInt(searchParams.get('rating') || '0'),
    }
    
    setFilters(newFilters)
  }, [searchParams])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch all cached products from API route
      const res = await fetch('/api/cache/products', { cache: 'no-store' })
      const json = await res.json()
      const allProducts = json?.data || []
      
      // Apply sorting
      const sortedProducts = [...allProducts].sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return parseFloat(a.price) - parseFloat(b.price)
          case 'price-desc':
            return parseFloat(b.price) - parseFloat(a.price)
          case 'title':
            return a.name.localeCompare(b.name)
          case 'date':
            // Sort by date_created or date_modified (newest first)
            const dateA = new Date(a.date_created || a.date_modified || 0).getTime()
            const dateB = new Date(b.date_created || b.date_modified || 0).getTime()
            return dateB - dateA
          case 'popularity':
            // Sort by total_sales if available, otherwise by date
            const salesA = parseInt(a.total_sales || '0')
            const salesB = parseInt(b.total_sales || '0')
            if (salesA !== salesB) return salesB - salesA
            return new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime()
          case 'rating':
            // Sort by average_rating if available, otherwise by date
            const ratingA = parseFloat(a.average_rating || '0')
            const ratingB = parseFloat(b.average_rating || '0')
            if (ratingA !== ratingB) return ratingB - ratingA
            return new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime()
          case 'menu_order':
          default:
            // Default WordPress sorting: menu_order ASC, then by title ASC
            const menuOrderA = parseInt(a.menu_order || '0')
            const menuOrderB = parseInt(b.menu_order || '0')
            if (menuOrderA !== menuOrderB) return menuOrderA - menuOrderB
            return a.name.localeCompare(b.name)
        }
      })
      
      // Store all sorted products (filters will be applied separately)
      setProducts(sortedProducts)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/product-categories', { cache: 'no-store' })
      const json = await res.json()
      const fetchedCategories = json?.data || []
      setCategories(fetchedCategories)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...products]

    // Search filter
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        (p.short_description || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(p => p.categories?.some(c => c.slug === filters.category))
    }

    // Price filters
    if (filters.minPrice > 0) {
      filtered = filtered.filter(p => parseFloat(p.price) >= filters.minPrice)
    }
    if (filters.maxPrice > 0) {
      filtered = filtered.filter(p => parseFloat(p.price) <= filters.maxPrice)
    }

    // On sale / Featured
    if (filters.onSale) filtered = filtered.filter(p => p.on_sale)
    if (filters.featured) filtered = filtered.filter(p => p.featured)

    // Calculate total pages based on filtered results
    const totalFilteredPages = Math.ceil(filtered.length / productsPerPage)
    setTotalPages(totalFilteredPages)
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > totalFilteredPages && totalFilteredPages > 0) {
      setCurrentPage(1)
    }

    // Apply pagination to filtered results
    const startIndex = (currentPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    const paginatedFiltered = filtered.slice(startIndex, endIndex)

    setFilteredProducts(paginatedFiltered)
  }, [products, filters, currentPage, productsPerPage])

  const handleAddToCart = async (product: WooCommerceProduct) => {
    try {
      await addToCart(product, 1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const handleQuickView = (product: WooCommerceProduct) => {
    router.push(`/product/${product.slug}`)
  }

  const handleFilterChange = (key: keyof ShopFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: 0,
      maxPrice: 0,
      onSale: false,
      featured: false,
      inStock: false,
      rating: 0,
    })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'minPrice' && value === 0) return false
    if (key === 'maxPrice' && value === 0) return false
    if (key === 'inStock' && value === false) return false
    return value !== '' && value !== false && value !== 0
  })

  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop</h1>
        <p className="text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              {Object.values(filters).filter(v => v && v !== 0 && v !== 0 && v !== false).length}
            </Badge>
          )}
        </Button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.onSale}
                      onChange={(e) => handleFilterChange('onSale', e.target.checked)}
                      className="mr-2"
                    />
                    On Sale
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured}
                      onChange={(e) => handleFilterChange('featured', e.target.checked)}
                      className="mr-2"
                    />
                    Featured
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                      className="mr-2"
                    />
                    In Stock
                  </label>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4}>4+ Stars</option>
                    <option value={3}>3+ Stars</option>
                    <option value={2}>2+ Stars</option>
                    <option value={1}>1+ Stars</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Products Grid/List */}
      {loading ? (
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        )}>
          {Array.from({ length: productsPerPage }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        )}>
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onQuickView={handleQuickView}
              variant={viewMode === 'list' ? 'compact' : 'default'}
              priority={index < 4} // Add priority to first 4 products for LCP optimization
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No products found</p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
