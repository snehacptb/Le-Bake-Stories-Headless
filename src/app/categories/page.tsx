import { Suspense } from 'react'
import { ClientLayout } from '@/components/themes/client-layout'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CachedProductCategory } from '@/lib/cache-types'
import Link from 'next/link'

async function getProductCategories(): Promise<CachedProductCategory[]> {
  try {
    // During build time, directly use the cached API instead of making HTTP requests
    if (typeof window === 'undefined') {
      // Server-side: use cached API directly
      const { cachedAPI } = await import('@/lib/cached-api')
      return await cachedAPI.getProductCategories()
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
    return result.success ? result.data : []
  } catch (error) {
    console.error('Error fetching product categories:', error)
    return []
  }
}

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function CategoriesPage() {
  const productCategories = await getProductCategories()

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <Badge variant="featured" className="mb-4">Product Categories</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our complete collection of product categories and find exactly what you're looking for
              </p>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Suspense fallback={<CategoriesSkeleton />}>
              {productCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {productCategories.map((category, index) => {
                    // Category-specific placeholder images
                    const getCategoryPlaceholder = (categoryName: string, index: number) => {
                      const name = categoryName.toLowerCase()
                      
                      // Category-specific images from Unsplash
                      if (name.includes('clothing') || name.includes('apparel') || name.includes('fashion')) {
                        return 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('electronics') || name.includes('tech') || name.includes('gadget')) {
                        return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('home') || name.includes('decor') || name.includes('furniture')) {
                        return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('book') || name.includes('education') || name.includes('learning')) {
                        return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('sport') || name.includes('fitness') || name.includes('outdoor')) {
                        return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('beauty') || name.includes('cosmetic') || name.includes('skincare')) {
                        return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('jewelry') || name.includes('accessories')) {
                        return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('food') || name.includes('grocery') || name.includes('kitchen')) {
                        return 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('toy') || name.includes('game') || name.includes('kids')) {
                        return 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      } else if (name.includes('automotive') || name.includes('car') || name.includes('vehicle')) {
                        return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      }
                      
                      // Fallback images with variety
                      const fallbackImages = [
                        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      ]
                      return fallbackImages[index % fallbackImages.length]
                    }
                    
                    const imageUrl = category.image?.src || getCategoryPlaceholder(category.name, index)
                    
                    return (
                      <Link key={category.id} href={`/shop?category=${category.slug}`}>
                        <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <div 
                              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                              style={{ backgroundImage: `url(${imageUrl})` }}
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center text-center">
                              <div>
                                <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                                <p className="text-white/90 text-sm">{category.count} Products</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Categories Found</h3>
                  <p className="text-gray-600 mb-8">
                    It looks like there are no product categories available at the moment.
                  </p>
                  <Link href="/shop">
                    <button className="bg-themes-blue-600 text-white px-6 py-3 rounded-md hover:bg-themes-blue-700 transition-colors">
                      Browse All Products
                    </button>
                  </Link>
                </div>
              )}
            </Suspense>
          </div>
        </section>
      </div>
    </ClientLayout>
  )
}

export const metadata = {
  title: 'Product Categories | Shop by Category',
  description: 'Browse all product categories and find exactly what you\'re looking for in our comprehensive collection.',
}
