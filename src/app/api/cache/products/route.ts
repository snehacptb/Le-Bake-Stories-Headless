import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'
import { transformProductImages } from '@/lib/image-utils'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured') === 'true'
    const onSale = searchParams.get('onSale') === 'true'

    console.log('🔄 [API-PRODUCTS] Starting products API request...')
    console.log('🔍 [API-PRODUCTS] Filters:', { category, featured, onSale })

    // Try cache first
    let products = await cacheService.getProducts()
    console.log('📦 [API-PRODUCTS] Cache result:', products ? `${products.length} products` : 'empty')

    // If cache is missing or empty, fetch from WooCommerce and cache
    if (!Array.isArray(products) || products.length === 0) {
      console.log('🔄 [API-PRODUCTS] Cache empty, fetching from WooCommerce...')
      try {
        products = await cacheService.cacheProducts()
        console.log('✅ [API-PRODUCTS] Successfully fetched products:', products ? `${products.length} products` : 'empty')

        // Force-write cache file to disk to ensure availability even if caching disabled
        try {
          if (Array.isArray(products)) {
            const cacheDir = path.join(process.cwd(), '.next', 'cache', 'wordpress')
            await fs.mkdir(cacheDir, { recursive: true })
            const filePath = path.join(cacheDir, 'products.json')
            const cacheData = {
              data: products,
              lastUpdated: new Date().toISOString(),
              expiry: (cacheService.getConfig && cacheService.getConfig().cacheExpiry) || 60
            }
            await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2))
            console.log('💾 [API-PRODUCTS] Cache file written successfully')
          }
        } catch (writeErr) {
          console.error('❌ [API-PRODUCTS] Failed to write products cache file:', writeErr)
        }
      } catch (cacheError: any) {
        console.error('❌ [API-PRODUCTS] Failed to cache products:', cacheError.message)
        
        // Provide helpful error information
        if (cacheError.message?.includes('Authentication')) {
          console.error('🔑 [API-PRODUCTS] Authentication Error: Check WooCommerce API credentials')
        } else if (cacheError.message?.includes('Network') || cacheError.message?.includes('ECONNREFUSED')) {
          console.error('🌐 [API-PRODUCTS] Network Error: Check WordPress site connectivity')
        } else if (cacheError.message?.includes('SSL') || cacheError.message?.includes('certificate')) {
          console.error('🔒 [API-PRODUCTS] SSL Error: Consider using HTTP for development')
        }
        
        // Return empty array instead of throwing to prevent 500 error
        products = []
      }
    }

    // Ensure products is an array
    if (!Array.isArray(products)) {
      console.warn('⚠️ [API-PRODUCTS] Products is not an array, defaulting to empty array')
      products = []
    }

    let filtered = products

    if (category) {
      filtered = filtered.filter((p: any) => p.categories?.some((c: any) => c.slug === category))
    }
    if (featured) {
      filtered = filtered.filter((p: any) => p.featured)
    }
    if (onSale) {
      filtered = filtered.filter((p: any) => p.on_sale)
    }

    console.log('🔍 [API-PRODUCTS] Filtered products:', filtered.length)

    // Transform image URLs to use cached versions
    let transformedProducts = filtered
    try {
      transformedProducts = await transformProductImages(filtered)
      console.log('🖼️ [API-PRODUCTS] Image transformation completed')
    } catch (imageError) {
      console.error('❌ [API-PRODUCTS] Image transformation failed:', imageError)
      // Continue with original products if image transformation fails
    }

    console.log('✅ [API-PRODUCTS] Returning products:', transformedProducts.length)
    return NextResponse.json({ success: true, data: transformedProducts })
  } catch (error: any) {
    console.error('❌ [API-PRODUCTS] Critical error:', error.message)
    console.error('❌ [API-PRODUCTS] Error stack:', error.stack)
    
    // Return a more informative error response
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        type: error.constructor.name
      } : undefined
    }, { status: 500 })
  }
}
