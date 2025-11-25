/**
 * Test SEOPress Integration
 * This endpoint tests if SEOPress API is working correctly
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const wpUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
  // Fix: Remove /wp/v2 and ensure we have /wp-json prefix only once
  const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')
  const seopressEndpoint = `${baseUrl}/wp-json/seopress/v1`

  const results: any = {
    wordpress_url: wpUrl,
    seopress_endpoint: seopressEndpoint,
    tests: {}
  }

  try {
    // Test 1: Check if SEOPress settings endpoint is available
    console.log('🔍 Testing SEOPress Settings endpoint...')
    try {
      const settingsUrl = `${seopressEndpoint}/settings`
      const settingsResponse = await fetch(settingsUrl, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      results.tests.settings = {
        url: settingsUrl,
        status: settingsResponse.status,
        ok: settingsResponse.ok,
        data: settingsResponse.ok ? await settingsResponse.json() : null,
        error: !settingsResponse.ok ? `HTTP ${settingsResponse.status}: ${settingsResponse.statusText}` : null
      }
    } catch (error: any) {
      results.tests.settings = {
        error: error.message
      }
    }

    // Test 2: Check if we can get SEO metadata for a post
    console.log('🔍 Testing SEOPress Post metadata endpoint...')
    try {
      // First, get a sample post
      const postsResponse = await fetch(`${wpUrl}/posts?per_page=1`, {
        cache: 'no-store'
      })
      
      if (postsResponse.ok) {
        const posts = await postsResponse.json()
        if (posts && posts.length > 0) {
          const post = posts[0]
          const seoUrl = `${seopressEndpoint}/seo/post/${post.slug}`
          
          const seoResponse = await fetch(seoUrl, {
            cache: 'no-store',
            headers: {
              'Accept': 'application/json'
            }
          })
          
          results.tests.post_metadata = {
            url: seoUrl,
            post_slug: post.slug,
            post_title: post.title.rendered,
            status: seoResponse.status,
            ok: seoResponse.ok,
            data: seoResponse.ok ? await seoResponse.json() : null,
            error: !seoResponse.ok ? `HTTP ${seoResponse.status}: ${seoResponse.statusText}` : null
          }
        } else {
          results.tests.post_metadata = {
            error: 'No posts found in WordPress'
          }
        }
      } else {
        results.tests.post_metadata = {
          error: `Failed to fetch posts: ${postsResponse.status}`
        }
      }
    } catch (error: any) {
      results.tests.post_metadata = {
        error: error.message
      }
    }

    // Test 3: Check if standard WP REST API includes seopress_meta field
    console.log('🔍 Testing if WP REST API includes seopress_meta...')
    try {
      const postsResponse = await fetch(`${wpUrl}/posts?per_page=1`, {
        cache: 'no-store'
      })
      
      if (postsResponse.ok) {
        const posts = await postsResponse.json()
        if (posts && posts.length > 0) {
          const post = posts[0]
          results.tests.wp_rest_api = {
            has_seopress_meta: 'seopress_meta' in post,
            post_fields: Object.keys(post),
            seopress_data: post.seopress_meta || null
          }
        }
      }
    } catch (error: any) {
      results.tests.wp_rest_api = {
        error: error.message
      }
    }

    // Test 4: Check SEOPress plugin status
    console.log('🔍 Testing WordPress plugins endpoint...')
    try {
      // This might not work without authentication, but worth trying
      const pluginsUrl = `${baseUrl}/wp-json/wp/v2/plugins`
      const pluginsResponse = await fetch(pluginsUrl, {
        cache: 'no-store'
      })
      
      results.tests.plugins = {
        url: pluginsUrl,
        status: pluginsResponse.status,
        accessible: pluginsResponse.ok,
        note: pluginsResponse.ok ? 'Plugin endpoint accessible' : 'Plugin endpoint requires authentication (this is normal)'
      }
    } catch (error: any) {
      results.tests.plugins = {
        note: 'Plugin endpoint not accessible (this is normal for security)'
      }
    }

    // Determine overall integration status
    const isIntegrated = 
      results.tests.settings?.ok === true || 
      results.tests.post_metadata?.ok === true ||
      results.tests.wp_rest_api?.has_seopress_meta === true

    results.summary = {
      integrated: isIntegrated,
      message: isIntegrated 
        ? '✅ SEOPress appears to be properly integrated!' 
        : '❌ SEOPress integration not detected. Please check plugin installation and activation.',
      recommendations: []
    }

    // Only add critical recommendations if SEOPress data is completely missing
    if (!results.tests.wp_rest_api?.has_seopress_meta) {
      results.summary.recommendations.push('⚠️ CRITICAL: seopress_meta field not found in WP REST API - SEOPress plugin may not be activated')
    } else {
      // SEOPress is working via REST API, custom endpoints are optional
      if (!results.tests.settings?.ok) {
        results.summary.recommendations.push('ℹ️ Optional: seopress-headless-api plugin not detected - custom endpoints unavailable (but standard REST API is working)')
      }
      
      if (!results.tests.post_metadata?.ok) {
        results.summary.recommendations.push('ℹ️ Optional: Custom SEOPress endpoints not accessible (but standard REST API is providing all SEO data)')
      }
    }

    return NextResponse.json(results, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error('❌ Error testing SEOPress:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 })
  }
}

