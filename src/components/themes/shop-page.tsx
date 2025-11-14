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
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [productsPerPage, setProductsPerPage] = useState(12)
  const [topRatedProducts, setTopRatedProducts] = useState<WooCommerceProduct[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })

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
      const res = await fetch('/api/cache/products', { cache: 'no-store' })
      const json = await res.json()
      const allProducts = json?.data || []
      
      // Get top 3 highest rated products
      const topRated = [...allProducts]
        .filter(p => parseFloat(p.average_rating || '0') > 0)
        .sort((a, b) => parseFloat(b.average_rating || '0') - parseFloat(a.average_rating || '0'))
        .slice(0, 3)
      
      setTopRatedProducts(topRated)
    } catch (err) {
      console.error('Failed to fetch top rated products:', err)
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
    router.push(`/product/${product.slug}`)
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

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6 py-3">
          <a href="/" className="hover:text-gray-700 transition-colors flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </a>
          <span>/</span>
          <span className="text-gray-900">Shop</span>
        </nav>

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

            {/* Results Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <p className="text-gray-600 text-sm">
                  Showing {filteredProducts.length > 0 ? ((currentPage - 1) * productsPerPage) + 1 : 0}–{Math.min(currentPage * productsPerPage, (currentPage - 1) * productsPerPage + filteredProducts.length)} of {products.filter(p => {
                    let filtered = true;
                    if (filters.search.trim()) {
                      const term = filters.search.toLowerCase();
                      filtered = filtered && (
                        p.name.toLowerCase().includes(term) ||
                        (p.short_description || '').toLowerCase().includes(term) ||
                        (p.description || '').toLowerCase().includes(term)
                      );
                    }
                    if (filters.category) {
                      filtered = filtered && p.categories?.some(c => c.slug === filters.category);
                    }
                    if (filters.minPrice > 0) {
                      filtered = filtered && parseFloat(p.price) >= filters.minPrice;
                    }
                    if (filters.maxPrice > 0) {
                      filtered = filtered && parseFloat(p.price) <= filters.maxPrice;
                    }
                    if (filters.onSale) filtered = filtered && p.on_sale;
                    if (filters.featured) filtered = filtered && p.featured;
                    if (filters.inStock) filtered = filtered && p.stock_status === 'instock';
                    if (filters.rating > 0) {
                      filtered = filtered && parseFloat(p.average_rating || '0') >= filters.rating;
                    }
                    return filtered;
                  }).length} results
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Products Per Page Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={productsPerPage}
                    onChange={(e) => {
                      setProductsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                  >
                    <option value="9">9</option>
                    <option value="12">12</option>
                    <option value="18">18</option>
                    <option value="24">24</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none px-3 py-2"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none px-3 py-2"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
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
                  <PremiumProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleQuickView}
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
              <div className="flex justify-center items-center gap-2 mt-8">
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
          </main>
        </div>
      </div>
    </div>
  )
}
