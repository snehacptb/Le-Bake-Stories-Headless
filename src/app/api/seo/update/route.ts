import { NextRequest, NextResponse } from 'next/server'

/**
 * SEO Update API Route
 * Updates SEO metadata for a post via WordPress REST API
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization required' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { post_id, ...seoData } = body

    if (!post_id) {
      return NextResponse.json(
        { success: false, message: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get WordPress API URL
    const wpUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL

    if (!wpUrl) {
      return NextResponse.json(
        { success: false, message: 'WordPress API URL not configured' },
        { status: 500 }
      )
    }

    const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')

    // Call WordPress REST API to update SEO data
    const response = await fetch(`${baseUrl}/wp-json/seopress/v1/update/${post_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(seoData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WordPress API error:', errorText)

      return NextResponse.json(
        {
          success: false,
          message: `WordPress API returned ${response.status}: ${errorText}`,
        },
        { status: response.status }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'SEO data updated successfully',
      data: result,
    })
  } catch (error: any) {
    console.error('Error updating SEO data:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update SEO data',
      },
      { status: 500 }
    )
  }
}
