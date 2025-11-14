'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Grid, List, ChevronDown, X, Home, Menu, Star, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductGrid } from './product-grid'
import { ProductCard } from './product-card'
import { PremiumSidebar } from '@/components/ui/sidebar'
import { PremiumProductCard } from '@/components/ui/product-card'
import { AceternityCard } from '@/components/ui/aceternity-card'
import { QuickViewModal } from '@/components/ui/quick-view-modal'
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
type ViewMode = 'grid' | 'grid-large' | 'list'

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
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [productsPerPage, setProductsPerPage] = useState(12)
  const [topRatedProducts, setTopRatedProducts] = useState<WooCommerceProduct[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [quickViewProduct, setQuickViewProduct] = useState<WooCommerceProduct | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)

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
    fetchTopRatedProducts()
  }, [currentPage, sortBy])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [products, filters, currentPage, productsPerPage])

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

  const fetchTopRatedProducts = async () => {
    try {
      // Fetch from WooCommerce API: orderby=rating&order=desc&per_page=10
      const res = await fetch('/api/products/top-rated?limit=10', { cache: 'no-store' })
      const json = await res.json()

      if (json.success) {
        setTopRatedProducts(json.data || [])
      } else {
        console.warn('Failed to fetch top-rated products:', json.error)
        setTopRatedProducts([])
      }
    } catch (err) {
      console.error('Failed to fetch top rated products:', err)
      setTopRatedProducts([])
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

    // On sale / Featured / In Stock
    if (filters.onSale) filtered = filtered.filter(p => p.on_sale)
    if (filters.featured) filtered = filtered.filter(p => p.featured)
    if (filters.inStock) filtered = filtered.filter(p => p.stock_status === 'instock')

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(p => parseFloat(p.average_rating || '0') >= filters.rating)
    }

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
    setQuickViewProduct(product)
    setShowQuickView(true)
  }

  const handleAddToWishlist = (product: WooCommerceProduct) => {
    // Add wishlist functionality here
    console.log('Added to wishlist:', product.name)
    // You can integrate with your wishlist context here
  }

  const handleFilterChange = (key: string, value: any) => {
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
    <div className={cn('min-h-screen bg-white', className)}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

        <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Breadcrumb and Toolbar Combined */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          {/* Left Side: Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-700">
            <a href="/" className="hover:text-gray-900 transition-colors">
              Home
            </a>
            <span>/</span>
            <span className="text-gray-900 font-medium">Shop</span>
          </nav>

          {/* Right Side: Show selector, view icons, and sort dropdown */}
          <div className="flex items-center gap-6">
            {/* Show selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Show:</span>
              <div className="flex items-center gap-1">
                {[9, 12, 18, 24].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setProductsPerPage(count);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-2 py-1 text-sm transition-colors",
                      productsPerPage === count
                        ? "text-gray-900 font-medium"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* View Toggle Icons */}
            <div className="flex items-center gap-1 border border-gray-300 rounded">
              {/* List View */}
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 transition-colors border-r border-gray-300",
                  viewMode === 'list' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                )}
                aria-label="List view"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="2" rx="1" />
                  <rect x="3" y="11" width="18" height="2" rx="1" />
                  <rect x="3" y="17" width="18" height="2" rx="1" />
                </svg>
              </button>
              
              {/* Grid View 2x2 */}
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 transition-colors border-r border-gray-300",
                  viewMode === 'grid' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                )}
                aria-label="Grid view 2x2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              
              {/* Grid View 3x3 */}
              <button
                onClick={() => setViewMode('grid-large')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'grid-large' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                )}
                aria-label="Grid view 3x3"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="5" height="5" rx="0.5" />
                  <rect x="9.5" y="2" width="5" height="5" rx="0.5" />
                  <rect x="17" y="2" width="5" height="5" rx="0.5" />
                  <rect x="2" y="9.5" width="5" height="5" rx="0.5" />
                  <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
                  <rect x="17" y="9.5" width="5" height="5" rx="0.5" />
                  <rect x="2" y="17" width="5" height="5" rx="0.5" />
                  <rect x="9.5" y="17" width="5" height="5" rx="0.5" />
                  <rect x="17" y="17" width="5" height="5" rx="0.5" />
                </svg>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 min-w-[200px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <PremiumSidebar
            isOpen={true}
            onClose={() => setShowSidebar(false)}
            categories={categories}
            topRatedProducts={topRatedProducts}
            filters={filters}
            onFilterChange={handleFilterChange}
            products={products}
          />

          {/* Mobile Sidebar */}
          <PremiumSidebar
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            categories={categories}
            topRatedProducts={topRatedProducts}
            filters={filters}
            onFilterChange={handleFilterChange}
            products={products}
            className="lg:hidden"
          />

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-6">
              <Button
                variant="outline"
                onClick={() => setShowSidebar(true)}
                className="flex items-center gap-2"
              >
                <Menu className="h-4 w-4" />
                Show sidebar
              </Button>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <AceternityCard className="mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {filters.search && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: {filters.search}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('search', '')}
                      />
                    </Badge>
                  )}
                  {filters.category && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Category: {categories.find(c => c.slug === filters.category)?.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('category', '')}
                      />
                    </Badge>
                  )}
                  {filters.onSale && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      On Sale
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('onSale', false)}
                      />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-themes-pink-600 hover:text-themes-pink-700"
                  >
                    Clear all
                  </Button>
                </div>
              </AceternityCard>
            )}

            {/* Error State */}
            {error && (
              <AceternityCard className="mb-6">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchProducts}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Try Again
                  </Button>
                </div>
              </AceternityCard>
            )}

            {/* Products Grid/List */}
            {loading ? (
              <div className={cn(
                'grid gap-4',
                viewMode === 'list' 
                  ? 'grid-cols-1'
                  : viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
              )}>
                {Array.from({ length: productsPerPage }).map((_, i) => (
                  <Skeleton key={i} className="h-96 w-full" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={cn(
                'grid',
                viewMode === 'list'
                  ? 'grid-cols-1 gap-6'
                  : viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3'
              )}>
                {filteredProducts.map((product, index) => (
                  <PremiumProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleQuickView}
                    onAddToWishlist={handleAddToWishlist}
                    variant={viewMode === 'list' ? 'compact' : 'default'}
                    priority={index < 6} // Add priority to first 6 products for LCP optimization
                  />
                ))}
              </div>
            ) : (
              <AceternityCard>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg mb-4">No products found</p>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="border-themes-pink-200 text-themes-pink-600 hover:bg-themes-pink-50"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </AceternityCard>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-gray-200">
                {/* Previous Arrow */}
                {currentPage > 1 && (
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                    aria-label="Previous page"
                  >
                    ←
                  </button>
                )}

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "px-3 py-2 transition-colors",
                        currentPage === page
                          ? "text-gray-900 font-bold"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      {page}
                    </button>
                  )
                })}

                {/* Next Arrow */}
                {currentPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                    aria-label="Next page"
                  >
                    →
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
      />
    </div>
  )
}
