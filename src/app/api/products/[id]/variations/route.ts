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
    console.log('Fetching variations for product ID:', productId)

    // Fetch product variations from WooCommerce API
    const variations = await woocommerceApi.getProductVariations(productId)

    return NextResponse.json({
      success: true,
      data: variations || [],
      count: variations?.length || 0
    })
  } catch (error) {
    console.error('Error fetching product variations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product variations',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [] // Return empty array as fallback
      },
      { status: 500 }
    )
  }
}
