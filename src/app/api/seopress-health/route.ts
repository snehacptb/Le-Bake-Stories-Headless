import { NextRequest, NextResponse } from 'next/server'

/**
 * SEOPress Health Check API
 * Checks if SEOPress plugin is active and working
 */
export async function GET(request: NextRequest) {
  try {
    const wpUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL

    if (!wpUrl) {
      return NextResponse.json({
        success: false,
        health: {
          active: false,
          message: 'WordPress API URL not configured',
          restAPI: false,
          customEndpoints: false,
        }
      }, { status: 500 })
    }

    const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')

    // Check custom SEOPress endpoint
    let customEndpointsActive = false
    try {
      const customResponse = await fetch(`${baseUrl}/wp-json/seopress/v1/settings`, {
        next: { revalidate: 60 } // Cache for 1 minute
      })
      customEndpointsActive = customResponse.ok
    } catch (error) {
      customEndpointsActive = false
    }

    // Check REST API for seopress_meta field
    let restAPIActive = false
    try {
      const restResponse = await fetch(`${wpUrl}/posts?per_page=1`, {
        next: { revalidate: 60 }
      })

      if (restResponse.ok) {
        const posts = await restResponse.json()
        if (posts && posts.length > 0) {
          restAPIActive = 'seopress_meta' in posts[0]
        }
      }
    } catch (error) {
      restAPIActive = false
    }

    const isActive = customEndpointsActive || restAPIActive

    return NextResponse.json({
      success: true,
      health: {
        active: isActive,
        message: isActive
          ? 'SEOPress is active and working'
          : 'SEOPress plugin may not be active or configured correctly',
        restAPI: restAPIActive,
        customEndpoints: customEndpointsActive,
      }
    })
  } catch (error: any) {
    console.error('SEOPress health check error:', error)

    return NextResponse.json({
      success: false,
      health: {
        active: false,
        message: `Health check failed: ${error.message}`,
        restAPI: false,
        customEndpoints: false,
      }
    }, { status: 500 })
  }
}
