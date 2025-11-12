/**
 * Secret Cache Refresh Endpoint
 * GET /api/cache/refresh?secret=YOUR_SECRET_KEY
 * 
 * This endpoint refreshes all cached WordPress and WooCommerce data
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const type = searchParams.get('type') as 'all' | 'products' | 'categories' | 'pages' | 'posts' | 'menus' | 'site-info' | null

    // Verify secret key
    const expectedSecret = process.env.CACHE_REFRESH_SECRET || 'your-secret-key'
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startTime = Date.now()

    if (type === 'all' || !type) {
      // Full cache refresh
      const metadata = await cacheService.refreshAll()
      const duration = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: 'Full cache refresh completed',
        metadata,
        duration: `${duration}ms`,
        stats: cacheService.getStats()
      })
    } else {
      // Partial cache refresh
      await cacheService.refreshPartial(type)
      const duration = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: `${type} cache refresh completed`,
        duration: `${duration}ms`,
        stats: cacheService.getStats()
      })
    }
  } catch (error: any) {
    console.error('Cache refresh error:', error)
    return NextResponse.json(
      { 
        error: 'Cache refresh failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { action, type, id } = body

    switch (action) {
      case 'invalidate':
        if (type && id) {
          await cacheService.invalidate(`${type}-${id}`)
          return NextResponse.json({
            success: true,
            message: `Cache invalidated for ${type}-${id}`
          })
        } else if (type) {
          await cacheService.invalidate(type)
          return NextResponse.json({
            success: true,
            message: `Cache invalidated for ${type}`
          })
        } else {
          await cacheService.clear()
          return NextResponse.json({
            success: true,
            message: 'All cache cleared'
          })
        }

      case 'stats':
        return NextResponse.json({
          success: true,
          stats: cacheService.getStats(),
          config: cacheService.getConfig()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Cache management error:', error)
    return NextResponse.json(
      { 
        error: 'Cache management failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
