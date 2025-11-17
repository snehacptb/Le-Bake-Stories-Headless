import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to fetch complete Elementor assets for a page
 * Includes: CSS, JS, widgets, settings, and theme builder data
 */
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
    
    // Fetch the page HTML
    const pageUrl = `${wpUrl}/?p=${pageId}`
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
    
    // Extract all assets
    const assets = {
      css: extractCssUrls(html, wpUrl),
      js: extractJsUrls(html, wpUrl),
      frontend: extractFrontendScripts(html),
      widgets: extractWidgets(html),
      settings: extractElementorSettings(html, wpUrl),
      themeBuilder: extractThemeBuilder(html)
    }

    return NextResponse.json({
      success: true,
      pageId: parseInt(pageId),
      assets,
      message: 'Elementor assets fetched successfully'
    })
  } catch (error: any) {
    console.error('Error fetching Elementor assets:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch Elementor assets'
      },
      { status: 500 }
    )
  }
}

function extractCssUrls(html: string, wpUrl: string): string[] {
  const cssUrls: string[] = []
  
  // Extract Elementor CSS links
  const cssLinkRegex = /<link[^>]*href=["']([^"']*elementor[^"']*\.css[^"']*)["'][^>]*>/gi
  const matches = Array.from(html.matchAll(cssLinkRegex))
  
  matches.forEach(match => {
    let cssUrl = match[1]
    if (!cssUrl.startsWith('http')) {
      cssUrl = `${wpUrl}${cssUrl.startsWith('/') ? '' : '/'}${cssUrl}`
    }
    if (!cssUrls.includes(cssUrl)) {
      cssUrls.push(cssUrl)
    }
  })

  // Add standard Elementor CSS files
  const standardCss = [
    `${wpUrl}/wp-content/plugins/elementor/assets/css/frontend.min.css`,
    `${wpUrl}/wp-content/plugins/elementor/assets/css/frontend-legacy.min.css`,
    `${wpUrl}/wp-content/plugins/elementor-pro/assets/css/frontend.min.css`,
    `${wpUrl}/wp-content/uploads/elementor/css/post-${html.match(/data-elementor-id="(\d+)"/)?.[1] || ''}.css`
  ]

  standardCss.forEach(url => {
    if (!cssUrls.includes(url)) {
      cssUrls.push(url)
    }
  })

  return cssUrls
}

function extractJsUrls(html: string, wpUrl: string): string[] {
  const jsUrls: string[] = []
  
  // Extract Elementor JS script tags
  const scriptRegex = /<script[^>]*src=["']([^"']*elementor[^"']*)["'][^>]*>/gi
  const matches = Array.from(html.matchAll(scriptRegex))
  
  matches.forEach(match => {
    let jsUrl = match[1]
    if (!jsUrl.startsWith('http')) {
      jsUrl = `${wpUrl}${jsUrl.startsWith('/') ? '' : '/'}${jsUrl}`
    }
    if (!jsUrls.includes(jsUrl)) {
      jsUrls.push(jsUrl)
    }
  })

  // Add essential Elementor JavaScript files
  const essentialJs = [
    `${wpUrl}/wp-includes/js/jquery/jquery.min.js`,
    `${wpUrl}/wp-content/plugins/elementor/assets/lib/waypoints/waypoints.min.js`,
    `${wpUrl}/wp-content/plugins/elementor/assets/lib/swiper/swiper.min.js`,
    `${wpUrl}/wp-content/plugins/elementor/assets/lib/share-link/share-link.min.js`,
    `${wpUrl}/wp-content/plugins/elementor/assets/lib/dialog/dialog.min.js`,
    `${wpUrl}/wp-content/plugins/elementor/assets/js/frontend.min.js`,
    `${wpUrl}/wp-content/plugins/elementor-pro/assets/js/frontend.min.js`,
    `${wpUrl}/wp-content/plugins/elementor-pro/assets/js/elements-handlers.min.js`
  ]

  essentialJs.forEach(url => {
    const fileName = url.split('/').pop()
    if (fileName && !jsUrls.some(existingUrl => existingUrl.includes(fileName))) {
      jsUrls.push(url)
    }
  })

  return jsUrls
}

function extractFrontendScripts(html: string): string[] {
  const scripts: string[] = []
  
  // Extract inline scripts containing Elementor frontend code
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
  const matches = Array.from(html.matchAll(inlineScriptRegex))
  
  matches.forEach(match => {
    const scriptContent = match[1]
    if (scriptContent.includes('elementorFrontend') || 
        scriptContent.includes('elementorProFrontend') ||
        scriptContent.includes('ElementorProFrontendConfig') ||
        scriptContent.includes('elementorFrontendConfig')) {
      scripts.push(scriptContent)
    }
  })

  return scripts
}

function extractWidgets(html: string): any[] {
  const widgets: any[] = []
  
  // Extract widget elements with their settings
  const widgetRegex = /data-widget_type=["']([^"']+)["'][^>]*data-id=["']([^"']+)["'][^>]*(?:data-settings=["']([^"']+)["'])?/gi
  const matches = Array.from(html.matchAll(widgetRegex))
  
  matches.forEach(match => {
    const widgetType = match[1]
    const widgetId = match[2]
    const settingsStr = match[3]
    
    let settings = {}
    if (settingsStr) {
      try {
        settings = JSON.parse(decodeURIComponent(settingsStr))
      } catch (error) {
        console.error('Error parsing widget settings:', error)
      }
    }
    
    widgets.push({
      id: widgetId,
      widgetType: widgetType,
      settings: settings,
      hasAnimation: html.includes(`data-id="${widgetId}"`) && html.includes('data-settings='),
      hasLightbox: widgetType.includes('image') || widgetType.includes('gallery'),
      hasSwiper: widgetType.includes('slider') || widgetType.includes('carousel') || widgetType.includes('testimonial-carousel'),
      hasForm: widgetType.includes('form')
    })
  })

  return widgets
}

function extractElementorSettings(html: string, wpUrl: string): any {
  const defaultSettings = {
    siteUrl: wpUrl,
    ajaxUrl: `${wpUrl}/wp-admin/admin-ajax.php`,
    isEditMode: false,
    isPreviewMode: false,
    elementorVersion: '3.0',
    settings: {}
  }
  
  try {
    // Look for ElementorProFrontendConfig
    const configRegex = /var\s+ElementorProFrontendConfig\s*=\s*(\{[\s\S]*?\});/i
    const configMatch = html.match(configRegex)
    
    if (configMatch) {
      try {
        const config = JSON.parse(configMatch[1])
        return { ...defaultSettings, ...config }
      } catch (parseError) {
        console.error('Error parsing ElementorProFrontendConfig:', parseError)
      }
    }

    // Look for elementorFrontendConfig
    const frontendConfigRegex = /var\s+elementorFrontendConfig\s*=\s*(\{[\s\S]*?\});/i
    const frontendMatch = html.match(frontendConfigRegex)
    
    if (frontendMatch) {
      try {
        const config = JSON.parse(frontendMatch[1])
        return { ...defaultSettings, ...config }
      } catch (parseError) {
        console.error('Error parsing elementorFrontendConfig:', parseError)
      }
    }
  } catch (error) {
    console.error('Error extracting Elementor settings:', error)
  }

  return defaultSettings
}

function extractThemeBuilder(html: string): { header?: string, footer?: string } | undefined {
  const themeBuilder: { header?: string, footer?: string } = {}
  
  // Extract header with Elementor classes
  const headerRegex = /<header[^>]*class="[^"]*elementor[^"]*"[^>]*>([\s\S]*?)<\/header>/i
  const headerMatch = html.match(headerRegex)
  if (headerMatch) {
    themeBuilder.header = headerMatch[0]
  }

  // Extract footer with Elementor classes
  const footerRegex = /<footer[^>]*class="[^"]*elementor[^"]*"[^>]*>([\s\S]*?)<\/footer>/i
  const footerMatch = html.match(footerRegex)
  if (footerMatch) {
    themeBuilder.footer = footerMatch[0]
  }

  // Check for theme builder specific sections
  const themeBuilderRegex = /data-elementor-type="(header|footer)"/gi
  const themeMatches = Array.from(html.matchAll(themeBuilderRegex))
  
  if (themeMatches.length > 0 || Object.keys(themeBuilder).length > 0) {
    return themeBuilder
  }

  return undefined
}

