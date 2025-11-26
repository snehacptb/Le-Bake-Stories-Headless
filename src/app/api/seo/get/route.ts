/**
 * SEO Get API Route
 * Fetches SEOPress metadata for a specific post
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const slug = searchParams.get('slug')
    const type = searchParams.get('type') || 'post'

    const wpUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
    const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')

    console.log('=== SEO GET API DEBUG ===')
    console.log('Post ID:', postId)
    console.log('Slug:', slug)
    console.log('Type:', type)
    console.log('WP URL:', wpUrl)
    console.log('Base URL:', baseUrl)

    let seoData = null
    let debugInfo: any = {
      postId,
      slug,
      type,
      wpUrl,
      attempts: []
    }

    // Method 1: Fetch by Post ID (most reliable)
    if (postId) {
      try {
        // Get post data which includes seopress_meta field
        let endpoint = ''
        if (type === 'post') {
          endpoint = `${wpUrl}/posts/${postId}`
        } else if (type === 'product') {
          endpoint = `${baseUrl}/wp-json/wc/v3/products/${postId}`
        } else {
          endpoint = `${wpUrl}/pages/${postId}`
        }

        console.log('Fetching from:', endpoint)
        debugInfo.attempts.push({ method: 'postId', endpoint })

        const response = await fetch(endpoint, { cache: 'no-store' })
        const responseText = await response.text()

        console.log('Response status:', response.status)
        console.log('Response text (first 200 chars):', responseText.substring(0, 200))

        if (response.ok) {
          const post = JSON.parse(responseText)
          console.log('Post data keys:', Object.keys(post))
          console.log('Has seopress_meta:', 'seopress_meta' in post)

          if (post.seopress_meta) {
            seoData = post.seopress_meta
            console.log('SEO data found via postId!')
            debugInfo.attempts[0].success = true
            debugInfo.attempts[0].seoData = seoData
          } else {
            console.log('Post found but no seopress_meta field')
            debugInfo.attempts[0].success = false
            debugInfo.attempts[0].error = 'No seopress_meta field in response'
          }
        } else {
          console.log('Response not OK:', responseText)
          debugInfo.attempts[0].success = false
          debugInfo.attempts[0].error = `Status ${response.status}: ${responseText}`
        }
      } catch (error: any) {
        console.error('Error fetching by post ID:', error)
        debugInfo.attempts[debugInfo.attempts.length - 1].error = error.message
      }
    }

    // Method 2: Fetch by slug (fallback)
    if (!seoData && slug) {
      try {
        const endpoint = `${baseUrl}/wp-json/seopress/v1/seo/${type}/${slug}`
        console.log('Fallback: Fetching from custom endpoint:', endpoint)
        debugInfo.attempts.push({ method: 'slug', endpoint })

        const response = await fetch(endpoint, { cache: 'no-store' })
        const responseText = await response.text()

        console.log('Custom endpoint status:', response.status)
        console.log('Custom endpoint response:', responseText.substring(0, 200))

        if (response.ok) {
          seoData = JSON.parse(responseText)
          console.log('SEO data found via custom endpoint!')
          debugInfo.attempts[debugInfo.attempts.length - 1].success = true
          debugInfo.attempts[debugInfo.attempts.length - 1].seoData = seoData
        } else {
          console.log('Custom endpoint failed:', responseText)
          debugInfo.attempts[debugInfo.attempts.length - 1].success = false
          debugInfo.attempts[debugInfo.attempts.length - 1].error = `Status ${response.status}: ${responseText}`
        }
      } catch (error: any) {
        console.error('Error fetching by slug:', error)
        debugInfo.attempts[debugInfo.attempts.length - 1].error = error.message
      }
    }

    if (!seoData || Object.keys(seoData).length === 0) {
      console.log('=== NO SEO DATA FOUND ===')
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2))

      return NextResponse.json(
        {
          success: false,
          error: 'Could not fetch SEO data by post ID or slug',
          details: 'Please check WordPress plugin is active and Post ID exists',
          debug: debugInfo
        },
        { status: 404 }
      )
    }

    console.log('=== SEO DATA FETCHED SUCCESSFULLY ===')
    console.log('SEO data keys:', Object.keys(seoData))

    return NextResponse.json({
      success: true,
      data: seoData
    })
  } catch (error: any) {
    console.error('SEO fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

