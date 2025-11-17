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
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// This would be fetched from your WordPress/WooCommerce API
async function getFeaturedProducts(): Promise<WooCommerceProduct[]> {
  try {
    return await woocommerceApi.getFeaturedProducts(8)
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

async function getLatestPosts(): Promise<WordPressPost[]> {
  try {
    const response = await wordpressAPI.getPosts({ per_page: 3 })
    return response.data
  } catch (error) {
    console.error('Error fetching latest posts:', error)
    return []
  }
}

async function getProductCategories(): Promise<CachedProductCategory[]> {
  try {
    // During build time, directly use the cached API instead of making HTTP requests
    if (typeof window === 'undefined') {
      // Server-side: use cached API directly
      try {
        const { cachedAPI } = await import('@/lib/cached-api')
        const categories = await cachedAPI.getProductCategories()
        // Ensure we return an array
        return Array.isArray(categories) ? categories : []
      } catch (importError) {
        console.error('Error importing or calling cached API:', importError)
        return []
      }
    }
    
    // Client-side: use API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/product-categories`)
    
    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.warn('Received non-JSON response for product categories, likely an error page')
      return []
    }
    
    const result = await response.json()
    return result.success && Array.isArray(result.data) ? result.data : []
  } catch (error) {
    console.error('Error fetching product categories:', error)
    return []
  }
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    console.log('🔍 Fetching testimonials for shop home page...')
    const response = await wordpressAPI.getTestimonials({ per_page: 6, orderby: 'date', order: 'desc' })
    console.log(`✅ Successfully fetched ${response.data.length} testimonials for shop home page`)
    
    // Log each testimonial for debugging
    response.data.forEach((testimonial, index) => {
      console.log(`🛍️ Testimonial ${index + 1}: ${testimonial.name} (${testimonial.role}) - ${testimonial.comment?.substring(0, 50)}...`)
    })
    
    return response.data
  } catch (error) {
    console.error('❌ Error fetching testimonials for shop home page:', error)
    return []
  }
}

async function getBanners(): Promise<Banner[]> {
  try {
    console.log('🔍 Fetching banners for home page...')
    const banners = await wordpressAPI.getActiveBanners()
    console.log(`✅ Successfully fetched ${banners.length} active banners for home page`)
    
    // Log each banner for debugging
    banners.forEach((banner, index) => {
      console.log(`🎯 Banner ${index + 1}: ${banner.title} (Order: ${banner.order})`)
    })
    
    return banners
  } catch (error) {
    console.error('❌ Error fetching banners for home page:', error)
    return []
  }
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



export default async function HomePage() {
  console.log('🏠 Rendering Le Bake Stories ecommerce home page')

  // Use Promise.allSettled to prevent one failure from crashing the entire page
  const results = await Promise.allSettled([
    getFeaturedProducts(),
    getProductCategories(),
    getLatestPosts(),
    getTestimonials(),
    getBanners()
  ])

  // Extract results, defaulting to empty arrays on failure
  const featuredProducts = results[0].status === 'fulfilled' ? results[0].value : []
  const productCategories = results[1].status === 'fulfilled' ? results[1].value : []
  const latestPosts = results[2].status === 'fulfilled' ? results[2].value : []
  const testimonials = results[3].status === 'fulfilled' ? results[3].value : []
  const banners = results[4].status === 'fulfilled' ? results[4].value : []

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const names = ['featuredProducts', 'productCategories', 'latestPosts', 'testimonials', 'banners']
      console.error(`❌ Failed to fetch ${names[index]}:`, result.reason)
    }
  })
  
  console.log('🛍️ Home page data loaded:', {
    featuredProducts: featuredProducts.length,
    productCategories: productCategories.length,
    latestPosts: latestPosts.length,
    testimonials: testimonials.length,
    banners: banners.length
  })

  return (
    <ClientLayout>
      {/* Hero Banner - Only show if banners exist */}
      {banners.length > 0 && <HeroBanner banners={banners} />}

      {/* Featured Products */}
      <BestSellersSection products={featuredProducts} />

      {/* Categories Section - WoodMart Style */}
      {productCategories.length > 0 && (
        <section className="py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
                <Badge variant="secondary" className="mx-4 px-6 py-2 bg-purple-100 text-purple-800 border-purple-200 font-medium uppercase tracking-wide">
                  Categories
                </Badge>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 bg-clip-text text-transparent">
                  Shop by Category
                </span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Explore our carefully curated collection of premium baked goods.
                <span className="block mt-2 text-base text-gray-500">
                  From artisanal breads to decadent desserts, find exactly what you're craving.
                </span>
              </p>
            </div>

            <CategoriesCarousel categories={productCategories} />

            {productCategories.length > 6 && (
              <div className="text-center mt-16">
                <div className="inline-flex flex-col items-center">
                  <Link href="/categories">
                    <Button 
                      size="lg" 
                      className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      View All Categories
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-sm text-gray-500 mt-3">
                    {productCategories.length}+ categories to explore
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials - WoodMart Style */}
      {testimonials.length > 0 && (
        <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
                <Badge variant="secondary" className="mx-4 px-6 py-2 bg-blue-100 text-blue-800 border-blue-200 font-medium uppercase tracking-wide">
                  Customer Reviews
                </Badge>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 bg-clip-text text-transparent">
                  What People Say
                </span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Real stories from our satisfied customers who love our baked goods.
                <span className="block mt-2 text-base text-gray-500">
                  Join thousands of happy customers who trust Le Bake Stories for quality.
                </span>
              </p>
            </div>

            <TestimonialsCarousel testimonials={testimonials} />

            {testimonials.length > 6 && (
              <div className="text-center mt-16">
                <div className="inline-flex flex-col items-center">
                  <Link href="/testimonials">
                    <Button 
                      size="lg" 
                      className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      View All Testimonials
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-sm text-gray-500 mt-3">
                    Read {testimonials.length}+ customer reviews
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest Blog Posts - WoodMart Style */}
      {latestPosts.length > 0 && (
        <section className="py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
                <Badge variant="secondary" className="mx-4 px-6 py-2 bg-green-100 text-green-800 border-green-200 font-medium uppercase tracking-wide">
                  From Our Blog
                </Badge>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-16"></div>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-green-900 via-green-800 to-green-900 bg-clip-text text-transparent">
                  Latest Articles
                </span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Stay updated with baking tips, recipes, and behind-the-scenes stories.
                <span className="block mt-2 text-base text-gray-500">
                  Expert insights and delicious inspiration from our master bakers.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
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
              <div className="inline-flex flex-col items-center">
                <Link href="/blog">
                  <Button 
                    size="lg" 
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    View All Articles
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-3">
                  Discover more baking insights and recipes
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </ClientLayout>
  )
}
