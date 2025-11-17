import axios from 'axios'

/**
 * Elementor Service for handling all Elementor-related operations
 * Includes support for:
 * - CSS loading
 * - JavaScript dependencies
 * - Widget initialization
 * - Dynamic content (forms, sliders, etc.)
 * - Theme builder (headers, footers)
 */

export interface ElementorAssets {
  css: string[]
  js: string[]
  frontend: string[]
  widgets: ElementorWidget[]
  settings: ElementorSettings
  themeBuilder?: {
    header?: string
    footer?: string
  }
}

export interface ElementorWidget {
  id: string
  widgetType: string
  settings: Record<string, any>
  hasAnimation?: boolean
  hasLightbox?: boolean
  hasSwiper?: boolean
  hasForm?: boolean
}

export interface ElementorSettings {
  siteUrl: string
  ajaxUrl: string
  isEditMode: boolean
  isPreviewMode: boolean
  elementorVersion: string
  settings: {
    page?: {
      template?: string
    }
  }
}

class ElementorService {
  private wpUrl: string
  private assetsCache: Map<number, ElementorAssets> = new Map()
  
  constructor() {
    this.wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'
  }

  /**
   * Get all Elementor assets for a page
   * Uses Next.js API proxy to avoid CORS issues
   */
  async getElementorAssets(pageId: number): Promise<ElementorAssets> {
    // Check cache first
    if (this.assetsCache.has(pageId)) {
      return this.assetsCache.get(pageId)!
    }

    try {
      // Use Next.js API proxy instead of direct WordPress fetch to avoid CORS
      const response = await fetch(`/api/elementor-assets?pageId=${pageId}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.assets) {
        throw new Error(data.error || 'Failed to load assets')
      }

      const assets: ElementorAssets = data.assets

      // Cache the assets
      this.assetsCache.set(pageId, assets)

      return assets
    } catch (error) {
      console.error('Error fetching Elementor assets:', error)
      return {
        css: [],
        js: [],
        frontend: [],
        widgets: [],
        settings: this.getDefaultSettings()
      }
    }
  }

  /**
   * Extract all CSS URLs from page HTML
   */
  private extractCssUrls(html: string): string[] {
    const cssUrls: string[] = []
    
    // Extract Elementor CSS links
    const cssLinkRegex = /<link[^>]*href=["']([^"']*elementor[^"']*\.css[^"']*)["'][^>]*>/gi
    const matches = Array.from(html.matchAll(cssLinkRegex))
    
    matches.forEach(match => {
      let cssUrl = match[1]
      if (!cssUrl.startsWith('http')) {
        cssUrl = `${this.wpUrl}${cssUrl.startsWith('/') ? '' : '/'}${cssUrl}`
      }
      if (!cssUrls.includes(cssUrl)) {
        cssUrls.push(cssUrl)
      }
    })

    // Add standard Elementor CSS files
    const standardCss = [
      `${this.wpUrl}/wp-content/plugins/elementor/assets/css/frontend.min.css`,
      `${this.wpUrl}/wp-content/plugins/elementor/assets/css/frontend-legacy.min.css`,
      `${this.wpUrl}/wp-content/plugins/elementor-pro/assets/css/frontend.min.css`
    ]

    standardCss.forEach(url => {
      if (!cssUrls.includes(url)) {
        cssUrls.push(url)
      }
    })

    return cssUrls
  }

  /**
   * Extract all JavaScript URLs from page HTML
   */
  private extractJsUrls(html: string): string[] {
    const jsUrls: string[] = []
    
    // Extract Elementor JS script tags
    const scriptRegex = /<script[^>]*src=["']([^"']*elementor[^"']*)["'][^>]*>/gi
    const matches = Array.from(html.matchAll(scriptRegex))
    
    matches.forEach(match => {
      let jsUrl = match[1]
      if (!jsUrl.startsWith('http')) {
        jsUrl = `${this.wpUrl}${jsUrl.startsWith('/') ? '' : '/'}${jsUrl}`
      }
      if (!jsUrls.includes(jsUrl)) {
        jsUrls.push(jsUrl)
      }
    })

    // Add essential Elementor JavaScript files in correct order
    const essentialJs = [
      // jQuery (if not already loaded)
      `${this.wpUrl}/wp-includes/js/jquery/jquery.min.js`,
      // Elementor frontend scripts
      `${this.wpUrl}/wp-content/plugins/elementor/assets/lib/waypoints/waypoints.min.js`,
      `${this.wpUrl}/wp-content/plugins/elementor/assets/lib/swiper/swiper.min.js`,
      `${this.wpUrl}/wp-content/plugins/elementor/assets/lib/share-link/share-link.min.js`,
      `${this.wpUrl}/wp-content/plugins/elementor/assets/lib/dialog/dialog.min.js`,
      `${this.wpUrl}/wp-content/plugins/elementor/assets/js/frontend.min.js`,
      // Elementor Pro scripts
      `${this.wpUrl}/wp-content/plugins/elementor-pro/assets/js/frontend.min.js`,
      `${this.wpUrl}/wp-content/plugins/elementor-pro/assets/js/elements-handlers.min.js`
    ]

    essentialJs.forEach(url => {
      if (!jsUrls.some(existingUrl => existingUrl.includes(url.split('/').pop()!))) {
        jsUrls.push(url)
      }
    })

    return jsUrls
  }

  /**
   * Extract frontend inline scripts
   */
  private extractFrontendScripts(html: string): string[] {
    const scripts: string[] = []
    
    // Extract inline scripts containing Elementor frontend code
    const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
    const matches = Array.from(html.matchAll(inlineScriptRegex))
    
    matches.forEach(match => {
      const scriptContent = match[1]
      if (scriptContent.includes('elementorFrontend') || 
          scriptContent.includes('elementorProFrontend') ||
          scriptContent.includes('ElementorProFrontendConfig')) {
        scripts.push(scriptContent)
      }
    })

    return scripts
  }

  /**
   * Extract widget information from page HTML
   */
  private extractWidgets(html: string): ElementorWidget[] {
    const widgets: ElementorWidget[] = []
    
    // Extract widget elements
    const widgetRegex = /data-widget_type=["']([^"']+)["'][^>]*data-id=["']([^"']+)["']/gi
    const matches = Array.from(html.matchAll(widgetRegex))
    
    matches.forEach(match => {
      const widgetType = match[1]
      const widgetId = match[2]
      
      widgets.push({
        id: widgetId,
        widgetType: widgetType,
        settings: {},
        hasAnimation: html.includes(`data-id="${widgetId}"`) && html.includes('data-settings='),
        hasLightbox: widgetType.includes('image') || widgetType.includes('gallery'),
        hasSwiper: widgetType.includes('slider') || widgetType.includes('carousel'),
        hasForm: widgetType.includes('form')
      })
    })

    return widgets
  }

  /**
   * Extract Elementor settings from page HTML
   */
  private extractElementorSettings(html: string): ElementorSettings {
    const defaultSettings = this.getDefaultSettings()
    
    try {
      // Look for ElementorProFrontendConfig
      const configRegex = /var\s+ElementorProFrontendConfig\s*=\s*(\{[\s\S]*?\});/i
      const configMatch = html.match(configRegex)
      
      if (configMatch) {
        const config = JSON.parse(configMatch[1])
        return {
          ...defaultSettings,
          ...config
        }
      }

      // Look for elementorFrontendConfig
      const frontendConfigRegex = /var\s+elementorFrontendConfig\s*=\s*(\{[\s\S]*?\});/i
      const frontendMatch = html.match(frontendConfigRegex)
      
      if (frontendMatch) {
        const config = JSON.parse(frontendMatch[1])
        return {
          ...defaultSettings,
          ...config
        }
      }
    } catch (error) {
      console.error('Error parsing Elementor settings:', error)
    }

    return defaultSettings
  }

  /**
   * Extract theme builder content (headers, footers)
   */
  private extractThemeBuilder(html: string): { header?: string, footer?: string } | undefined {
    const themeBuilder: { header?: string, footer?: string } = {}
    
    // Extract header
    const headerRegex = /<header[^>]*class="[^"]*elementor[^"]*"[^>]*>([\s\S]*?)<\/header>/i
    const headerMatch = html.match(headerRegex)
    if (headerMatch) {
      themeBuilder.header = headerMatch[0]
    }

    // Extract footer
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

  /**
   * Get default Elementor settings
   */
  private getDefaultSettings(): ElementorSettings {
    return {
      siteUrl: this.wpUrl,
      ajaxUrl: `${this.wpUrl}/wp-admin/admin-ajax.php`,
      isEditMode: false,
      isPreviewMode: false,
      elementorVersion: '3.0',
      settings: {}
    }
  }

  /**
   * Check if a page uses Elementor
   */
  async isElementorPage(pageId: number): Promise<boolean> {
    try {
      const response = await axios.get(`${this.wpUrl}/wp-json/wp/v2/pages/${pageId}`, {
        params: {
          _fields: 'meta'
        }
      })

      return response.data?.meta?._elementor_edit_mode === 'builder'
    } catch (error) {
      console.error('Error checking if page uses Elementor:', error)
      return false
    }
  }

  /**
   * Get Elementor page data
   */
  async getElementorPageData(pageId: number): Promise<any> {
    try {
      const response = await axios.get(`${this.wpUrl}/wp-json/elementor/v1/pages/${pageId}`, {
        timeout: 10000
      })

      return response.data
    } catch (error) {
      console.error('Error fetching Elementor page data:', error)
      return null
    }
  }

  /**
   * Clear cache for a specific page
   */
  clearCache(pageId?: number): void {
    if (pageId) {
      this.assetsCache.delete(pageId)
    } else {
      this.assetsCache.clear()
    }
  }
}

export const elementorService = new ElementorService()

