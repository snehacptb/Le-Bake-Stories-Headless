/**
 * Cached API Service
 * Provides cached versions of WordPress and WooCommerce API calls
 */

import { cacheService } from './cache-service'
import { 
  CachedSiteInfo, 
  CachedMenu, 
  CachedProduct, 
  CachedProductCategory, 
  CachedPage, 
  CachedPost 
} from './cache-types'

class CachedAPIService {
  // Site Information
  async getSiteInfo(): Promise<CachedSiteInfo | null> {
    let cached = await cacheService.getSiteInfo()
    
    if (!cached) {
      cached = await cacheService.cacheSiteInfo()
    }
    
    return cached
  }

  // Menus
  async getMenus(): Promise<CachedMenu[]> {
    let cached = await cacheService.getMenus()
    
    if (cached.length === 0) {
      cached = await cacheService.cacheMenus()
    }
    
    return cached
  }

  async getMenuByLocation(location: string): Promise<CachedMenu | null> {
    const menus = await this.getMenus()
    return menus.find(menu => menu.location === location) || null
  }

  // Products
  async getProducts(): Promise<CachedProduct[]> {
    let cached = await cacheService.getProducts()
    
    if (cached.length === 0) {
      cached = await cacheService.cacheProducts()
    }
    
    return cached
  }

  async getProductById(id: number): Promise<CachedProduct | null> {
    let product = await cacheService.getProductById(id)
    
    if (!product) {
      // Try to refresh products cache and look again
      await cacheService.cacheProducts()
      product = await cacheService.getProductById(id)
    }
    
    return product
  }

  async getProductBySlug(slug: string): Promise<CachedProduct | null> {
    let product = await cacheService.getProductBySlug(slug)
    
    if (!product) {
      // Try to refresh products cache and look again
      await cacheService.cacheProducts()
      product = await cacheService.getProductBySlug(slug)
    }
    
    return product
  }

  async getFeaturedProducts(limit: number = 8): Promise<CachedProduct[]> {
    const products = await this.getProducts()
    return products
      .filter(product => product.featured && product.status === 'publish')
      .slice(0, limit)
  }

  async getOnSaleProducts(limit: number = 8): Promise<CachedProduct[]> {
    const products = await this.getProducts()
    return products
      .filter(product => product.on_sale && product.status === 'publish')
      .slice(0, limit)
  }

  async getProductsByCategory(categorySlug: string, limit?: number): Promise<CachedProduct[]> {
    const products = await this.getProducts()
    const filtered = products.filter(product => 
      product.status === 'publish' && 
      product.categories.some(cat => cat.slug === categorySlug)
    )
    
    return limit ? filtered.slice(0, limit) : filtered
  }

  async searchProducts(query: string, limit?: number): Promise<CachedProduct[]> {
    const products = await this.getProducts()
    const searchTerm = query.toLowerCase()
    
    const filtered = products.filter(product => 
      product.status === 'publish' && (
        product.name.toLowerCase().includes(searchTerm) ||
        product.short_description.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.categories.some(cat => cat.name.toLowerCase().includes(searchTerm)) ||
        product.tags.some(tag => tag.name.toLowerCase().includes(searchTerm))
      )
    )
    
    return limit ? filtered.slice(0, limit) : filtered
  }

  // Product Categories
  async getProductCategories(): Promise<CachedProductCategory[]> {
    let cached = await cacheService.getProductCategories()
    
    if (cached.length === 0) {
      cached = await cacheService.cacheProductCategories()
    }
    
    return cached
  }

  async getProductCategoryBySlug(slug: string): Promise<CachedProductCategory | null> {
    const categories = await this.getProductCategories()
    return categories.find(category => category.slug === slug) || null
  }

  // Pages
  async getPages(): Promise<CachedPage[]> {
    let cached = await cacheService.getPages()
    
    if (cached.length === 0) {
      cached = await cacheService.cachePages()
    }
    
    return cached
  }

  async getPageBySlug(slug: string): Promise<CachedPage | null> {
    let page = await cacheService.getPageBySlug(slug)
    
    if (!page) {
      // Try to refresh pages cache and look again
      await cacheService.cachePages()
      page = await cacheService.getPageBySlug(slug)
    }
    
    return page
  }

  // Posts
  async getPosts(): Promise<CachedPost[]> {
    let cached = await cacheService.getPosts()
    
    if (cached.length === 0) {
      cached = await cacheService.cachePosts()
    }
    
    return cached
  }

  async getPostBySlug(slug: string): Promise<CachedPost | null> {
    let post = await cacheService.getPostBySlug(slug)
    
    if (!post) {
      // Try to refresh posts cache and look again
      await cacheService.cachePosts()
      post = await cacheService.getPostBySlug(slug)
    }
    
    return post
  }

  async getPostsByCategory(categorySlug: string, limit?: number): Promise<CachedPost[]> {
    const posts = await this.getPosts()
    const filtered = posts.filter(post => 
      post.status === 'publish' && 
      post.categories.some(cat => cat.slug === categorySlug)
    )
    
    return limit ? filtered.slice(0, limit) : filtered
  }

  async getRecentPosts(limit: number = 5): Promise<CachedPost[]> {
    const posts = await this.getPosts()
    return posts
      .filter(post => post.status === 'publish')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  // Cache management
  async refreshCache(type?: 'all' | 'products' | 'categories' | 'pages' | 'posts' | 'menus' | 'site-info'): Promise<void> {
    if (type === 'all' || !type) {
      await cacheService.refreshAll()
    } else {
      await cacheService.refreshPartial(type)
    }
  }

  async getCacheStats() {
    return cacheService.getStats()
  }

  async clearCache(): Promise<void> {
    await cacheService.clear()
  }
}

export const cachedAPI = new CachedAPIService()
