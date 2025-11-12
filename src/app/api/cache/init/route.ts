/**
 * Cache Initialization Endpoint
 * GET /api/cache/init?secret=YOUR_SECRET_KEY
 * 
 * This endpoint initializes all cached data from WordPress and WooCommerce
 * and stores it locally for faster access
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Verify secret key
    const expectedSecret = process.env.CACHE_REFRESH_SECRET || 'your-secret-key'
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting cache initialization...')
    const startTime = Date.now()

    // Initialize all cache data
    const results = await Promise.allSettled([
      cacheService.cacheSiteInfo(),
      cacheService.cacheMenus(),
      cacheService.cacheProducts(),
      cacheService.cacheProductCategories(),
      cacheService.cachePages(),
      cacheService.cachePosts()
    ])

    const duration = Date.now() - startTime
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    // Log any failures with detailed information
    const types = ['site-info', 'menus', 'products', 'categories', 'pages', 'posts']
    const failureDetails: any[] = []
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const errorMessage = result.reason?.message || result.reason
        console.error(`❌ Failed to cache ${types[index]}:`, errorMessage)
        
        // Check for specific WooCommerce authentication errors
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          console.error(`🔑 ${types[index]} authentication issue detected:`)
          console.error('   Please check your WooCommerce API key permissions:')
          console.error('   1. Go to WooCommerce → Settings → Advanced → REST API')
          console.error('   2. Edit your API key and ensure permissions are set to "Read" or "Read/Write"')
          console.error('   3. Make sure the API key is associated with an Administrator user')
        }
        
        failureDetails.push({
          type: types[index],
          error: errorMessage,
          isAuthError: errorMessage.includes('401') || errorMessage.includes('Unauthorized')
        })
      } else {
        console.log(`✅ Successfully cached ${types[index]}`)
      }
    })
    
    // Add failure details to response for debugging
    if (failureDetails.length > 0) {
      console.error('📋 Cache initialization failure summary:', failureDetails)
    }

    console.log(`✅ Cache initialization completed: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: 'Cache initialization completed',
      results: {
        successful,
        failed,
        total: results.length,
        failures: failureDetails.length > 0 ? failureDetails : undefined
      },
      duration: `${duration}ms`,
      stats: cacheService.getStats()
    })
  } catch (error: any) {
    console.error('Cache initialization error:', error)
    return NextResponse.json(
      { 
        error: 'Cache initialization failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
