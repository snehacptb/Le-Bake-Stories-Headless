import { NextRequest, NextResponse } from 'next/server'
import { imageCacheService } from '@/lib/image-cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = await imageCacheService.getStats()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'cleanup':
        const maxAge = parseInt(searchParams.get('maxAge') || '604800000') // 7 days default
        await imageCacheService.cleanup(maxAge)
        return NextResponse.json({
          success: true,
          message: 'Image cache cleanup completed'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use ?action=stats or ?action=cleanup'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error managing image cache:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'cache-products') {
      // Get products from request body or fetch from cache
      const body = await request.json()
      const products = body.products || []

      if (products.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No products provided'
        }, { status: 400 })
      }

      // Cache all product images
      await imageCacheService.cacheProductImages(products)

      const stats = await imageCacheService.getStats()
      return NextResponse.json({
        success: true,
        message: `Cached images for ${products.length} products`,
        stats
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error caching images:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
