import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      )
    }

    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'
    const cssUrls: string[] = []

    // 1. Add Elementor global styles (always needed)
    const globalStyles = [
      `${wpUrl}/wp-content/plugins/elementor/assets/css/frontend.min.css`,
      `${wpUrl}/wp-content/uploads/elementor/css/global.css`,
      `${wpUrl}/wp-content/uploads/elementor/css/post-${pageId}.css`
    ]

    // Try to fetch the page HTML to extract ALL CSS links
    try {
      const pageUrl = `${wpUrl}/?p=${pageId}`
      console.log(`🔍 Fetching Elementor CSS from: ${pageUrl}`)

      const htmlResponse = await fetch(pageUrl, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Next.js)'
        }
      })

      if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch page: ${htmlResponse.status}`)
      }

      const html = await htmlResponse.text()

      // Extract ALL CSS links from the page (not just Elementor-specific)
      const cssLinkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css[^"']*)["'][^>]*>|<link[^>]*href=["']([^"']+\.css[^"']*)["'][^>]*rel=["']stylesheet["'][^>]*>/gi
      const matches = Array.from(html.matchAll(cssLinkRegex))

      const extractedUrls = matches.map(match => {
        const cssUrl = match[1] || match[2]
        // Handle relative URLs
        if (!cssUrl) return null

        const fullUrl = cssUrl.startsWith('http')
          ? cssUrl
          : cssUrl.startsWith('//')
            ? `https:${cssUrl}`
            : `${wpUrl.replace(/\/$/, '')}${cssUrl.startsWith('/') ? '' : '/'}${cssUrl}`

        return fullUrl
      }).filter(Boolean) as string[]

      // Filter to get Elementor-related CSS files
      const elementorUrls = extractedUrls.filter(url =>
        url.includes('elementor') ||
        url.includes('/uploads/') ||
        url.includes('post-' + pageId)
      )

      console.log(`✅ Found ${elementorUrls.length} Elementor CSS files from HTML`)

      // Add extracted URLs
      for (const url of elementorUrls) {
        if (!cssUrls.includes(url)) {
          cssUrls.push(url)
        }
      }

      // Add global styles if not already included
      for (const url of globalStyles) {
        if (!cssUrls.includes(url)) {
          // Verify the file exists before adding
          const checkResponse = await fetch(url, { method: 'HEAD' }).catch(() => null)
          if (checkResponse?.ok) {
            cssUrls.push(url)
            console.log(`✅ Added global style: ${url}`)
          }
        }
      }

      // Also check for theme-specific Elementor styles
      const themeStyles = [
        `${wpUrl}/wp-content/themes/hello-elementor/style.css`,
        `${wpUrl}/wp-content/themes/hello-elementor/theme.css`,
      ]

      for (const url of themeStyles) {
        if (!cssUrls.includes(url)) {
          const checkResponse = await fetch(url, { method: 'HEAD' }).catch(() => null)
          if (checkResponse?.ok) {
            cssUrls.push(url)
            console.log(`✅ Added theme style: ${url}`)
          }
        }
      }

      return NextResponse.json({
        success: true,
        cssUrls,
        message: `Found ${cssUrls.length} CSS file(s) for page ${pageId}`
      })
    } catch (error: any) {
      console.error('❌ Error fetching Elementor CSS:', error)

      // Fallback: return essential Elementor CSS paths
      const fallbackUrls: string[] = []

      for (const url of globalStyles) {
        const checkResponse = await fetch(url, { method: 'HEAD' }).catch(() => null)
        if (checkResponse?.ok) {
          fallbackUrls.push(url)
        }
      }

      return NextResponse.json({
        success: true,
        cssUrls: fallbackUrls.length > 0 ? fallbackUrls : globalStyles,
        message: 'Using fallback Elementor CSS paths',
        warning: error.message
      })
    }
  } catch (error: any) {
    console.error('❌ Error in Elementor CSS API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Elementor CSS'
      },
      { status: 500 }
    )
  }
}

