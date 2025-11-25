/**
 * SEO Update API Route
 * Updates SEOPress metadata for a specific post (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    
    const { post_id, ...seoData } = body
    
    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      )
    }

    const wpUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
    const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')
    
    // Call WordPress SEO update endpoint
    const response = await fetch(`${baseUrl}/wp-json/seopress/v1/update/${post_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seoData),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WordPress SEO update error:', errorText)
      return NextResponse.json(
        { error: 'Failed to update SEO data', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error: any) {
    console.error('SEO update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

