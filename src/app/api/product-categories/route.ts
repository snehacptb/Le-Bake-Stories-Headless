import { NextResponse } from 'next/server'
import { cachedAPI } from '@/lib/cached-api'

export async function GET() {
  try {
    console.log('Fetching product categories from cache...')
    const categories = await cachedAPI.getProductCategories()
    
    console.log(`Found ${categories.length} product categories`)
    
    // Filter out categories with no products (count = 0)
    const filteredCategories = categories.filter(category => 
      category.count > 0
    )
    
    return NextResponse.json({
      success: true,
      data: filteredCategories,
      total: filteredCategories.length
    })
  } catch (error: any) {
    console.error('Error fetching product categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        data: []
      }, 
      { status: 500 }
    )
  }
}
