import { NextRequest, NextResponse } from 'next/server'
import { wordpressAPI } from '@/lib/api'

export async function GET(_request: NextRequest) {
  try {
    const categories = await wordpressAPI.getCategories()
    return NextResponse.json({ success: true, data: categories })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}


