import { NextRequest, NextResponse } from 'next/server'
import { woocommerceApi } from '@/lib/woocommerce-api'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'Valid product ID is required' },
        { status: 400 }
      )
    }

    const productId = parseInt(id)
    console.log('Fetching product by ID:', productId)

    // Check WooCommerce availability first
    const isWooCommerceAvailable = await woocommerceApi.checkWooCommerceAvailability()
    
    if (!isWooCommerceAvailable) {
      const status = woocommerceApi.getWooCommerceStatus()
      console.warn('WooCommerce not available for product API:', status.error)
      
      return NextResponse.json({
        success: false,
        error: 'WooCommerce is not available',
        message: status.error || 'WooCommerce plugin may be deactivated',
        woocommerce_status: status
      }, { status: 503 })
    }

    // Fetch single product by ID from WooCommerce API
    const product = await woocommerceApi.getProduct(productId)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    
    // Check if this is a WooCommerce deactivation error
    if (error instanceof Error && 
        (error.message.includes('WooCommerce is not available') || 
         error.message.includes('plugin appears to be deactivated'))) {
      return NextResponse.json({
        success: false,
        error: 'WooCommerce is not available',
        message: error.message
      }, { status: 503 })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
