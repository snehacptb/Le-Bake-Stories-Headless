import { NextRequest, NextResponse } from 'next/server'
import { woocommerceApi } from '@/lib/woocommerce-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const params: any = {}
    
    // Common WooCommerce product parameters
    if (searchParams.get('per_page')) params.per_page = parseInt(searchParams.get('per_page')!)
    if (searchParams.get('page')) params.page = parseInt(searchParams.get('page')!)
    if (searchParams.get('search')) params.search = searchParams.get('search')
    if (searchParams.get('slug')) params.slug = searchParams.get('slug')
    if (searchParams.get('category')) params.category = searchParams.get('category')
    if (searchParams.get('tag')) params.tag = searchParams.get('tag')
    if (searchParams.get('featured')) params.featured = searchParams.get('featured') === 'true'
    if (searchParams.get('on_sale')) params.on_sale = searchParams.get('on_sale') === 'true'
    if (searchParams.get('orderby')) params.orderby = searchParams.get('orderby')
    if (searchParams.get('order')) params.order = searchParams.get('order')
    if (searchParams.get('status')) params.status = searchParams.get('status')
    if (searchParams.get('type')) params.type = searchParams.get('type')
    if (searchParams.get('sku')) params.sku = searchParams.get('sku')
    if (searchParams.get('parent')) params.parent = parseInt(searchParams.get('parent')!)
    if (searchParams.get('exclude')) {
      const exclude = searchParams.get('exclude')!
      params.exclude = exclude.includes(',') ? exclude.split(',').map(id => parseInt(id)) : [parseInt(exclude)]
    }
    if (searchParams.get('include')) {
      const include = searchParams.get('include')!
      params.include = include.includes(',') ? include.split(',').map(id => parseInt(id)) : [parseInt(include)]
    }

    console.log('Fetching products with params:', params)

    // Check WooCommerce availability first
    const isWooCommerceAvailable = await woocommerceApi.checkWooCommerceAvailability()
    
    if (!isWooCommerceAvailable) {
      const status = woocommerceApi.getWooCommerceStatus()
      console.warn('WooCommerce not available for products API:', status.error)
      
      return NextResponse.json({
        success: false,
        error: 'WooCommerce is not available',
        message: status.error || 'WooCommerce plugin may be deactivated',
        woocommerce_status: status,
        data: [] // Return empty array instead of throwing error
      }, { status: 503 }) // Service Unavailable
    }

    // Fetch products from WooCommerce API
    const products = await woocommerceApi.getProducts(params)

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    
    // Check if this is a WooCommerce deactivation error
    if (error instanceof Error && 
        (error.message.includes('WooCommerce is not available') || 
         error.message.includes('plugin appears to be deactivated'))) {
      return NextResponse.json({
        success: false,
        error: 'WooCommerce is not available',
        message: error.message,
        data: [] // Return empty array for graceful degradation
      }, { status: 503 })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
