/**
 * Global Elementor Asset Manager
 *
 * This manager runs OUTSIDE of React's lifecycle to prevent
 * React from tracking and trying to manage Elementor assets.
 * This solves the "Cannot read properties of null (reading 'removeChild')" error.
 */

interface LoadedAsset {
  id: string
  element: HTMLLinkElement | HTMLScriptElement
  pageId: number
  type: 'css' | 'js'
}

class ElementorAssetManager {
  private loadedAssets: Map<string, LoadedAsset> = new Map()
  private loadingPromises: Map<string, Promise<void>> = new Map()
  private initialized: boolean = false

  constructor() {
    // Ensure we only initialize once
    if (typeof window !== 'undefined' && !this.initialized) {
      this.initialized = true
      // Create a dedicated container outside React's management
      this.ensureContainer()
    }
  }

  private ensureContainer() {
    if (typeof window === 'undefined') return

    // Check if container already exists
    let container = document.getElementById('elementor-assets-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'elementor-assets-container'
      container.style.display = 'none'
      container.setAttribute('data-elementor-assets', 'true')
      // Append to body to keep it separate from head elements that React tracks
      document.body.appendChild(container)
    }
  }

  /**
   * Load a CSS file
   */
  async loadCSS(url: string, pageId: number): Promise<void> {
    const id = `elementor-css-${pageId}-${this.hashUrl(url)}`

    // Already loaded
    if (this.loadedAssets.has(id)) {
      return Promise.resolve()
    }

    // Currently loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!
    }

    // Start loading
    const promise = new Promise<void>((resolve, reject) => {
      try {
        // Check if already exists in DOM
        const existing = document.getElementById(id)
        if (existing) {
          this.loadedAssets.set(id, {
            id,
            element: existing as HTMLLinkElement,
            pageId,
            type: 'css'
          })
          resolve()
          return
        }

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = url
        link.id = id
        link.setAttribute('data-elementor', 'true')
        link.setAttribute('data-page-id', pageId.toString())

        link.onload = () => {
          this.loadedAssets.set(id, {
            id,
            element: link,
            pageId,
            type: 'css'
          })
          this.loadingPromises.delete(id)
          console.log(`✅ Loaded Elementor CSS: ${url}`)
          resolve()
        }

        link.onerror = () => {
          this.loadingPromises.delete(id)
          console.warn(`⚠️ Failed to load Elementor CSS: ${url}`)
          // Resolve anyway to prevent blocking
          resolve()
        }

        // Append to head - but React won't track it because we manage the lifecycle
        document.head.appendChild(link)
      } catch (error) {
        console.error('Error loading CSS:', error)
        this.loadingPromises.delete(id)
        resolve() // Resolve anyway
      }
    })

    this.loadingPromises.set(id, promise)
    return promise
  }

  /**
   * Load a JavaScript file
   */
  async loadJS(url: string, pageId: number): Promise<void> {
    const fileName = url.split('/').pop() || ''
    const id = `elementor-js-${this.hashUrl(url)}`

    // Already loaded
    if (this.loadedAssets.has(id)) {
      return Promise.resolve()
    }

    // Currently loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!
    }

    // Skip if jQuery already loaded
    if (url.includes('jquery') && typeof window !== 'undefined' && (window as any).jQuery) {
      return Promise.resolve()
    }

    // Start loading
    const promise = new Promise<void>((resolve, reject) => {
      try {
        // Check if already exists in DOM
        const existing = document.getElementById(id)
        if (existing) {
          this.loadedAssets.set(id, {
            id,
            element: existing as HTMLScriptElement,
            pageId,
            type: 'js'
          })
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = url
        script.id = id
        script.async = false
        script.setAttribute('data-elementor', 'true')
        script.setAttribute('data-page-id', pageId.toString())

        script.onload = () => {
          this.loadedAssets.set(id, {
            id,
            element: script,
            pageId,
            type: 'js'
          })
          this.loadingPromises.delete(id)
          console.log(`✅ Loaded Elementor JS: ${url}`)
          resolve()
        }

        script.onerror = () => {
          this.loadingPromises.delete(id)
          console.warn(`⚠️ Failed to load Elementor JS: ${url}`)
          // Resolve anyway to prevent blocking
          resolve()
        }

        // Append to body
        document.body.appendChild(script)
      } catch (error) {
        console.error('Error loading JS:', error)
        this.loadingPromises.delete(id)
        resolve() // Resolve anyway
      }
    })

    this.loadingPromises.set(id, promise)
    return promise
  }

  /**
   * Load multiple CSS files
   */
  async loadCSSFiles(urls: string[], pageId: number): Promise<void> {
    const promises = urls.map(url => this.loadCSS(url, pageId))
    await Promise.all(promises)
  }

  /**
   * Load multiple JS files sequentially (order matters for Elementor)
   */
  async loadJSFiles(urls: string[], pageId: number): Promise<void> {
    for (const url of urls) {
      await this.loadJS(url, pageId)
    }
  }

  /**
   * Get all loaded assets for a page
   */
  getAssetsForPage(pageId: number): LoadedAsset[] {
    return Array.from(this.loadedAssets.values()).filter(
      asset => asset.pageId === pageId
    )
  }

  /**
   * Simple hash function for URLs
   */
  private hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Clear all assets (use with caution)
   */
  clearAll(): void {
    this.loadedAssets.forEach(asset => {
      try {
        if (asset.element && asset.element.parentNode) {
          asset.element.parentNode.removeChild(asset.element)
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    })
    this.loadedAssets.clear()
    this.loadingPromises.clear()
  }
}

// Create a singleton instance
let assetManagerInstance: ElementorAssetManager | null = null

export function getElementorAssetManager(): ElementorAssetManager {
  if (!assetManagerInstance) {
    assetManagerInstance = new ElementorAssetManager()
  }
  return assetManagerInstance
}

export default getElementorAssetManager
