/**
 * SEOPress Service
 * Fetches and manages SEOPress metadata from WordPress backend
 */

import axios from 'axios'

export interface SEOPressMetadata {
  title: string
  description: string
  canonical: string
  robots: {
    noindex: boolean
    nofollow: boolean
    noarchive: boolean
    nosnippet: boolean
    noimageindex: boolean
  }
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
  breadcrumbs: Array<{
    name: string
    url: string
  }>
  schema: any
}

export interface GlobalSEOSettings {
  site_name: string
  site_description: string
  site_url: string
  separator: string
  social: {
    facebook_app_id: string
    twitter_site: string
    og_locale: string
  }
  google_analytics: {
    id: string
  }
  verification: {
    google: string
    bing: string
    pinterest: string
  }
}

class SEOPressService {
  private baseUrl: string
  private cache: Map<string, { data: any; timestamp: number }>
  private cacheDuration: number = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.baseUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
    this.cache = new Map()
  }

  /**
   * Get cached data or fetch new data
   */
  private async getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < this.cacheDuration) {
      return cached.data as T
    }

    const data = await fetchFn()
    this.cache.set(key, { data, timestamp: now })
    return data
  }

  /**
   * Fetch SEOPress metadata for a post/page/product by slug
   * Returns null if SEOPress plugin is not active or data is unavailable
   */
  async getMetadataBySlug(slug: string, type: 'post' | 'page' | 'product' = 'post'): Promise<SEOPressMetadata | null> {
    try {
      const cacheKey = `seo-${type}-${slug}`
      
      return await this.getCached(cacheKey, async () => {
        // Try custom endpoint first (if seopress-headless-api plugin is active)
        try {
          const customEndpoint = this.baseUrl.replace('/wp/v2', '')
          const response = await axios.get(
            `${customEndpoint}/seopress/v1/seo/${type}/${slug}`,
            { timeout: 5000 }
          )
          console.log(`✅ SEOPress custom endpoint: Fetched SEO data for ${type}: ${slug}`)
          return response.data
        } catch (error) {
          // Custom endpoint not available, try standard REST API
          let endpoint = `${this.baseUrl}/${type}s?slug=${slug}`
          
          if (type === 'product') {
            endpoint = this.baseUrl.replace('/wp/v2', '/wc/v3') + `/products?slug=${slug}`
          }

          try {
            const response = await axios.get(endpoint, { timeout: 5000 })
            const data = response.data

            if (Array.isArray(data) && data.length > 0) {
              // Check if seopress_meta field exists
              if (data[0].seopress_meta) {
                console.log(`✅ SEOPress REST API: Fetched SEO data for ${type}: ${slug}`)
                return data[0].seopress_meta
              } else {
                console.warn(`⚠️ SEOPress: No seopress_meta field found for ${type}: ${slug} - Plugin may be deactivated`)
                return null
              }
            }

            console.warn(`⚠️ SEOPress: No data found for ${type}: ${slug}`)
            return null
          } catch (restError) {
            console.error(`❌ SEOPress: Failed to fetch ${type}: ${slug}`, restError)
            return null
          }
        }
      })
    } catch (error) {
      console.error(`❌ SEOPress: Error fetching metadata for ${type}: ${slug}`, error)
      return null
    }
  }

  /**
   * Fetch SEOPress metadata for a post/page/product by ID
   * Returns null if SEOPress plugin is not active or data is unavailable
   */
  async getMetadataById(id: number, type: 'post' | 'page' | 'product' = 'post'): Promise<SEOPressMetadata | null> {
    try {
      const cacheKey = `seo-id-${type}-${id}`
      
      return await this.getCached(cacheKey, async () => {
        let endpoint = `${this.baseUrl}/${type}s/${id}`
        
        if (type === 'product') {
          endpoint = this.baseUrl.replace('/wp/v2', '/wc/v3') + `/products/${id}`
        }

        try {
          const response = await axios.get(endpoint, { timeout: 5000 })
          
          if (response.data.seopress_meta) {
            console.log(`✅ SEOPress: Fetched SEO data for ${type} ID: ${id}`)
            return response.data.seopress_meta
          } else {
            console.warn(`⚠️ SEOPress: No seopress_meta field found for ${type} ID: ${id} - Plugin may be deactivated`)
            return null
          }
        } catch (error) {
          console.error(`❌ SEOPress: Failed to fetch ${type} ID: ${id}`, error)
          return null
        }
      })
    } catch (error) {
      console.error(`❌ SEOPress: Error fetching metadata for ${type} ID: ${id}`, error)
      return null
    }
  }

  /**
   * Fetch global SEO settings
   * Returns null if seopress-headless-api plugin is not active
   */
  async getGlobalSettings(): Promise<GlobalSEOSettings | null> {
    try {
      const cacheKey = 'seo-global-settings'
      
      return await this.getCached(cacheKey, async () => {
        const customEndpoint = this.baseUrl.replace('/wp/v2', '')
        try {
          const response = await axios.get(
            `${customEndpoint}/seopress/v1/settings`,
            { timeout: 5000 }
          )
          console.log('✅ SEOPress: Fetched global settings')
          return response.data
        } catch (error) {
          console.warn('⚠️ SEOPress: Global settings endpoint not available - seopress-headless-api plugin may not be installed')
          return null
        }
      })
    } catch (error) {
      console.error('❌ SEOPress: Error fetching global SEO settings:', error)
      return null
    }
  }

  /**
   * Check if SEOPress plugin is active and working
   * @returns Promise<boolean> - true if SEOPress is active and providing data
   */
  async checkHealth(): Promise<{
    active: boolean
    customEndpoints: boolean
    restAPI: boolean
    message: string
  }> {
    try {
      let customEndpoints = false
      let restAPI = false

      // Test 1: Check custom endpoints
      try {
        const customEndpoint = this.baseUrl.replace('/wp/v2', '')
        await axios.get(`${customEndpoint}/seopress/v1/settings`, { timeout: 3000 })
        customEndpoints = true
      } catch (error) {
        // Custom endpoints not available
      }

      // Test 2: Check REST API for seopress_meta field
      try {
        const response = await axios.get(`${this.baseUrl}/posts?per_page=1`, { timeout: 3000 })
        const data = response.data
        if (Array.isArray(data) && data.length > 0 && 'seopress_meta' in data[0]) {
          restAPI = true
        }
      } catch (error) {
        // REST API check failed
      }

      const active = restAPI // SEOPress is active if REST API has seopress_meta field
      let message = ''

      if (active && customEndpoints) {
        message = '✅ SEOPress is fully active with custom endpoints'
      } else if (active && !customEndpoints) {
        message = '✅ SEOPress is active via REST API (custom endpoints not available)'
      } else {
        message = '❌ SEOPress plugin is not active or not providing data'
      }

      return { active, customEndpoints, restAPI, message }
    } catch (error) {
      console.error('❌ SEOPress health check failed:', error)
      return {
        active: false,
        customEndpoints: false,
        restAPI: false,
        message: '❌ Unable to check SEOPress status'
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}

// Export singleton instance
export const seopressService = new SEOPressService()

