/**
 * SEO Get API Route
 * Fetches SEOPress metadata for a specific post
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const type = searchParams.get('type') || 'post'
    
    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      )
    }

    const wpUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
    const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')
    
    // Fetch SEO data from WordPress
    const response = await fetch(`${baseUrl}/wp-json/seopress/v1/seo/${type}/${slug}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Failed to fetch SEO data', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('SEO fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

