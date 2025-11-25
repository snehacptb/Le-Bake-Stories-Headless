/**
 * SEOPress Health Check Endpoint
 * Checks if SEOPress plugin is active and working
 */

import { NextResponse } from 'next/server'
import { seopressService } from '@/lib/seopress-service'

export async function GET() {
  try {
    const health = await seopressService.checkHealth()

    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error: any) {
    console.error('❌ Health check error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      health: {
        active: false,
        customEndpoints: false,
        restAPI: false,
        message: '❌ Health check failed'
      }
    }, { status: 500 })
  }
}

