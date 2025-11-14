import { NextRequest, NextResponse } from 'next/server'
import { woocommerceApi } from '@/lib/woocommerce-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get limit parameter (default to 3 for sidebar)
    const limit = parseInt(searchParams.get('limit') || '3')

    const params: any = {
      per_page: limit,
      orderby: 'rating', // Order by rating
      order: 'desc',      // Highest rated first
      status: 'publish',  // Only published products
    }

    console.log('Fetching top-rated products with params:', params)

    // Check WooCommerce availability first
    const isWooCommerceAvailable = await woocommerceApi.checkWooCommerceAvailability()

    if (!isWooCommerceAvailable) {
      const status = woocommerceApi.getWooCommerceStatus()
      console.warn('WooCommerce not available for top-rated products API:', status.error)

      return NextResponse.json({
        success: false,
        error: 'WooCommerce is not available',
        message: status.error || 'WooCommerce plugin may be deactivated',
        woocommerce_status: status,
        data: [] // Return empty array instead of throwing error
      }, { status: 503 })
    }

    // Fetch products from WooCommerce API
    const products = await woocommerceApi.getProducts(params)

    // Filter products to only include those with ratings > 0
    const ratedProducts = products.filter((product: any) =>
      product.average_rating && parseFloat(product.average_rating) > 0
    )

    return NextResponse.json({
      success: true,
      data: ratedProducts,
      count: ratedProducts.length
    })
  } catch (error) {
    console.error('Error fetching top-rated products:', error)

    // Check if this is a WooCommerce deactivation error
    if (error instanceof Error &&
        (error.message.includes('WooCommerce is not available') ||
         error.message.includes('plugin appears to be deactivated'))) {
      return NextResponse.json({
        success: false,
        error: 'WooCommerce is not available',
        message: error.message,
        data: []
      }, { status: 503 })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top-rated products',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: []
      },
      { status: 500 }
    )
  }
}
