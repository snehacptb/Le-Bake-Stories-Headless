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

    console.log(`📦 Fetching Elementor JS assets for page ${pageId}`)

    // Define comprehensive JavaScript dependencies in load order
    const jsAssets = {
      // Core dependencies
      core: [
        `${wpUrl}/wp-includes/js/jquery/jquery.min.js`,
        `${wpUrl}/wp-includes/js/jquery/jquery-migrate.min.js`,
      ],

      // Elementor core libraries
      libraries: [
        `${wpUrl}/wp-content/plugins/elementor/assets/lib/swiper/swiper.min.js`,
        `${wpUrl}/wp-content/plugins/elementor/assets/lib/dialog/dialog.min.js`,
        `${wpUrl}/wp-content/plugins/elementor/assets/lib/waypoints/waypoints.min.js`,
        `${wpUrl}/wp-content/plugins/elementor/assets/lib/share-link/share-link.min.js`,
      ],

      // Elementor frontend scripts
      elementor: [
        `${wpUrl}/wp-content/plugins/elementor/assets/js/webpack.runtime.min.js`,
        `${wpUrl}/wp-content/plugins/elementor/assets/js/frontend-modules.min.js`,
        `${wpUrl}/wp-content/plugins/elementor/assets/js/frontend.min.js`,
      ],

      // Elementor Pro (if installed)
      elementorPro: [
        `${wpUrl}/wp-content/plugins/elementor-pro/assets/js/webpack-pro.runtime.min.js`,
        `${wpUrl}/wp-content/plugins/elementor-pro/assets/js/frontend.min.js`,
      ],

      // Widget-specific scripts (loaded on demand)
      widgets: {
        accordion: `${wpUrl}/wp-content/plugins/elementor/assets/js/accordion.min.js`,
        tabs: `${wpUrl}/wp-content/plugins/elementor/assets/js/tabs.min.js`,
        toggle: `${wpUrl}/wp-content/plugins/elementor/assets/js/toggle.min.js`,
        video: `${wpUrl}/wp-content/plugins/elementor/assets/lib/e-gallery/js/e-gallery.min.js`,
        slider: `${wpUrl}/wp-content/plugins/elementor/assets/js/slider.min.js`,
        carousel: `${wpUrl}/wp-content/plugins/elementor/assets/js/carousel.min.js`,
        countdown: `${wpUrl}/wp-content/plugins/elementor/assets/js/countdown.min.js`,
        progress: `${wpUrl}/wp-content/plugins/elementor/assets/js/progress.min.js`,
        testimonial: `${wpUrl}/wp-content/plugins/elementor/assets/js/testimonial.min.js`,
        gallery: `${wpUrl}/wp-content/plugins/elementor/assets/lib/e-gallery/js/e-gallery.min.js`,
        form: `${wpUrl}/wp-content/plugins/elementor-pro/assets/js/forms.min.js`,
      }
    }

    // Try to fetch the page HTML to detect which widgets are used
    let detectedWidgets: string[] = []

    try {
      const pageUrl = `${wpUrl}/?p=${pageId}`
      console.log(`🔍 Fetching page HTML to detect widgets: ${pageUrl}`)

      const htmlResponse = await fetch(pageUrl, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Next.js)'
        }
      })

      if (htmlResponse.ok) {
        const html = await htmlResponse.text()

        // Detect widget usage by looking for widget class names
        const widgetPatterns = {
          accordion: /elementor-widget-accordion/,
          tabs: /elementor-widget-tabs/,
          toggle: /elementor-widget-toggle/,
          video: /elementor-widget-video/,
          slider: /elementor-widget-image-carousel|elementor-widget-slider/,
          carousel: /elementor-widget-image-carousel|elementor-widget-testimonial-carousel/,
          countdown: /elementor-widget-countdown/,
          progress: /elementor-widget-progress/,
          testimonial: /elementor-widget-testimonial/,
          gallery: /elementor-widget-gallery|elementor-widget-image-gallery/,
          form: /elementor-widget-form/,
        }

        for (const [widget, pattern] of Object.entries(widgetPatterns)) {
          if (pattern.test(html)) {
            detectedWidgets.push(widget)
            console.log(`✅ Detected widget: ${widget}`)
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch page HTML, will include all widget scripts')
    }

    // Verify which scripts actually exist
    const verifiedScripts: Record<string, string[]> = {
      core: [],
      libraries: [],
      elementor: [],
      elementorPro: [],
      widgets: []
    }

    // Verify core scripts
    for (const url of jsAssets.core) {
      const exists = await checkScriptExists(url)
      if (exists) {
        verifiedScripts.core.push(url)
      }
    }

    // Verify library scripts
    for (const url of jsAssets.libraries) {
      const exists = await checkScriptExists(url)
      if (exists) {
        verifiedScripts.libraries.push(url)
      }
    }

    // Verify Elementor core scripts
    for (const url of jsAssets.elementor) {
      const exists = await checkScriptExists(url)
      if (exists) {
        verifiedScripts.elementor.push(url)
      }
    }

    // Verify Elementor Pro scripts (optional)
    for (const url of jsAssets.elementorPro) {
      const exists = await checkScriptExists(url)
      if (exists) {
        verifiedScripts.elementorPro.push(url)
      }
    }

    // Verify widget-specific scripts
    // If we detected specific widgets, only load those
    // Otherwise, load common widget scripts
    const widgetsToLoad = detectedWidgets.length > 0
      ? detectedWidgets
      : ['accordion', 'tabs', 'slider', 'gallery']

    for (const widgetName of widgetsToLoad) {
      const url = jsAssets.widgets[widgetName as keyof typeof jsAssets.widgets]
      if (url) {
        const exists = await checkScriptExists(url)
        if (exists) {
          verifiedScripts.widgets.push(url)
        }
      }
    }

    console.log(`📦 Verified scripts:`, {
      core: verifiedScripts.core.length,
      libraries: verifiedScripts.libraries.length,
      elementor: verifiedScripts.elementor.length,
      elementorPro: verifiedScripts.elementorPro.length,
      widgets: verifiedScripts.widgets.length,
    })

    // Flatten all scripts in correct load order
    const allScripts = [
      ...verifiedScripts.core,
      ...verifiedScripts.libraries,
      ...verifiedScripts.elementor,
      ...verifiedScripts.elementorPro,
      ...verifiedScripts.widgets,
    ]

    return NextResponse.json({
      success: true,
      scripts: allScripts,
      scriptsByCategory: verifiedScripts,
      detectedWidgets,
      pageId,
      message: `Found ${allScripts.length} JavaScript files`
    })

  } catch (error: any) {
    console.error('❌ Error in Elementor JS API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Elementor JavaScript'
      },
      { status: 500 }
    )
  }
}

// Helper function to check if a script exists
async function checkScriptExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store'
    })
    return response.ok
  } catch (error) {
    return false
  }
}
