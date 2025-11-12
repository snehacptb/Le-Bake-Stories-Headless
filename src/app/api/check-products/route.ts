/**
 * Check Products Cache Endpoint
 * GET /api/check-products
 */

import { NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'

export async function GET() {
  try {
    console.log('🔍 Checking cached products...')
    
    const products = await cacheService.getProducts()
    
    console.log(`📦 Found ${products.length} cached products`)
    
    return NextResponse.json({
      success: true,
      message: `Found ${products.length} cached products`,
      data: {
        count: products.length,
        sampleProducts: products.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          slug: p.slug
        }))
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error checking cached products:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check cached products',
      message: error.message
    }, { status: 500 })
  }
}
