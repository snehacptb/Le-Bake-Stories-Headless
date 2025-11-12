import { NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'

export async function POST() {
  try {
    console.log('🔄 Refreshing site info cache...')
    
    // Clear existing cache and fetch fresh data
    await cacheService.invalidate('site-info')
    const freshSiteInfo = await cacheService.cacheSiteInfo()
    
    console.log('✅ Site info cache refreshed:', freshSiteInfo)
    
    return NextResponse.json({ 
      success: true, 
      data: freshSiteInfo,
      message: 'Site info cache refreshed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Failed to refresh site info cache:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
