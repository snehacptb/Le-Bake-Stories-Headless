'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Grid, List, ChevronDown, X, Home, Menu, Star, Sliders, Heart, ShoppingCart, CreditCard } from 'lucide-react'
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
import { useWishlist } from '@/contexts/wishlist-context'
import { useWooCommerceFeatures } from '@/contexts/woocommerce-context'
// import { cachedAPI } from '@/lib/cached-api' // replaced by API route fetches
import { WooCommerceProduct } from '@/types'
import { cn } from '@/lib/utils'

interface WordPressPage {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  slug?: string
  status?: string
}

interface ShopPageProps {
  initialProducts?: WooCommerceProduct[]
  shopBanner?: WordPressPage | null
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

// Component to load Elementor CSS for shop banner
function ElementorStylesLoader({ pageId }: { pageId?: number }) {
  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'

  useEffect(() => {
    if (!pageId) return

    const linkElements: HTMLLinkElement[] = []

    // Essential Elementor CSS
    const essentialCssUrls = [
      `${wpUrl}/wp-content/plugins/elementor/assets/css/frontend.min.css`,
      `${wpUrl}/wp-content/uploads/elementor/css/post-${pageId}.css`,
      `${wpUrl}/wp-content/plugins/elementor/assets/lib/eicons/css/elementor-icons.min.css`,
      `${wpUrl}/wp-content/plugins/elementor/assets/lib/animations/animations.min.css`,
    ]

    console.log(`🎨 Loading Elementor CSS for shop banner (page ${pageId})...`)

    essentialCssUrls.forEach((url, index) => {
      const linkId = `elementor-shop-css-${pageId}-${index}`

      if (document.getElementById(linkId)) {
        return
      }

      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = url

      link.onload = () => {
        console.log(`✅ Loaded: ${url.split('/').pop()}`)
      }

      link.onerror = () => {
        console.warn(`⚠️ Failed: ${url.split('/').pop()} (may not exist, continuing...)`)
      }

      document.head.appendChild(link)
      linkElements.push(link)
    })

    return () => {
      linkElements.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [pageId, wpUrl])

  return null
}

// Component to render Elementor banner content
function ShopBannerRenderer({ content, pageId }: { content: string; pageId?: number }) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [processedContent, setProcessedContent] = useState<string>('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Process and sanitize content
  useEffect(() => {
    if (content) {
      try {
        let processed = content
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'
        
        // Remove script tags
        processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        processed = processed.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        
        // Fix image URLs
        processed = processed.replace(
          /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
          (match, before, src, after) => {
            let imageUrl = src
            if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
              imageUrl = `${wpUrl.replace(/\/$/, '')}${imageUrl}`
            } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
              imageUrl = `${wpUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
            }
            const hasLoading = before.includes('loading=') || after.includes('loading=')
            const loadingAttr = hasLoading ? '' : ' loading="lazy"'
            return `<img${before}src="${imageUrl}"${after}${loadingAttr}>`
          }
        )
        
        // Fix background-image URLs
        processed = processed.replace(
          /style=["']([^"']*background-image:\s*url\(["']?)([^"')]+)(["']?\)[^"']*)["']/gi,
          (match, prefix, url, suffix) => {
            let imageUrl = url
            if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
              imageUrl = `${wpUrl.replace(/\/$/, '')}${imageUrl}`
            } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
              imageUrl = `${wpUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
            }
            return `style="${prefix}${imageUrl}${suffix}"`
          }
        )
        
        setProcessedContent(processed)
      } catch (error) {
        console.error('Error processing shop banner content:', error)
        setProcessedContent(content)
      }
    }
  }, [content])

  // Render content
  useEffect(() => {
    if (!isMounted || !processedContent || !contentRef.current) return

    let isMountedRef = true
    let rafId: number | null = null

    rafId = requestAnimationFrame(() => {
      if (!isMountedRef || !contentRef.current) return

      try {
        contentRef.current.innerHTML = processedContent
      } catch (error) {
        console.error('Error rendering shop banner:', error)
      }
    })

    return () => {
      isMountedRef = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (contentRef.current) {
        try {
          contentRef.current.textContent = ''
        } catch (cleanupError) {
          console.warn('Cleanup warning (safe to ignore):', cleanupError)
        }
      }
    }
  }, [processedContent, isMounted])

  if (!isMounted) {
    return (
      <div className="w-full h-64 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 animate-pulse" />
    )
  }

  return (
    <>
      {pageId && <ElementorStylesLoader pageId={pageId} />}
      <div
        ref={contentRef}
        className="shop-elementor-banner elementor-content"
        suppressHydrationWarning
      />
    </>
  )
}

export function ShopPage({ initialProducts = [], shopBanner, className }: ShopPageProps) {
  const { addToCart, itemCount } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { shouldShowShop } = useWooCommerceFeatures()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  
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
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
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

  const handleBrowseCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen)
    // Optionally navigate to categories page or show category modal
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'minPrice' && value === 0) return false
    if (key === 'maxPrice' && value === 0) return false
    if (key === 'inStock' && value === false) return false
    return value !== '' && value !== false && value !== 0
  })

  return (
    <div className={cn('min-h-screen bg-gray-50 shop-page', className)}>
      {/* Shop Banner - Elementor or Fallback */}
      {shopBanner?.content?.rendered ? (
        <div className="shop-banner-wrapper">
          <ShopBannerRenderer 
            content={shopBanner.content.rendered} 
            pageId={shopBanner.id}
          />
        </div>
      ) : (
        /* Fallback Mobile Hero Section */
        <div className="lg:hidden bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 relative" style={{ minHeight: '200px' }}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 h-full min-h-[200px] flex flex-col items-center justify-center text-white px-4">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Shop</h1>
            <button 
              onClick={handleBrowseCategories}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-2.5 rounded-full border border-white/30 hover:bg-white/30 transition-all tap-target"
            >
              <span className="text-base font-medium">Categories</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isCategoriesOpen && "rotate-180")} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        {/* Breadcrumb and Toolbar Combined */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-6 pb-4 border-b border-gray-200 bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-4">
          {/* Top Row: Breadcrumb & Results Count */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/" className="hover:text-gray-900 transition-colors">
                Home
              </a>
              <span>/</span>
              <span className="text-gray-900 font-medium">Shop</span>
            </nav>
            <span className="text-sm text-gray-500 hidden sm:block">
              Showing {((currentPage - 1) * productsPerPage) + 1}–{Math.min(currentPage * productsPerPage, filteredProducts.length)} of {products.length} results
            </span>
          </div>

          {/* Bottom Row: Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Show selector - Desktop only */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-gray-700 whitespace-nowrap">Show:</span>
              <div className="flex items-center gap-1">
                {[9, 12, 18, 24].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setProductsPerPage(count);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-3 py-1 text-sm transition-colors rounded",
                      productsPerPage === count
                        ? "text-gray-900 font-medium bg-gray-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: View Toggle & Sort */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* View Toggle Icons - Desktop only */}
              <div className="hidden md:flex items-center border border-gray-300 rounded overflow-hidden">
                {/* List View */}
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors border-r border-gray-300",
                    viewMode === 'list' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  )}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>

                {/* Grid View 2x2 */}
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors border-r border-gray-300",
                    viewMode === 'grid' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  )}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>

                {/* Grid View 3x3 */}
                <button
                  onClick={() => setViewMode('grid-large')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid-large' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  )}
                  aria-label="Large grid view"
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

              {/* Sort Dropdown - Full width on mobile */}
              <div className="flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent min-w-[200px] sm:min-w-[220px]"
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
        </div>

        <div className="flex gap-4 lg:gap-6">
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
          <main className="flex-1 min-w-0">
            {/* Mobile Controls Bar */}
            <div className="lg:hidden flex items-center justify-between mb-4 bg-white -mx-4 px-4 py-3 sticky top-0 z-10 shadow-sm">
              <button
                onClick={() => setShowSidebar(true)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors tap-target"
              >
                <Menu className="h-5 w-5" />
                <span className="text-sm font-medium">Show sidebar</span>
              </button>
              <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors tap-target">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <AceternityCard className="mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  {filters.search && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      Search: {filters.search}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange('search', '')}
                      />
                    </Badge>
                  )}
                  {filters.category && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      Category: {categories.find(c => c.slug === filters.category)?.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange('category', '')}
                      />
                    </Badge>
                  )}
                  {filters.onSale && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
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
                    className="text-themes-pink-600 hover:text-themes-pink-700 text-xs sm:text-sm h-auto py-1"
                  >
                    Clear all
                  </Button>
                </div>
              </AceternityCard>
            )}

            {/* Error State */}
            {error && (
              <AceternityCard className="mb-4 sm:mb-6">
                <div className="text-center py-4 sm:py-6">
                  <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchProducts}
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                  >
                    Try Again
                  </Button>
                </div>
              </AceternityCard>
            )}

            {/* Products Grid/List */}
            {loading ? (
              <div className={cn(
                'grid gap-3 sm:gap-4',
                viewMode === 'list'
                  ? 'grid-cols-1'
                  : viewMode === 'grid'
                  ? 'grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              )}>
                {Array.from({ length: productsPerPage }).map((_, i) => (
                  <Skeleton key={i} className="h-80 sm:h-96 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={cn(
                'grid gap-3 sm:gap-4 pb-20 lg:pb-0',
                viewMode === 'list'
                  ? 'grid-cols-1'
                  : viewMode === 'grid'
                  ? 'grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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
                <div className="text-center py-6 sm:py-8 px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-base sm:text-lg mb-3 sm:mb-4">No products found</p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-themes-pink-200 text-themes-pink-600 hover:bg-themes-pink-50 text-sm sm:text-base"
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
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    "px-4 py-2 rounded border transition-all tap-target",
                    currentPage === 1
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  )}
                  aria-label="Previous page"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">←</span>
                </button>

                {/* Page Numbers - Responsive */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => {
                    const page = i + 1
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    
                    if (!showPage && page === currentPage - 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    if (!showPage && page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    if (!showPage) return null

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "min-w-[44px] h-11 px-3 rounded transition-all tap-target",
                          currentPage === page
                            ? "bg-gray-900 text-white font-semibold"
                            : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                        )}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "px-4 py-2 rounded border transition-all tap-target",
                    currentPage === totalPages
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  )}
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">→</span>
                </button>
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

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 mobile-bottom-nav z-30 safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {/* Filters */}
          <button
            onClick={() => setShowSidebar(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-600 hover:text-gray-900 transition-colors tap-target relative"
          >
            <Sliders className="h-5 w-5" />
            <span className="text-[10px] font-medium">Filters</span>
          </button>

          {/* Compare */}
          <button className="flex flex-col items-center justify-center gap-0.5 text-gray-600 hover:text-gray-900 transition-colors tap-target relative">
            <div className="relative">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px] bg-gray-900 text-white border border-white">
                0
              </Badge>
            </div>
            <span className="text-[10px] font-medium">Compare</span>
          </button>

          {/* Wishlist */}
          <button 
            onClick={() => router.push('/wishlist')}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-600 hover:text-gray-900 transition-colors tap-target relative"
          >
            <Heart className="h-5 w-5" />
            <span className="text-[10px] font-medium">Wishlist</span>
          </button>

          {/* Cart */}
          <button 
            onClick={() => router.push('/cart')}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-600 hover:text-gray-900 transition-colors tap-target relative"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px] bg-red-500 text-white border border-white">
                  {itemCount}
                </Badge>
              )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
          </button>

          {/* Checkout */}
          <button 
            onClick={() => router.push('/checkout')}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-600 hover:text-gray-900 transition-colors tap-target relative"
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Checkout</span>
          </button>
        </div>
      </div>

      {/* Elementor Banner Styles */}
      <style jsx global>{`
        /* Shop banner wrapper - full width */
        .shop-banner-wrapper {
          width: 100%;
          margin: 0;
          padding: 0;
        }

        /* Elementor content styling for shop banner */
        .shop-elementor-banner {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0;
        }

        .shop-elementor-banner .elementor-section {
          width: 100%;
          position: relative;
          margin: 0;
          padding: 0;
        }

        .shop-elementor-banner .elementor-container {
          max-width: 100%;
          margin: 0 auto;
          padding-left: 0;
          padding-right: 0;
        }

        .shop-elementor-banner .elementor-row {
          display: flex;
          flex-wrap: wrap;
          margin-left: 0;
          margin-right: 0;
        }

        .shop-elementor-banner .elementor-column {
          position: relative;
          min-height: 1px;
        }

        /* Image fixes */
        .shop-elementor-banner img {
          max-width: 100%;
          height: auto;
          display: block;
        }

        .shop-elementor-banner img[src=""],
        .shop-elementor-banner img:not([src]) {
          display: none;
        }

        /* Ensure all Elementor elements use border-box */
        .shop-elementor-banner *,
        .shop-elementor-banner *::before,
        .shop-elementor-banner *::after {
          box-sizing: border-box;
        }

        /* Prevent any global styles from interfering */
        .shop-banner-wrapper {
          isolation: isolate;
        }

        /* Ensure Elementor widgets are not constrained */
        .shop-elementor-banner .elementor-widget {
          width: 100%;
        }

        /* Remove any prose or typography overrides */
        .shop-elementor-banner .prose,
        .shop-elementor-banner .prose * {
          max-width: none;
          color: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        /* Responsive text for shop banner */
        @media (max-width: 768px) {
          .shop-elementor-banner .elementor-heading-title {
            font-size: clamp(1.5rem, 5vw, 3rem) !important;
          }
        }
      `}</style>
    </div>
  )
}
