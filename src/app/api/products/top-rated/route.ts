import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'
import { transformProductImages } from '@/lib/image-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get limit parameter (default to 3 for top-rated products)
    const limit = parseInt(searchParams.get('limit') || '3')

    console.log('🔄 [API-TOP-RATED] Starting top-rated products API request...')
    console.log('🔍 [API-TOP-RATED] Limit:', limit)

    // Try cache first
    let products = await cacheService.getProducts()
    console.log('📦 [API-TOP-RATED] Cache result:', products ? `${products.length} products` : 'empty')

    // If cache is missing or empty, fetch from WooCommerce and cache
    if (!Array.isArray(products) || products.length === 0) {
      console.log('🔄 [API-TOP-RATED] Cache empty, fetching from WooCommerce...')
      try {
        products = await cacheService.cacheProducts()
        console.log('✅ [API-TOP-RATED] Successfully fetched products:', products ? `${products.length} products` : 'empty')
      } catch (cacheError: any) {
        console.error('❌ [API-TOP-RATED] Failed to cache products:', cacheError.message)
        
        // Provide helpful error information
        if (cacheError.message?.includes('Authentication')) {
          console.error('🔑 [API-TOP-RATED] Authentication Error: Check WooCommerce API credentials')
        } else if (cacheError.message?.includes('Network') || cacheError.message?.includes('ECONNREFUSED')) {
          console.error('🌐 [API-TOP-RATED] Network Error: Check WordPress site connectivity')
        } else if (cacheError.message?.includes('SSL') || cacheError.message?.includes('certificate')) {
          console.error('🔒 [API-TOP-RATED] SSL Error: Consider using HTTP for development')
        }
        
        // Return empty array instead of throwing to prevent 500 error
        products = []
      }
    }

    // Ensure products is an array
    if (!Array.isArray(products)) {
      console.warn('⚠️ [API-TOP-RATED] Products is not an array, defaulting to empty array')
      products = []
    }

    // Filter and sort products by rating
    let topRatedProducts = products
      .filter((product: any) => {
        // Include products with ratings > 0, or if no rating data exists, include all products
        const rating = parseFloat(product.average_rating || '0')
        const ratingCount = parseInt(product.rating_count || '0')
        
        // If product has rating data and rating > 0, include it
        if (rating > 0) return true
        
        // If no rating data exists, include popular products (by sales or featured status)
        if (!product.average_rating && !product.rating_count) {
          return product.featured || parseInt(product.total_sales || '0') > 0
        }
        
        return false
      })
      .sort((a: any, b: any) => {
        // Primary sort: by average rating (highest first)
        const ratingA = parseFloat(a.average_rating || '0')
        const ratingB = parseFloat(b.average_rating || '0')
        
        if (ratingA !== ratingB) {
          return ratingB - ratingA
        }
        
        // Secondary sort: by rating count (most reviews first)
        const countA = parseInt(a.rating_count || '0')
        const countB = parseInt(b.rating_count || '0')
        
        if (countA !== countB) {
          return countB - countA
        }
        
        // Tertiary sort: by total sales (most popular first)
        const salesA = parseInt(a.total_sales || '0')
        const salesB = parseInt(b.total_sales || '0')
        
        if (salesA !== salesB) {
          return salesB - salesA
        }
        
        // Final sort: by date (newest first)
        const dateA = new Date(a.date_created || 0).getTime()
        const dateB = new Date(b.date_created || 0).getTime()
        return dateB - dateA
      })
      .slice(0, limit) // Limit the results

    console.log('🔍 [API-TOP-RATED] Filtered top-rated products:', topRatedProducts.length)

    // Transform image URLs to use cached versions
    let transformedProducts = topRatedProducts
    try {
      transformedProducts = await transformProductImages(topRatedProducts)
      console.log('🖼️ [API-TOP-RATED] Image transformation completed')
    } catch (imageError) {
      console.error('❌ [API-TOP-RATED] Image transformation failed:', imageError)
      // Continue with original products if image transformation fails
    }

    console.log('✅ [API-TOP-RATED] Returning top-rated products:', transformedProducts.length)
    
    return NextResponse.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length
    })
  } catch (error: any) {
    console.error('❌ [API-TOP-RATED] Critical error:', error.message)
    console.error('❌ [API-TOP-RATED] Error stack:', error.stack)
    
    // Return a more informative error response
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      data: [],
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        type: error.constructor.name
      } : undefined
    }, { status: 500 })
  }
}
