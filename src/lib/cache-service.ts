/**
 * Cache Service
 * Handles caching of WordPress and WooCommerce data
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { 
  CachedSiteInfo, 
  CachedMenu, 
  CachedProduct, 
  CachedProductCategory, 
  CachedPage, 
  CachedPost,
  CacheMetadata,
  CacheConfig,
  CacheStats
} from './cache-types'
import { wordpressAPI } from './api'
import { woocommerceApi } from './woocommerce-api'
import { imageCacheService } from './image-cache-service'

// Utility function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: use DOM parser
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  } else {
    // Server-side: manual replacement of common HTML entities
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®')
      .replace(/&trade;/g, '™')
  }
}

class CacheService {
  private cacheDir: string
  private config: CacheConfig
  private stats: CacheStats

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.next', 'cache', 'wordpress')
    this.config = {
      enableCaching: process.env.NODE_ENV === 'production' || process.env.ENABLE_CACHE === 'true',
      cacheExpiry: parseInt(process.env.CACHE_EXPIRY_MINUTES || '60'),
      enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
      webhookSecret: process.env.WC_WEBHOOK_SECRET || 'your-secret-key',
      autoRefresh: process.env.AUTO_REFRESH === 'true',
      refreshInterval: parseInt(process.env.REFRESH_INTERVAL_MINUTES || '30')
    }
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastRefresh: new Date().toISOString(),
      memoryUsage: 0,
      hitRate: 0
    }
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create cache directory:', error)
    }
  }

  private getCacheFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`)
  }

  private generateChecksum(data: any): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  }

  private isExpired(timestamp: string, expiryMinutes: number): boolean {
    const now = new Date()
    const cacheTime = new Date(timestamp)
    const diffMinutes = (now.getTime() - cacheTime.getTime()) / (1000 * 60)
    return diffMinutes > expiryMinutes
  }

  private updateStats(hit: boolean): void {
    this.stats.totalRequests++
    if (hit) {
      this.stats.cacheHits++
    } else {
      this.stats.cacheMisses++
    }
    this.stats.hitRate = this.stats.cacheHits / this.stats.totalRequests
  }

  async get<T>(key: string, expiryMinutes?: number): Promise<T | null> {
    if (!this.config.enableCaching) {
      this.updateStats(false)
      return null
    }

    try {
      const filePath = this.getCacheFilePath(key)
      const data = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(data)
      
      const expiry = expiryMinutes || this.config.cacheExpiry
      if (this.isExpired(parsed.lastUpdated, expiry)) {
        this.updateStats(false)
        return null
      }

      this.updateStats(true)
      return parsed.data
    } catch (error) {
      this.updateStats(false)
      return null
    }
  }

  async set<T>(key: string, data: T, customExpiry?: number): Promise<void> {
    if (!this.config.enableCaching) return

    try {
      await this.ensureCacheDir()
      
      const cacheData = {
        data,
        lastUpdated: new Date().toISOString(),
        expiry: customExpiry || this.config.cacheExpiry
      }

      const filePath = this.getCacheFilePath(key)
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2))
    } catch (error) {
      console.error(`Failed to cache data for key ${key}:`, error)
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key)
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist, which is fine
    }
  }

  async clear(): Promise<void> {
    try {
      // Check if cache directory exists
      try {
        await fs.access(this.cacheDir)
      } catch {
        // Directory doesn't exist, nothing to clear
        console.log('Cache directory does not exist, nothing to clear')
        return
      }

      const files = await fs.readdir(this.cacheDir)
      // Filter for JSON files only to avoid deleting other files
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      if (jsonFiles.length === 0) {
        console.log('No cache files to clear')
        return
      }

      await Promise.all(
        jsonFiles.map(file => fs.unlink(path.join(this.cacheDir, file)))
      )
      
      console.log(`Cleared ${jsonFiles.length} cache file(s)`)
    } catch (error) {
      console.error('Failed to clear cache:', error)
      throw error
    }
  }

  // WordPress-specific cache methods
  async getSiteInfo(): Promise<CachedSiteInfo | null> {
    return this.get<CachedSiteInfo>('site-info')
  }

  async cacheSiteInfo(): Promise<CachedSiteInfo> {
    const siteInfo = await wordpressAPI.getSiteInfo()
    const cached: CachedSiteInfo = {
      ...siteInfo,
      lastUpdated: new Date().toISOString()
    }
    await this.set('site-info', cached)
    return cached
  }

  async getMenus(): Promise<CachedMenu[]> {
    return (await this.get<CachedMenu[]>('menus')) || []
  }

  async cacheMenus(): Promise<CachedMenu[]> {
    console.log('🔄 [CACHE-MENUS] Starting menu caching process...')
    console.log('🔄 [CACHE-MENUS] Fetching menu list from WordPress using WP-REST-API V2 Menus plugin...')
    
    try {
      // First, fetch the list of all registered menus (without items)
      console.log('🔄 [CACHE-MENUS] Step 1: Fetching menu list...')
      const menuList = await wordpressAPI.getMenus()
      console.log('📋 [CACHE-MENUS] Raw menu list from WordPress:', menuList.length, 'menus found')
      console.log('📋 [CACHE-MENUS] Menu list details:', JSON.stringify(menuList, null, 2))

      if (!Array.isArray(menuList) || menuList.length === 0) {
        console.warn('⚠️ [CACHE-MENUS] No menus found or invalid response from WordPress')
        await this.set('menus', [])
        return []
      }

      const enriched: CachedMenu[] = []
      
      // For each menu in the list, fetch its items separately if needed
      console.log('🔄 [CACHE-MENUS] Step 2: Processing each menu...')
      for (let i = 0; i < menuList.length; i++) {
        const menuBasic = menuList[i]
        const menuId = Number(menuBasic.id || menuBasic.ID || menuBasic.term_id)
        const menuSlug = menuBasic.slug
        
        console.log(`🔄 [CACHE-MENUS] Processing menu ${i + 1}/${menuList.length}: ${menuBasic.name} (${menuSlug})`)
        console.log(`📋 [CACHE-MENUS] Menu basic data:`, JSON.stringify(menuBasic, null, 2))
        
        // If this is just a basic menu list (no items), fetch the full menu with items
        let menuWithItems = menuBasic
        if (!menuBasic.items || menuBasic.items.length === 0) {
          console.log(`🔄 [CACHE-MENUS] Fetching items for menu: ${menuSlug}`)
          try {
            menuWithItems = await wordpressAPI.getMenuWithItems(menuSlug)
            if (!menuWithItems) {
              console.log(`⚠️ [CACHE-MENUS] Could not fetch items for menu: ${menuSlug}, using basic info`)
              menuWithItems = menuBasic
            } else {
              console.log(`✅ [CACHE-MENUS] Successfully fetched items for menu: ${menuSlug}`)
              console.log(`📋 [CACHE-MENUS] Menu with items:`, JSON.stringify(menuWithItems, null, 2))
            }
          } catch (error: any) {
            console.error(`❌ [CACHE-MENUS] Error fetching items for menu ${menuSlug}:`, error.message)
            console.error(`❌ [CACHE-MENUS] Error stack:`, error.stack)
            menuWithItems = menuBasic
          }
        } else {
          console.log(`📋 [CACHE-MENUS] Menu already has ${menuBasic.items.length} items`)
        }
        
        const items = Array.isArray(menuWithItems.items) ? menuWithItems.items : []
        console.log(`📋 [CACHE-MENUS] Menu "${menuBasic.name}" has ${items.length} items`)

        // Determine the menu location with better fallback logic
        let location = menuWithItems.location || menuBasic.location || null
        
        // If no location is set, try to infer from common patterns
        if (!location) {
          const menuName = (menuBasic.name || '').toLowerCase()
          const menuSlug = (menuBasic.slug || '').toLowerCase()
          
          // Check for common primary menu patterns
          if (menuName.includes('primary') || menuName.includes('main') || menuName.includes('header') ||
              menuSlug.includes('primary') || menuSlug.includes('main') || menuSlug.includes('header')) {
            location = 'primary'
          } else if (menuName.includes('footer') || menuSlug.includes('footer')) {
            location = 'footer'
          } else {
            // Default to 'primary' for the first menu, otherwise use slug
            location = enriched.length === 0 ? 'primary' : menuBasic.slug || 'primary'
          }
        }
        
        console.log(`📋 [CACHE-MENUS] Menu "${menuBasic.name}" assigned location: "${location}"`)

        const cachedMenu: CachedMenu = {
          id: menuId,
          name: menuBasic.name || menuBasic.title,
          slug: menuBasic.slug || menuBasic.name?.toLowerCase().replace(/\s+/g, '-'),
          location,
          items: items.map((item: any) => {
            // Convert WordPress URLs to relative paths for frontend
            let url = item.url || item.link || item.guid || `/${item.post_name || item.slug}`
            
            // If URL contains the WordPress site URL, convert to relative path
            if (url && typeof url === 'string') {
              // Remove WordPress site URL and convert to relative path
              url = url.replace(/^https?:\/\/[^\/]+/i, '')
              
              // Ensure URL starts with /
              if (!url.startsWith('/')) {
                url = '/' + url
              }
              
              // Handle common WordPress paths
              if (url.includes('/wp-content/') || url.includes('/wp-admin/')) {
                // Keep WordPress admin/content URLs as-is for external links
                url = item.url || item.link || item.guid
              }
            }
            
            return {
              id: item.id || item.ID,
              title: item.title || item.post_title || item.name,
              url: url,
              target: item.target || '_self',
              parent: item.parent || item.menu_item_parent || 0,
              order: item.menu_order || item.order || 0
            }
          }),
          lastUpdated: new Date().toISOString()
        }

        enriched.push(cachedMenu)
        console.log(`✅ [CACHE-MENUS] Processed menu: ${cachedMenu.name} with ${cachedMenu.items.length} items`)
      }

      // Post-processing: if there's only one menu, make it primary
      if (enriched.length === 1 && enriched[0].location !== 'primary') {
        console.log(`📋 [CACHE-MENUS] Single menu found, assigning as primary: ${enriched[0].name}`)
        enriched[0].location = 'primary'
      }

      console.log('🔄 [CACHE-MENUS] Step 3: Saving to cache...')
      await this.set('menus', enriched)
      console.log('✅ [CACHE-MENUS] Successfully cached', enriched.length, 'menus with items:', enriched.map(m => `${m.name} (${m.items.length} items)`))
      return enriched
    } catch (error: any) {
      console.error('❌ [CACHE-MENUS] Critical error caching menus from WordPress:', error.message)
      console.error('❌ [CACHE-MENUS] Error stack:', error.stack)
      console.error('❌ [CACHE-MENUS] Error details:', error)
      // Don't create fallback data, let the error propagate
      throw new Error(`Menu caching failed: ${error.message}`)
    }
  }

  async getMenuByLocation(location: string): Promise<CachedMenu | null> {
    const menus = await this.getMenus()
    return menus.find(menu => menu.location === location) || null
  }

  async getMenuBySlug(slug: string): Promise<CachedMenu | null> {
    const menus = await this.getMenus()
    return menus.find(menu => menu.slug === slug) || null
  }

  async cacheSpecificMenu(slug: string): Promise<CachedMenu | null> {
    console.log(`🔄 Fetching specific menu '${slug}' with items from WordPress...`)
    
    try {
      const menuWithItems = await wordpressAPI.getMenuWithItems(slug)
      if (!menuWithItems) {
        console.log(`⚠️ Menu '${slug}' not found`)
        return null
      }

      // Determine the menu location with better fallback logic
      let location = menuWithItems.location || null
      
      // If no location is set, try to infer from common patterns
      if (!location) {
        const menuName = (menuWithItems.name || '').toLowerCase()
        const menuSlug = (menuWithItems.slug || '').toLowerCase()
        
        // Check for common primary menu patterns
        if (menuName.includes('primary') || menuName.includes('main') || menuName.includes('header') ||
            menuSlug.includes('primary') || menuSlug.includes('main') || menuSlug.includes('header')) {
          location = 'primary'
        } else if (menuName.includes('footer') || menuSlug.includes('footer')) {
          location = 'footer'
        } else {
          // Check if this is the first/only menu, then make it primary
          const allMenus = await this.getMenus()
          location = allMenus.length === 0 ? 'primary' : menuWithItems.slug || 'primary'
        }
      }

      const cached: CachedMenu = {
        id: Number(menuWithItems.id || menuWithItems.ID || menuWithItems.term_id),
        name: menuWithItems.name,
        slug: menuWithItems.slug,
        location,
        items: (menuWithItems.items || []).map((item: any) => {
          // Convert WordPress URLs to relative paths for frontend
          let url = item.url || item.link || item.guid || `/${item.post_name || item.slug}`
          
          // If URL contains the WordPress site URL, convert to relative path
          if (url && typeof url === 'string') {
            // Remove WordPress site URL and convert to relative path
            url = url.replace(/^https?:\/\/[^\/]+/i, '')
            
            // Ensure URL starts with /
            if (!url.startsWith('/')) {
              url = '/' + url
            }
            
            // Handle common WordPress paths
            if (url.includes('/wp-content/') || url.includes('/wp-admin/')) {
              // Keep WordPress admin/content URLs as-is for external links
              url = item.url || item.link || item.guid
            }
          }
          
          return {
            id: item.id || item.ID,
            title: item.title || item.post_title || item.name,
            url: url,
            target: item.target || '_self',
            parent: item.parent || item.menu_item_parent || 0,
            order: item.menu_order || item.order || 0
          }
        }),
        lastUpdated: new Date().toISOString()
      }

      // Update the cached menus list to include this specific menu
      const allMenus = await this.getMenus()
      const existingIndex = allMenus.findIndex(m => m.slug === slug)
      if (existingIndex >= 0) {
        allMenus[existingIndex] = cached
      } else {
        allMenus.push(cached)
      }
      await this.set('menus', allMenus)

      console.log(`✅ Cached specific menu '${cached.name}' with ${cached.items.length} items`)
      return cached
    } catch (error) {
      console.error(`❌ Error caching specific menu '${slug}':`, error)
      return null
    }
  }

  // WooCommerce-specific cache methods
  async getProducts(): Promise<CachedProduct[]> {
    return (await this.get<CachedProduct[]>('products')) || []
  }

  async cacheProducts(): Promise<CachedProduct[]> {
    console.log('🔄 [CACHE-PRODUCTS] Starting product caching process...')
    
    try {
      console.log('🔄 [CACHE-PRODUCTS] Fetching products from WooCommerce API...')
      const { products } = await woocommerceApi.getProductsWithPagination({ per_page: 100 })
      console.log(`✅ [CACHE-PRODUCTS] Successfully fetched ${products.length} products`)
      
      const cached: CachedProduct[] = products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        on_sale: product.on_sale,
        featured: product.featured,
        status: product.status,
        short_description: product.short_description,
        description: product.description,
        images: product.images || [],
        categories: product.categories || [],
        tags: product.tags || [],
        attributes: product.attributes || [],
        // Normalize variations to expected shape; if API returns IDs, keep empty list
        variations: Array.isArray(product.variations) && typeof product.variations[0] === 'object' ? (product.variations as any[]).map(v => ({
          id: v.id,
          price: v.price,
          regular_price: v.regular_price,
          sale_price: v.sale_price,
          on_sale: Boolean(v.on_sale),
          attributes: (v.attributes || []).map((va: any) => ({ id: va.id, name: va.name, option: va.option }))
        })) : [],
        stock_status: product.stock_status,
        stock_quantity: product.stock_quantity,
        lastUpdated: new Date().toISOString()
      }))
      
      await this.set('products', cached)
      console.log(`✅ [CACHE-PRODUCTS] Successfully cached ${cached.length} products`)
      
      // Cache product images
      console.log('🖼️ [CACHE-PRODUCTS] Starting image caching for products...')
      try {
        await imageCacheService.cacheProductImages(cached)
        console.log('✅ [CACHE-PRODUCTS] Successfully cached product images')
      } catch (imageError) {
        console.error('❌ [CACHE-PRODUCTS] Failed to cache product images:', imageError)
        // Don't fail the entire caching process if image caching fails
      }
      
      return cached
    } catch (error: any) {
      console.error('❌ [CACHE-PRODUCTS] Failed to cache products:', error.message)
      
      // Try to preserve existing cache data instead of clearing it
      const existingProducts = await this.get<CachedProduct[]>('products')
      
      // Enhanced error handling for common WooCommerce API issues
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || 'Unauthorized'
        console.error('❌ [CACHE-PRODUCTS] Authentication Error:', errorMessage)
        console.error('❌ [CACHE-PRODUCTS] Please check your WooCommerce API key permissions:')
        console.error('   1. Go to WooCommerce → Settings → Advanced → REST API')
        console.error('   2. Edit your API key and ensure permissions are set to "Read" or "Read/Write"')
        console.error('   3. Make sure the API key is associated with an Administrator user')
      } else if (error.response?.status === 404) {
        console.error('❌ [CACHE-PRODUCTS] WooCommerce REST API not found. Please ensure WooCommerce is installed and activated.')
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('❌ [CACHE-PRODUCTS] Cannot connect to WordPress site. Please check your NEXT_PUBLIC_WORDPRESS_URL.')
      }
      
      // If we have existing cached data, preserve it and return it
      if (existingProducts && existingProducts.length > 0) {
        console.log(`⚠️ [CACHE-PRODUCTS] Preserving existing cache with ${existingProducts.length} products`)
        return existingProducts
      }
      
      // Only set empty array if no existing data exists
      console.log('⚠️ [CACHE-PRODUCTS] No existing cache found, setting empty array')
      await this.set('products', [])
      return []
    }
  }

  private mapWooProductToCached(product: any): CachedProduct {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      on_sale: Boolean(product.on_sale),
      featured: Boolean(product.featured),
      status: product.status,
      short_description: product.short_description || '',
      description: product.description || '',
      images: (product.images || []).map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || '',
        name: img.name || ''
      })),
      categories: (product.categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      })),
      tags: (product.tags || []).map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })),
      attributes: (product.attributes || []).map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        options: attr.options || []
      })),
      variations: (Array.isArray(product.variations) && product.variations.length > 0 && typeof product.variations[0] === 'object')
        ? (product.variations as any[]).map((v: any) => ({
            id: v.id,
            price: v.price,
            regular_price: v.regular_price,
            sale_price: v.sale_price,
            on_sale: Boolean(v.on_sale),
            attributes: (v.attributes || []).map((va: any) => ({
              id: va.id,
              name: va.name,
              option: va.option
            }))
          }))
        : [],
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity ?? null,
      lastUpdated: new Date().toISOString()
    }
  }

  async upsertProductFromWebhook(product: any): Promise<void> {
    // Write directly to cache file to persist regardless of enableCaching flag
    await this.ensureCacheDir()
    const filePath = this.getCacheFilePath('products')
    let existing: CachedProduct[] = []
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      existing = Array.isArray(parsed?.data) ? parsed.data : []
    } catch {}

    const mapped = this.mapWooProductToCached(product)
    const index = existing.findIndex(p => p.id === mapped.id)
    if (index >= 0) {
      existing[index] = mapped
    } else {
      existing.push(mapped)
    }

    const cacheData = {
      data: existing,
      lastUpdated: new Date().toISOString(),
      expiry: this.config.cacheExpiry
    }
    await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2))
  }

  async removeProductFromCache(productId: number): Promise<void> {
    await this.ensureCacheDir()
    const filePath = this.getCacheFilePath('products')
    let existing: CachedProduct[] = []
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      existing = Array.isArray(parsed?.data) ? parsed.data : []
    } catch {}

    const filtered = existing.filter(p => p.id !== productId)
    const cacheData = {
      data: filtered,
      lastUpdated: new Date().toISOString(),
      expiry: this.config.cacheExpiry
    }
    await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2))
  }

  async getProductById(id: number): Promise<CachedProduct | null> {
    const products = await this.getProducts()
    return products.find(product => product.id === id) || null
  }

  async getProductBySlug(slug: string): Promise<CachedProduct | null> {
    const products = await this.getProducts()
    return products.find(product => product.slug === slug) || null
  }

  async getProductCategories(): Promise<CachedProductCategory[]> {
    return (await this.get<CachedProductCategory[]>('product-categories')) || []
  }

  async cacheProductCategories(): Promise<CachedProductCategory[]> {
    console.log('🔄 [CACHE-CATEGORIES] Starting product categories caching process...')
    
    try {
      console.log('🔄 [CACHE-CATEGORIES] Fetching product categories from WooCommerce API...')
      const { categories } = await woocommerceApi.getProductCategories({ per_page: 100 })
      console.log(`✅ [CACHE-CATEGORIES] Successfully fetched ${categories.length} categories`)
      
      const cached: CachedProductCategory[] = categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent: category.parent,
        count: category.count,
        image: category.image ? { id: category.image.id, src: category.image.src, alt: category.image.alt || '' } : null,
        lastUpdated: new Date().toISOString()
      }))
      
      await this.set('product-categories', cached)
      console.log(`✅ [CACHE-CATEGORIES] Successfully cached ${cached.length} categories`)
      return cached
    } catch (error: any) {
      console.error('❌ [CACHE-CATEGORIES] Failed to cache product categories:', error.message)
      
      // Try to preserve existing cache data instead of clearing it
      const existingCategories = await this.get<CachedProductCategory[]>('product-categories')
      
      // Enhanced error handling for common WooCommerce API issues
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || 'Unauthorized'
        console.error('❌ [CACHE-CATEGORIES] Authentication Error:', errorMessage)
        console.error('❌ [CACHE-CATEGORIES] Please check your WooCommerce API key permissions:')
        console.error('   1. Go to WooCommerce → Settings → Advanced → REST API')
        console.error('   2. Edit your API key and ensure permissions are set to "Read" or "Read/Write"')
        console.error('   3. Make sure the API key is associated with an Administrator user')
      } else if (error.response?.status === 404) {
        console.error('❌ [CACHE-CATEGORIES] WooCommerce REST API not found. Please ensure WooCommerce is installed and activated.')
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('❌ [CACHE-CATEGORIES] Cannot connect to WordPress site. Please check your NEXT_PUBLIC_WORDPRESS_URL.')
      }
      
      // If we have existing cached data, preserve it and return it
      if (existingCategories && existingCategories.length > 0) {
        console.log(`⚠️ [CACHE-CATEGORIES] Preserving existing cache with ${existingCategories.length} categories`)
        return existingCategories
      }
      
      // Only set empty array if no existing data exists
      console.log('⚠️ [CACHE-CATEGORIES] No existing cache found, setting empty array')
      await this.set('product-categories', [])
      return []
    }
  }

  async getPages(): Promise<CachedPage[]> {
    return (await this.get<CachedPage[]>('pages')) || []
  }

  async cachePages(): Promise<CachedPage[]> {
    console.log('🔄 [CACHE-PAGES] Starting pages caching process...')
    
    try {
      console.log('🔄 [CACHE-PAGES] Fetching pages from WordPress API...')
      const { data: pages } = await wordpressAPI.getPages({ per_page: 100 })
      console.log(`✅ [CACHE-PAGES] Successfully fetched ${pages.length} pages`)
      
      const cached: CachedPage[] = pages.map(page => ({
        id: page.id,
        title: decodeHtmlEntities(page.title.rendered),
        slug: page.slug,
        content: page.content.rendered, // Keep HTML content as-is for proper rendering
        excerpt: page.excerpt.rendered, // Keep HTML content as-is for proper rendering
        status: page.status,
        parent: page.parent,
        menu_order: page.menu_order,
        lastUpdated: new Date().toISOString()
      }))
      
      await this.set('pages', cached)
      console.log(`✅ [CACHE-PAGES] Successfully cached ${cached.length} pages`)
      return cached
    } catch (error: any) {
      console.error('❌ [CACHE-PAGES] Failed to cache pages:', error.message)
      
      // Try to preserve existing cache data instead of clearing it
      const existingPages = await this.get<CachedPage[]>('pages')
      
      // Enhanced error handling for common WordPress API issues
      if (error.response?.status === 401) {
        console.error('❌ [CACHE-PAGES] Authentication Error - WordPress API access denied')
      } else if (error.response?.status === 404) {
        console.error('❌ [CACHE-PAGES] WordPress REST API not found. Please ensure WordPress is accessible.')
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('❌ [CACHE-PAGES] Cannot connect to WordPress site. Please check your NEXT_PUBLIC_WORDPRESS_URL.')
      }
      
      // If we have existing cached data, preserve it and return it
      if (existingPages && existingPages.length > 0) {
        console.log(`⚠️ [CACHE-PAGES] Preserving existing cache with ${existingPages.length} pages`)
        return existingPages
      }
      
      // Only set empty array if no existing data exists
      console.log('⚠️ [CACHE-PAGES] No existing cache found, setting empty array')
      await this.set('pages', [])
      return []
    }
  }

  async getPageBySlug(slug: string): Promise<CachedPage | null> {
    const pages = await this.getPages()
    return pages.find(page => page.slug === slug) || null
  }

  async getPosts(): Promise<CachedPost[]> {
    return (await this.get<CachedPost[]>('posts')) || []
  }

  async cachePosts(): Promise<CachedPost[]> {
    try {
      const { data: posts } = await wordpressAPI.getPosts({ per_page: 100 })
      const cached: CachedPost[] = posts.map(post => ({
        id: post.id,
        title: decodeHtmlEntities(post.title.rendered),
        slug: post.slug,
        content: post.content.rendered, // Keep HTML content as-is for proper rendering
        excerpt: post.excerpt.rendered, // Keep HTML content as-is for proper rendering
        status: post.status,
        date: post.date,
        modified: post.modified,
        categories: Array.isArray(post.categories) ? post.categories.map((cid: number) => ({ id: cid, name: String(cid), slug: String(cid) })) : [],
        tags: Array.isArray(post.tags) ? post.tags.map((tid: number) => ({ id: tid, name: String(tid), slug: String(tid) })) : [],
        featured_media: post.featured_media ? { id: post.featured_media, src: '', alt: '' } : null,
        lastUpdated: new Date().toISOString()
      }))
      await this.set('posts', cached)
      return cached
    } catch (error: any) {
      console.error('❌ [CACHE-POSTS] Failed to cache posts:', error.message)
      await this.set('posts', [])
      return []
    }
  }

  async getPostBySlug(slug: string): Promise<CachedPost | null> {
    const posts = await this.getPosts()
    return posts.find(post => post.slug === slug) || null
  }

  // Full cache refresh
  async refreshAll(): Promise<CacheMetadata> {
    console.log('Starting full cache refresh...')
    
    try {
      // Invalidate all cache types before refreshing to ensure fresh data
      await Promise.all([
        this.invalidate('site-info'),
        this.invalidate('menus'),
        this.invalidate('products'),
        this.invalidate('categories'),
        this.invalidate('pages'),
        this.invalidate('posts')
      ])
      
      await Promise.all([
        this.cacheSiteInfo(),
        this.cacheMenus(),
        this.cacheProducts(),
        this.cacheProductCategories(),
        this.cachePages(),
        this.cachePosts()
      ])

      const metadata: CacheMetadata = {
        lastFullRefresh: new Date().toISOString(),
        lastPartialRefresh: new Date().toISOString(),
        totalItems: 0,
        version: '1.0.0',
        checksum: this.generateChecksum({ timestamp: Date.now() })
      }

      await this.set('metadata', metadata)
      this.stats.lastRefresh = metadata.lastFullRefresh

      console.log('Cache refresh completed successfully')
      return metadata
    } catch (error) {
      console.error('Cache refresh failed:', error)
      throw error
    }
  }

  // Partial cache refresh for specific data types
  async refreshPartial(type: 'products' | 'categories' | 'pages' | 'posts' | 'menus' | 'site-info'): Promise<void> {
    console.log(`Refreshing ${type} cache...`)
    
    try {
      // Invalidate the specific cache type before refreshing to ensure fresh data
      await this.invalidate(type)
      
      switch (type) {
        case 'products':
          await this.cacheProducts()
          break
        case 'categories':
          await this.cacheProductCategories()
          break
        case 'pages':
          await this.cachePages()
          break
        case 'posts':
          await this.cachePosts()
          break
        case 'menus':
          await this.cacheMenus()
          break
        case 'site-info':
          await this.cacheSiteInfo()
          break
      }

      // Update metadata
      const metadata = await this.get<CacheMetadata>('metadata') || {
        lastFullRefresh: new Date().toISOString(),
        lastPartialRefresh: new Date().toISOString(),
        totalItems: 0,
        version: '1.0.0',
        checksum: ''
      }
      
      const refreshTime = new Date().toISOString()
      metadata.lastPartialRefresh = refreshTime
      await this.set('metadata', metadata)
      
      // Update stats to reflect the refresh
      this.stats.lastRefresh = refreshTime
      
      console.log(`${type} cache refresh completed`)
    } catch (error) {
      console.error(`Failed to refresh ${type} cache:`, error)
      throw error
    }
  }

  // Cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Configuration
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

export const cacheService = new CacheService()
