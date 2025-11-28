import { Suspense } from 'react'
import { ClientLayout } from '@/components/themes/client-layout'
import { BestSellersSection } from '@/components/themes/best-sellers-section'
import { BlogCard } from '@/components/themes/blog-card'
import { TestimonialsCarousel } from '@/components/themes/testimonials-carousel'
import { CategoriesCarousel } from '@/components/themes/categories-carousel'
import { HeroBanner } from '@/components/themes/hero-banner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { wordpressAPI } from '@/lib/api'
import { WooCommerceProduct, WordPressPost, Testimonial, Banner } from '@/types'
import { CachedProductCategory } from '@/lib/cache-types'
import { withRetry } from '@/lib/api-utils'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Helper function to wrap API calls with retry logic and timeout
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  fallback: T,
  operationName: string,
  maxRetries: number = 2
): Promise<T> {
  try {
    return await withRetry(fetchFn, maxRetries, 1000)
  } catch (error) {
    console.error(`❌ Failed to fetch ${operationName} after ${maxRetries + 1} attempts:`, error)
    return fallback
  }
}

// Fetch different product types
async function getSaleProducts(): Promise<WooCommerceProduct[]> {
  return fetchWithRetry(
    async () => {
      const products = await woocommerceApi.getProducts({
        on_sale: true,
        per_page: 10,
        status: 'publish',
        orderby: 'date',
        order: 'desc'
      })
      console.log(`✅ Fetched ${products.length} sale products`)
      return products
    },
    [],
    'sale products'
  )
}

async function getNewProducts(): Promise<WooCommerceProduct[]> {
  return fetchWithRetry(
    async () => {
      const products = await woocommerceApi.getProducts({
        orderby: 'date',
        order: 'desc',
        per_page: 6,
        status: 'publish'
      })
      console.log(`✅ Fetched ${products.length} new products`)
      return products
    },
    [],
    'new products'
  )
}

async function getFeaturedProducts(): Promise<WooCommerceProduct[]> {
  return fetchWithRetry(
    async () => {
      const products = await woocommerceApi.getFeaturedProducts(6)
      console.log(`✅ Fetched ${products.length} featured products`)
      return products
    },
    [],
    'featured products'
  )
}

async function getTopSellers(): Promise<WooCommerceProduct[]> {
  return fetchWithRetry(
    async () => {
      const products = await woocommerceApi.getProducts({
        orderby: 'popularity',
        order: 'desc',
        per_page: 6,
        status: 'publish'
      })
      console.log(`✅ Fetched ${products.length} top seller products`)
      return products
    },
    [],
    'top sellers'
  )
}

async function getLatestPosts(): Promise<WordPressPost[]> {
  return fetchWithRetry(
    async () => {
      const response = await wordpressAPI.getPosts({ per_page: 3, _embed: true })
      console.log(`✅ Fetched ${response.data.length} latest posts`)
      return response.data
    },
    [],
    'latest posts'
  )
}

async function getProductCategories(): Promise<CachedProductCategory[]> {
  return fetchWithRetry(
    async () => {
      console.log('🔍 Fetching product categories for home page...')
      // During build time, directly use the cached API instead of making HTTP requests
      if (typeof window === 'undefined') {
        // Server-side: use cached API directly
        const { cachedAPI } = await import('@/lib/cached-api')
        const categories = await cachedAPI.getProductCategories()
        // Ensure we return an array
        const result = Array.isArray(categories) ? categories : []
        console.log(`✅ Fetched ${result.length} product categories from cached API`)
        return result
      }

      // Client-side: use API route
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/product-categories`)

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        console.warn('⚠️ Received non-JSON response for product categories, likely an error page')
        throw new Error('Received non-JSON response for product categories')
      }

      const result = await response.json()
      const categories = result.success && Array.isArray(result.data) ? result.data : []
      console.log(`✅ Fetched ${categories.length} product categories from API route`)
      return categories
    },
    [],
    'product categories',
    3 // More retries for critical content
  )
}

async function getTestimonials(): Promise<Testimonial[]> {
  return fetchWithRetry(
    async () => {
      console.log('🔍 Fetching testimonials for shop home page...')
      const response = await wordpressAPI.getTestimonials({ per_page: 6, orderby: 'date', order: 'desc' })
      console.log(`✅ Successfully fetched ${response.data.length} testimonials for shop home page`)
      
      // Log each testimonial for debugging
      response.data.forEach((testimonial, index) => {
        console.log(`🛍️ Testimonial ${index + 1}: ${testimonial.name} (${testimonial.role}) - ${testimonial.comment?.substring(0, 50)}...`)
      })
      
      return response.data
    },
    [],
    'testimonials'
  )
}

async function getBanners(): Promise<Banner[]> {
  return fetchWithRetry(
    async () => {
      console.log('🔍 Fetching banners for home page...')
      const banners = await wordpressAPI.getBannersByPage('home')
      console.log(`✅ Successfully fetched ${banners.length} banners for home page`)
      
      // Log each banner for debugging
      banners.forEach((banner, index) => {
        console.log(`🎯 Banner ${index + 1}: ${banner.title} (Order: ${banner.order})`)
      })
      
      return banners
    },
    [],
    'banners',
    3 // More retries for critical hero content
  )
}

// Loading components

function BlogCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="aspect-[16/10] w-full animate-pulse rounded-md bg-gray-200" />
      <div className="space-y-2">
        <div className="h-4 w-1/4 animate-pulse rounded-md bg-gray-200" />
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded-md bg-gray-200" />
      </div>
    </div>
  )
}



// Configure page revalidation - regenerate every 60 seconds for fresh content
export const revalidate = 60

export default async function HomePage() {
  const startTime = Date.now()
  console.log('🏠 Rendering Le Bake Stories ecommerce home page')

  // Use Promise.allSettled to prevent one failure from crashing the entire page
  // Fetch all data in parallel with retry logic
  const results = await Promise.allSettled([
    getSaleProducts(),
    getNewProducts(),
    getFeaturedProducts(),
    getTopSellers(),
    getProductCategories(),
    getLatestPosts(),
    getTestimonials(),
    getBanners()
  ])

  // Extract results, defaulting to empty arrays on failure
  const saleProducts = results[0].status === 'fulfilled' ? results[0].value : []
  const newProducts = results[1].status === 'fulfilled' ? results[1].value : []
  const featuredProducts = results[2].status === 'fulfilled' ? results[2].value : []
  const topSellers = results[3].status === 'fulfilled' ? results[3].value : []
  const productCategories = results[4].status === 'fulfilled' ? results[4].value : []
  const latestPosts = results[5].status === 'fulfilled' ? results[5].value : []
  const testimonials = results[6].status === 'fulfilled' ? results[6].value : []
  const banners = results[7].status === 'fulfilled' ? results[7].value : []

  // Log any failures with detailed error information
  const names = ['saleProducts', 'newProducts', 'featuredProducts', 'topSellers', 'productCategories', 'latestPosts', 'testimonials', 'banners']
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`❌ Failed to fetch ${names[index]} after retries:`, result.reason)
    }
  })
  
  const loadTime = Date.now() - startTime
  const dataStatus = {
    saleProducts: saleProducts.length,
    newProducts: newProducts.length,
    featuredProducts: featuredProducts.length,
    topSellers: topSellers.length,
    productCategories: productCategories.length,
    latestPosts: latestPosts.length,
    testimonials: testimonials.length,
    banners: banners.length,
    loadTime: `${loadTime}ms`
  }
  
  console.log('🛍️ Home page data loaded:', dataStatus)
  
  // Warn if critical sections are missing
  if (productCategories.length === 0) console.warn('⚠️ No product categories loaded - section will not display')
  if (banners.length === 0) console.warn('⚠️ No banners loaded - hero section will not display')
  if (latestPosts.length === 0) console.warn('⚠️ No blog posts loaded - blog section will not display')
  
  // Check if we have at least some product data
  const hasProducts = saleProducts.length > 0 || newProducts.length > 0 || featuredProducts.length > 0 || topSellers.length > 0
  if (!hasProducts) console.error('❌ No products loaded - product sections will be empty!')
  
  console.log(`✅ Home page ready to render (${loadTime}ms)`)

  return (
    <ClientLayout>
      {/* Hero Banner - Only show if banners exist */}
      {banners.length > 0 && <HeroBanner banners={banners} />}

      {/* Categories Section - RIGHT AFTER BANNER */}
      {productCategories.length > 0 && (
        <section className="py-16 lg:py-20" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '1222px' }}>
            {/* Header with underline */}
            <div className="mb-12">
              <h2
                className="font-normal text-black uppercase mb-0"
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  paddingBottom: '15px',
                  borderBottom: '1px solid #e5e5e5'
                }}
              >
                TOP CATEGORIES
              </h2>
            </div>

            {/* Categories Carousel - With slide functionality */}
            <CategoriesCarousel categories={productCategories} />
          </div>
        </section>
      )}

      {/* Products Section with Tabs */}
      <BestSellersSection
        saleProducts={saleProducts}
        newProducts={newProducts}
        featuredProducts={featuredProducts}
        topSellers={topSellers}
      />

      {/* Testimonials - Manila Theme Style */}
      {testimonials.length > 0 && (
        <section className="py-16 lg:py-20" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '1222px' }}>
            <div className="text-center mb-16">
              <h2
                className="font-normal text-black mb-0 uppercase tracking-wide"
                style={{
                  fontSize: 'clamp(32px, 4vw, 40px)',
                  fontWeight: 400,
                  letterSpacing: '0.05em'
                }}
              >
                CUSTOMER REVIEWS
              </h2>
            </div>

            <TestimonialsCarousel testimonials={testimonials} />

            {testimonials.length > 6 && (
              <div className="text-center mt-16">
                <Link href="/testimonials">
                  <Button
                    className="font-medium transition-all duration-300 hover:opacity-80 uppercase"
                    style={{
                      backgroundColor: '#32373c',
                      color: '#ffffff',
                      padding: 'calc(0.667em + 2px) calc(1.333em + 2px)',
                      border: 'none',
                      borderRadius: '0',
                      fontSize: '14px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    View All Reviews
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest Blog Posts - Manila Theme Style */}
      {latestPosts.length > 0 && (
        <section className="py-16 lg:py-20" style={{ backgroundColor: '#ffffff' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '1222px' }}>
            <div className="text-center mb-16">
              <h2
                className="font-normal text-black mb-0 uppercase tracking-wide"
                style={{
                  fontSize: 'clamp(32px, 4vw, 40px)',
                  fontWeight: 400,
                  letterSpacing: '0.05em'
                }}
              >
                OUR BLOG
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '30px' }}>
              <Suspense fallback={
                <>
                  <BlogCardSkeleton />
                  <BlogCardSkeleton />
                  <BlogCardSkeleton />
                </>
              }>
                {latestPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </Suspense>
            </div>

            <div className="text-center mt-16">
              <Link href="/blog">
                <Button
                  className="font-medium transition-all duration-300 hover:opacity-80 uppercase"
                  style={{
                    backgroundColor: '#32373c',
                    color: '#ffffff',
                    padding: 'calc(0.667em + 2px) calc(1.333em + 2px)',
                    border: 'none',
                    borderRadius: '0',
                    fontSize: '14px',
                    letterSpacing: '0.05em'
                  }}
                >
                  View All Posts
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </ClientLayout>
  )
}
