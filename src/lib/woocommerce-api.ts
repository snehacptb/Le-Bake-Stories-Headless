import axios from 'axios'
import https from 'https'
import { WooCommerceProduct, Order, Customer, CustomerAddress, WooCommerceCoupon, CouponValidationResult } from '@/types'
import { wooCommerceStatus, WooCommerceStatus } from './woocommerce-status'

class WooCommerceAPI {
  private baseURL: string
  private consumerKey: string
  private consumerSecret: string
  private client: any

  constructor() {
    // Prefer public envs for browser, but gracefully fallback to server-only names if provided
    const envBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_API_URL || ''
    const envConsumerKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || process.env.WORDPRESS_CONSUMER_KEY || ''
    const envConsumerSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || process.env.WORDPRESS_CONSUMER_SECRET || ''

    // Normalize base URL (strip trailing slashes)
    this.baseURL = envBaseUrl.replace(/\/$/, '')
    this.consumerKey = envConsumerKey
    this.consumerSecret = envConsumerSecret
    
    // Handle SSL certificate issues in development for local domains only
    const isLocalDomain = this.baseURL.includes('localhost') || 
                         this.baseURL.includes('127.0.0.1') || 
                         this.baseURL.includes('.local') ||
                         this.baseURL.includes('192.168.') ||
                         this.baseURL.includes('10.0.')
    
    if (process.env.NODE_ENV === 'development' && this.baseURL.startsWith('https://') && isLocalDomain) {
      console.warn('⚠️ Local HTTPS detected in development - this may cause SSL certificate issues')
      console.warn('💡 Consider using HTTP for local development to avoid SSL certificate problems')
    }
    
    // Create axios client with proper authentication - Use HTTPS for production, preserve protocol for local
    let woocommerceBaseURL
    if (isLocalDomain && process.env.NODE_ENV === 'development') {
      // For local development, preserve the original protocol to avoid SSL issues
      woocommerceBaseURL = this.baseURL + '/wp-json/wc/v3'
    } else {
      // For production domains, ensure HTTPS is used
      woocommerceBaseURL = this.baseURL.replace('http://', 'https://') + '/wp-json/wc/v3'
    }
    
    // Debug configuration
    console.log('WooCommerce API Configuration:', {
      originalBaseURL: this.baseURL,
      woocommerceBaseURL: woocommerceBaseURL,
      consumerKey: this.consumerKey ? `${this.consumerKey.substring(0, 8)}...` : 'missing',
      consumerSecret: this.consumerSecret ? `${this.consumerSecret.substring(0, 8)}...` : 'missing',
      isConfigured: this.isConfigured(),
      environment: process.env.NODE_ENV,
      isServer: typeof window === 'undefined'
    })
    
    this.client = axios.create({
      baseURL: woocommerceBaseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Use Basic Auth exactly like curl -u consumer_key:consumer_secret
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret,
      },
      timeout: 8000, // Reduced timeout for faster cart operations
      // Handle self-signed certificates and SSL issues in development
      ...(typeof window === 'undefined' ? {
        // Server-side configuration (Node.js)
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Allow self-signed certificates in development
          keepAlive: true,
          timeout: 15000,
          // Additional SSL options for local development
          secureProtocol: 'TLSv1_2_method',
          ciphers: 'ALL'
        })
      } : {
        // Browser-side configuration
        // Note: Browser security policies prevent disabling SSL verification
        // For local development with self-signed certs, you may need to:
        // 1. Accept the certificate manually in browser
        // 2. Use a proper SSL certificate
        // 3. Add certificate to system trust store
      })
    })

    // Add request interceptor for debugging
    this.client.interceptors.request.use((config: any) => {
      console.log('WooCommerce API Request:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        hasAuth: !!(config.auth?.username && config.auth?.password),
        authMethod: config.auth ? 'Basic Auth' : 'None',
        consumerKey: config.auth?.username ? `${config.auth.username.substring(0, 8)}...` : 'Missing'
      })
      return config
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        console.error('WooCommerce API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        })
        return Promise.reject(error)
      }
    )
  }

  // Helper method to create Store API client with consistent configuration
  private createStoreApiClient(timeout: number = 15000) {
    // Use the same baseURL that was already processed in constructor
    // This ensures consistency between REST API and Store API calls
    let apiBaseURL = this.baseURL

    // If the base URL is missing protocol, default to http for local setups
    if (apiBaseURL && !/^https?:\/\//i.test(apiBaseURL)) {
      apiBaseURL = `http://${apiBaseURL}`
    }

    console.log('Creating Store API client with baseURL:', apiBaseURL)

    return axios.create({
      baseURL: apiBaseURL,
      timeout,
      withCredentials: true, // Enable credentials for cart token persistence
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Handle self-signed certificates and SSL issues in development
      ...(typeof window === 'undefined' ? {
        // Server-side configuration (Node.js)
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Allow self-signed certificates in development
          keepAlive: true,
          timeout: timeout,
          // Additional SSL options for local development
          secureProtocol: 'TLSv1_2_method',
          ciphers: 'ALL'
        })
      } : {
        // Browser-side configuration
        // Browsers handle SSL verification automatically
        // For self-signed certs, user needs to accept them manually
      })
    })
  }

  private isConfigured(): boolean {
    return typeof this.baseURL === 'string' && this.baseURL.length > 0
  }

  /**
   * Check if WooCommerce is available before making API calls
   */
  async checkWooCommerceAvailability(): Promise<boolean> {
    const status = await wooCommerceStatus.checkStatus()
    return status.isActive && status.isConfigured
  }

  /**
   * Get current WooCommerce status
   */
  getWooCommerceStatus(): WooCommerceStatus {
    return wooCommerceStatus.getStatus()
  }

  /**
   * Wrapper for API calls that checks WooCommerce availability first
   */
  private async safeApiCall<T>(
    apiCall: () => Promise<T>,
    fallbackValue?: T,
    operationName?: string
  ): Promise<T> {
    try {
      // Check if WooCommerce is available
      const isAvailable = await this.checkWooCommerceAvailability()
      
      if (!isAvailable) {
        const status = this.getWooCommerceStatus()
        const errorMessage = `WooCommerce is not available: ${status.error || 'Plugin may be deactivated'}`
        
        console.warn(`⚠️ [WC-API] ${operationName || 'API call'} skipped - ${errorMessage}`)
        
        if (fallbackValue !== undefined) {
          return fallbackValue
        }
        
        throw new Error(errorMessage)
      }

      // WooCommerce is available, proceed with API call
      return await apiCall()
    } catch (error: any) {
      // Handle specific WooCommerce deactivation errors
      if (error.response?.status === 404) {
        console.warn(`⚠️ [WC-API] ${operationName || 'API call'} failed - WooCommerce REST API not found (plugin may be deactivated)`)
        console.warn(`   Error code: ${error.response?.data?.code}`)
        
        // Update status to reflect WooCommerce is not active
        wooCommerceStatus.checkStatus()
        
        if (fallbackValue !== undefined) {
          return fallbackValue
        }
        
        throw error
      }
      
      throw error
    }
  }

  // Products
  async getProducts(params: {
    page?: number
    per_page?: number
    search?: string
    category?: string
    tag?: string
    featured?: boolean
    on_sale?: boolean
    min_price?: number
    max_price?: number
    orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating'
    order?: 'asc' | 'desc'
    status?: 'draft' | 'pending' | 'private' | 'publish'
    slug?: string
    include?: number[]
    exclude?: number[]
  } = {}): Promise<WooCommerceProduct[]> {
    return this.safeApiCall(
      async () => {
        console.log('🔄 [WC-API] Fetching products with params:', params)
        console.log('🔄 [WC-API] API configured:', {
          baseURL: this.baseURL,
          hasCredentials: !!(this.consumerKey && this.consumerSecret),
          isConfigured: this.isConfigured()
        })
        
        const response = await this.client.get('/products', { params })
        console.log(`✅ [WC-API] Successfully fetched ${response.data.length} products`)
        return response.data
      },
      [], // Return empty array if WooCommerce is not available
      'getProducts'
    )
  }

  // Get featured products
  async getFeaturedProducts(limit: number = 8): Promise<WooCommerceProduct[]> {
    return this.safeApiCall(
      async () => {
        console.log('🔄 [WC-API] Fetching featured products with limit:', limit)
        
        const response = await this.client.get('/products', {
          params: {
            featured: true,
            per_page: limit,
            status: 'publish'
          }
        })
        
        console.log(`✅ [WC-API] Successfully fetched ${response.data.length} featured products`)
        return response.data
      },
      [], // Return empty array if WooCommerce is not available
      'getFeaturedProducts'
    )
  }

  // Get on sale products
  async getOnSaleProducts(limit: number = 8): Promise<WooCommerceProduct[]> {
    return this.safeApiCall(
      async () => {
        console.log('🔄 [WC-API] Fetching on sale products with limit:', limit)
        
        const response = await this.client.get('/products', {
          params: {
            on_sale: true,
            per_page: limit,
            status: 'publish'
          }
        })
        
        console.log(`✅ [WC-API] Successfully fetched ${response.data.length} on sale products`)
        return response.data
      },
      [], // Return empty array if WooCommerce is not available
      'getOnSaleProducts'
    )
  }

  // Get related products
  async getRelatedProducts(productId: number, limit: number = 4): Promise<WooCommerceProduct[]> {
    return this.safeApiCall(
      async () => {
        console.log('🔄 [WC-API] Fetching related products for product ID:', productId)
        
        const product = await this.getProduct(productId)
        if (!product || !product.related_ids || product.related_ids.length === 0) {
          console.log('No related products found for product ID:', productId)
          return []
        }

        const relatedIds = product.related_ids.slice(0, limit)
        const relatedProducts = await Promise.all(
          relatedIds.map(async (id: number) => {
            try {
              return await this.getProduct(id)
            } catch (error) {
              console.warn(`Failed to fetch related product ${id}:`, error)
              return null
            }
          })
        )
        
        const validProducts = relatedProducts.filter(Boolean) as WooCommerceProduct[]
        console.log(`✅ [WC-API] Successfully fetched ${validProducts.length} related products`)
        return validProducts
      },
      [], // Return empty array if WooCommerce is not available
      'getRelatedProducts'
    )
  }

  // Get products with pagination info
  async getProductsWithPagination(params: {
    page?: number
    per_page?: number
    search?: string
    category?: string
    tag?: string
    featured?: boolean
    on_sale?: boolean
    min_price?: number
    max_price?: number
    orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating'
    order?: 'asc' | 'desc'
    status?: 'draft' | 'pending' | 'private' | 'publish'
    slug?: string
    include?: number[]
    exclude?: number[]
  } = {}): Promise<{ products: WooCommerceProduct[], total: number, totalPages: number }> {
    try {
      console.log('🔄 [WC-API] Fetching products with pagination, params:', params)
      console.log('🔄 [WC-API] Full request URL:', `${this.baseURL}/wp-json/wc/v3/products`)
      
      const response = await this.client.get('/products', { params })
      
      const result = {
        products: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
      }
      
      console.log(`✅ [WC-API] Successfully fetched ${result.products.length} products (${result.total} total)`)
      
      return result
    } catch (error: any) {
      console.error('❌ [WC-API] Error fetching products with pagination:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        url: error.config?.url
      })
      
      // Enhanced error handling for common issues
      if (error.response?.status === 401) {
        console.error('🔑 [WC-API] Authentication Error: Invalid Consumer Key/Secret or insufficient permissions')
        console.error('   Please check:')
        console.error('   1. WooCommerce → Settings → Advanced → REST API')
        console.error('   2. Verify API key permissions are "Read" or "Read/Write"')
        console.error('   3. Ensure API key is associated with Administrator user')
      } else if (error.response?.status === 404) {
        console.error('🚫 [WC-API] WooCommerce REST API endpoint not found')
        console.error('   Please check:')
        console.error('   1. WooCommerce plugin is installed and activated')
        console.error('   2. WordPress URL is correct:', this.baseURL)
        console.error('   3. REST API is enabled in WooCommerce settings')
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🌐 [WC-API] Connection refused - WordPress server not responding')
        console.error('   Please check:')
        console.error('   1. WordPress server is running')
        console.error('   2. Port is accessible')
        console.error('   3. Firewall settings')
      } else if (error.code === 'ENOTFOUND') {
        console.error('🔍 [WC-API] Host not found - DNS resolution failed')
        console.error('   Please check:')
        console.error('   1. Domain name is correct:', this.baseURL)
        console.error('   2. Local hosts file configuration')
        console.error('   3. DNS settings')
      } else if (error.code?.includes('CERT') || error.message?.includes('certificate')) {
        console.error('🔒 [WC-API] SSL Certificate Error')
        console.error('   Please check:')
        console.error('   1. SSL certificate is valid and not expired')
        console.error('   2. Consider using HTTP for local development')
        console.error('   3. Certificate chain is complete')
      }
      
      throw error
    }
  }

  async getProduct(id: number): Promise<WooCommerceProduct> {
    try {
      const response = await this.client.get(`/products/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  async getProductBySlug(slug: string): Promise<WooCommerceProduct> {
    try {
      const response = await this.client.get('/products', {
        params: { slug }
      })
      return response.data[0]
    } catch (error) {
      console.error('Error fetching product by slug:', error)
      throw error
    }
  }

  async getProductVariations(productId: number) {
    try {
      const response = await this.client.get(`/products/${productId}/variations`)
      return response.data
    } catch (error) {
      console.error('Error fetching product variations:', error)
      throw error
    }
  }

  // Categories
  async getProductCategories(params: {
    page?: number
    per_page?: number
    search?: string
    parent?: number
    hide_empty?: boolean
  } = {}) {
    return this.safeApiCall(
      async () => {
        console.log('🔄 [WC-API] Fetching product categories with params:', params)
        const response = await this.client.get('/products/categories', { params })
        
        // Validate response data
        if (!response.data || !Array.isArray(response.data)) {
          console.warn('⚠️ [WC-API] Invalid product categories response format')
          return {
            categories: [],
            total: 0,
            totalPages: 0,
          }
        }
        
        console.log(`✅ [WC-API] Successfully fetched ${response.data.length} product categories`)
        return {
          categories: response.data,
          total: parseInt(response.headers['x-wp-total'] || '0'),
          totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
        }
      },
      {
        categories: [],
        total: 0,
        totalPages: 0,
      },
      'getProductCategories'
    )
  }

  // Cart (using WooCommerce Store API)
  async getCart(cartKey?: string) {
    return this.safeApiCall(
      async () => {
        if (!this.isConfigured()) {
          console.warn('WooCommerce Store API base URL is not configured. Skipping getCart().')
          return null
        }
        
        let effectiveCartKey = cartKey
        
        // If no cart key is provided, try to get a valid nonce
        if (!effectiveCartKey) {
          console.log('No cart key provided for getCart, attempting to get Store API nonce...')
          try {
            effectiveCartKey = await this.getStoreApiNonce()
            console.log('Got Store API nonce for getCart:', effectiveCartKey ? effectiveCartKey.substring(0, 10) + '...' : 'null')
          } catch (nonceError) {
            console.warn('Failed to get Store API nonce for getCart, proceeding without token:', nonceError)
          }
        }
        
        const headers: any = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
        
        if (effectiveCartKey) {
          headers['Cart-Token'] = effectiveCartKey
          headers['X-WC-Store-API-Nonce'] = effectiveCartKey
        }
        
        // Create Store API client with consistent configuration
        const storeApiClient = this.createStoreApiClient()
        
        console.log('Getting cart with headers:', Object.keys(headers))
        const response = await storeApiClient.get('/wp-json/wc/store/v1/cart', { headers })
        
        // Ensure we return the cart token for future requests
        const cartData = response.data
        if (cartData && !cartData.cart_token && cartKey) {
          cartData.cart_token = cartKey
        }
        
        // Extract cart token from response headers if not in data
        if (cartData && !cartData.cart_token) {
          // Try different possible header names for cart token
          const possibleHeaders = ['cart-token', 'Cart-Token', 'x-wc-store-api-nonce', 'X-WC-Store-API-Nonce']
          for (const headerName of possibleHeaders) {
            if (response.headers[headerName]) {
              cartData.cart_token = response.headers[headerName]
              console.log(`Found cart token in getCart header ${headerName}:`, cartData.cart_token.substring(0, 10) + '...')
              break
            }
          }
        }
        
        return cartData
      },
      null, // Return null if WooCommerce is not available
      'getCart'
    )
  }

  async addToCart(productId: number, quantity: number = 1, variation?: any) {
    try {
      // Use WooCommerce REST API v3 for cart operations with authentication
      const response = await this.client.post('/orders', {
        status: 'pending',
        line_items: [{
          product_id: productId,
          quantity,
          variation_id: variation?.id || 0,
        }]
      })
      return response.data
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  // Store API method for adding to cart with proper cart token management
  async addToCartStore(productId: number, quantity: number = 1, cartToken?: string): Promise<any> {
    return this.safeApiCall(
      async () => {
        if (!this.isConfigured()) {
          console.warn('WooCommerce Store API base URL is not configured. Skipping addToCartStore().')
          return null
        }
        
        // Create Store API client with consistent configuration
        const storeApiClient = this.createStoreApiClient()
        
        let effectiveCartToken = cartToken
        
        // If no cart token is provided, try to get a valid nonce from the Store API
        if (!effectiveCartToken) {
          console.log('No cart token provided, attempting to get Store API nonce...')
          try {
            effectiveCartToken = await this.getStoreApiNonce()
            console.log('Got Store API nonce for cart operation:', effectiveCartToken ? effectiveCartToken.substring(0, 10) + '...' : 'null')
          } catch (nonceError) {
            console.warn('Failed to get Store API nonce, proceeding without token:', nonceError)
          }
        }
        
        const headers: any = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
        
        if (effectiveCartToken) {
          headers['Cart-Token'] = effectiveCartToken
          headers['X-WC-Store-API-Nonce'] = effectiveCartToken
        }

        console.log('Adding to cart:', { productId, quantity, hasCartToken: !!effectiveCartToken })
        
        // Use shorter timeout for cart operations to improve perceived performance
        const cartTimeout = 5000
        
        const response = await storeApiClient.post('/wp-json/wc/store/v1/cart/add-item', {
          id: String(productId), // Store API expects string
          quantity: Number(quantity),
        }, { 
          headers,
          timeout: cartTimeout // Faster timeout for cart operations
        })
        
        console.log('Cart add response:', response.data)
        
        // Extract cart token from response headers if not in data
        const responseData = response.data
        if (!responseData.cart_token) {
          // Try different possible header names for cart token
          const possibleHeaders = ['cart-token', 'Cart-Token', 'x-wc-store-api-nonce', 'X-WC-Store-API-Nonce']
          for (const headerName of possibleHeaders) {
            if (response.headers[headerName]) {
              responseData.cart_token = response.headers[headerName]
              console.log(`Found cart token in header ${headerName}:`, responseData.cart_token.substring(0, 10) + '...')
              break
            }
          }
        }
        
        return responseData
      },
      null, // Return null if WooCommerce is not available
      'addToCartStore'
    ).catch(async (error: any) => {
      // Enhanced error handling for Store API authentication issues
      if (error.response?.status === 401) {
        console.error('🔑 [Store API] Authentication Error (401 Unauthorized)')
        console.error('   This typically means:')
        console.error('   1. WooCommerce Store API requires a valid nonce')
        console.error('   2. Cart token is invalid or expired')
        console.error('   3. Store API authentication is not properly configured')
        
        // Try to get a fresh nonce and retry once
        if (!cartToken) { // Only retry if we didn't already have a token
          console.log('Attempting to retry with fresh nonce...')
          try {
            const freshNonce = await this.getStoreApiNonce()
            if (freshNonce) {
              console.log('Got fresh nonce, retrying cart operation...')
              return this.addToCartStore(productId, quantity, freshNonce)
            }
          } catch (retryError) {
            console.error('Failed to get fresh nonce for retry:', retryError)
          }
        }
        
        // If retry failed or we already had a token, provide helpful error message
        const enhancedError = new Error('Cart operation failed: Authentication required. Please refresh the page and try again.')
        ;(enhancedError as any).code = 'STORE_API_AUTH_FAILED'
        ;(enhancedError as any).originalError = error
        throw enhancedError
      }
      
      // Re-throw other errors
      throw error
    })
  }

  async updateCartItem(cartKey: string, itemKey: string, quantity: number) {
    try {
      if (!this.isConfigured()) {
        console.warn('WooCommerce Store API base URL is not configured. Skipping updateCartItem().')
        return null
      }
      const storeApiClient = this.createStoreApiClient()
      
      const response = await storeApiClient.post('/wp-json/wc/store/v1/cart/update-item', {
        key: itemKey,
        quantity,
      }, {
        headers: { 
          'Cart-Token': cartKey,
          'X-WC-Store-API-Nonce': cartKey,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating cart item:', error)
      throw error
    }
  }

  async removeCartItem(cartKey: string, itemKey: string) {
    try {
      if (!this.isConfigured()) {
        console.warn('WooCommerce Store API base URL is not configured. Skipping removeCartItem().')
        return null
      }
      const storeApiClient = this.createStoreApiClient()
      
      const response = await storeApiClient.post('/wp-json/wc/store/v1/cart/remove-item', {
        key: itemKey
      }, {
        headers: { 
          'Cart-Token': cartKey,
          'X-WC-Store-API-Nonce': cartKey,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error removing cart item:', error)
      throw error
    }
  }

  // Clear entire cart via Store API
  async clearCartStore(cartKey: string) {
    try {
      if (!this.isConfigured()) {
        console.warn('WooCommerce Store API base URL is not configured. Skipping clearCartStore().')
        return { success: true }
      }
      // WooCommerce Store API doesn't have a direct clear endpoint
      // We'll get the cart first, then remove all items
      const cart = await this.getCart(cartKey)
      
      if (cart && cart.items) {
        for (const item of cart.items) {
          await this.removeCartItem(cartKey, item.key)
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }


  // Countries and States
  async getCountries(): Promise<{[key: string]: string}> {
    try {
      console.log('Fetching countries from WooCommerce API...')
      
      // Don't send cache-control header in browser to avoid CORS issues
      const requestConfig: any = {
        timeout: 10000 // Increased timeout for better reliability
      }
      
      // Only add cache-control header on server-side
      if (typeof window === 'undefined') {
        requestConfig.headers = { 'Cache-Control': 'max-age=300' }
      }
      
      const response = await this.client.get('/data/countries', requestConfig)
      
      // Normalize the response to ensure string values
      const countries = response.data
      const normalizedCountries: {[key: string]: string} = {}
      
      for (const [code, name] of Object.entries(countries)) {
        // Handle both string and object values
        if (typeof name === 'string') {
          normalizedCountries[code] = name
        } else if (typeof name === 'object' && name !== null) {
          normalizedCountries[code] = (name as any).name || code
        } else {
          normalizedCountries[code] = code
        }
      }
      
      console.log('Countries fetched successfully:', Object.keys(normalizedCountries).length, 'countries')
      return normalizedCountries
    } catch (error: any) {
      console.error('Failed to fetch countries:', error)
      
      // Provide detailed error information for debugging
      if (error.response?.status === 404) {
        throw new Error('WooCommerce countries endpoint not found. Please ensure WooCommerce is installed and activated.')
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your WooCommerce API credentials.')
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to WordPress server. Please check if the server is running.')
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('WordPress server not found. Please check your WORDPRESS_URL configuration.')
      } else {
        throw new Error(`Failed to load countries: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // Countries and States combined (single fetch, like WC checkout)
  async getCountriesData(): Promise<{ [code: string]: { name: string, states: { [code: string]: string } } }> {
    try {
      console.log('Fetching countries+states from WooCommerce API...')
      const requestConfig: any = { timeout: 15000 }
      if (typeof window === 'undefined') {
        requestConfig.headers = { 'Cache-Control': 'max-age=600' }
      }
      const response = await this.client.get('/data/countries', requestConfig)
      const raw = response.data || {}
      const normalized: { [code: string]: { name: string, states: { [code: string]: string } } } = {}
      for (const [code, entry] of Object.entries<any>(raw)) {
        let name: string
        let states: { [code: string]: string } = {}
        if (typeof entry === 'string') {
          name = entry
        } else {
          name = entry?.name || String(code)
          if (entry?.states && typeof entry.states === 'object') {
            for (const [s, v] of Object.entries<any>(entry.states)) {
              states[s] = typeof v === 'string' ? v : (v?.name || s)
            }
          }
        }
        normalized[String(code).toUpperCase()] = { name, states }
      }
      console.log('Countries+states fetched successfully:', Object.keys(normalized).length)
      return normalized
    } catch (error: any) {
      console.error('Failed to fetch countries+states:', error)
      throw new Error(error?.message || 'Failed to load countries data')
    }
  }

  async getStates(countryCode: string | number): Promise<{[key: string]: string}> {
    // Convert numeric country codes to proper ISO codes
    let normalizedCountryCode = String(countryCode)
    switch (normalizedCountryCode) {
      case '102': normalizedCountryCode = 'IN'; break // India
      case '40': normalizedCountryCode = 'AT'; break  // Austria
      case '1': normalizedCountryCode = 'US'; break   // United States
      case '44': normalizedCountryCode = 'GB'; break  // United Kingdom
      case '91': normalizedCountryCode = 'IN'; break  // India (phone code)
      default:
        if (/^[A-Z]{2}$/i.test(normalizedCountryCode)) {
          normalizedCountryCode = normalizedCountryCode.toUpperCase()
        } else if (/^\d+$/.test(normalizedCountryCode)) {
          console.warn(`Unknown numeric country code: ${normalizedCountryCode}, defaulting to IN`)
          normalizedCountryCode = 'IN'
        }
        break
    }

    const normalizeStates = (states: Record<string, any>): {[key: string]: string} => {
      const out: {[key: string]: string} = {}
      for (const [code, name] of Object.entries(states || {})) {
        if (typeof name === 'string') out[code] = name
        else if (typeof name === 'object' && name !== null) out[code] = (name as any).name || code
        else out[code] = code
      }
      return out
    }

    const makeRequest = async (timeoutMs: number) => {
      const requestConfig: any = { timeout: timeoutMs }
      if (typeof window === 'undefined') {
        requestConfig.headers = { 'Cache-Control': 'max-age=600' }
      }
      return this.client.get(`/data/countries/${normalizedCountryCode}`, requestConfig)
    }

    try {
      console.log('Fetching states for country:', normalizedCountryCode)
      // Attempt 1 (longer timeout)
      const res1 = await makeRequest(10000)
      return normalizeStates(res1.data.states || {})
    } catch (err1: any) {
      // Retry once on timeout or network error
      const timedOut = err1?.code === 'ECONNABORTED' || /timeout/i.test(err1?.message || '')
      if (timedOut) {
        console.warn(`States request timed out for ${normalizedCountryCode}, retrying with longer timeout...`)
        try {
          const res2 = await makeRequest(15000)
          return normalizeStates(res2.data.states || {})
        } catch (err2) {
          console.warn(`Retry failed for ${normalizedCountryCode}, attempting fallback via /data/countries`)
        }
      } else {
        console.warn(`States request failed for ${normalizedCountryCode}, attempting fallback via /data/countries`)
      }

      // Fallback: fetch all countries and extract this country's states
      try {
        const fallbackConfig: any = { timeout: 15000 }
        if (typeof window === 'undefined') {
          fallbackConfig.headers = { 'Cache-Control': 'max-age=600' }
        }
        const allCountriesRes = await this.client.get('/data/countries', fallbackConfig)
        const countryEntry = allCountriesRes.data?.[normalizedCountryCode]
        const states = countryEntry?.states || {}
        const normalized = normalizeStates(states)
        console.log('States fetched via fallback for', normalizedCountryCode, ':', Object.keys(normalized).length)
        return normalized
      } catch (fallbackErr) {
        console.error('Failed to fetch states (including fallback) for country:', normalizedCountryCode, fallbackErr)
        // Final fallback: return empty so UI falls back to text input
        return {}
      }
    }
  }

  // Orders - Direct WooCommerce REST API (matches curl example exactly)
  async createOrder(orderData: {
    payment_method: string
    payment_method_title: string
    set_paid?: boolean
    billing: CustomerAddress
    shipping: CustomerAddress
    line_items: Array<{
      product_id: number
      quantity: number
      variation_id?: number
    }>
    shipping_lines?: Array<{
      method_id: string
      method_title: string
      total: string
    }>
    coupon_lines?: Array<{
      code: string
    }>
    customer_note?: string
    customer_id?: number
  }): Promise<Order> {
    try {
      // Validate required billing fields
      const requiredBillingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'country', 'email']
      const missingBillingFields = requiredBillingFields.filter(field => {
        const value = orderData.billing[field as keyof CustomerAddress]
        return !value || (typeof value === 'string' && value.trim() === '')
      })
      
      if (missingBillingFields.length > 0) {
        throw new Error(`Missing required billing fields: ${missingBillingFields.join(', ')}`)
      }
      
      // Structure order data exactly like curl example
      const wooCommerceOrderData = {
        payment_method: orderData.payment_method,
        payment_method_title: orderData.payment_method_title,
        set_paid: orderData.set_paid || false,
        billing: {
          first_name: orderData.billing.first_name,
          last_name: orderData.billing.last_name,
          address_1: orderData.billing.address_1,
          address_2: orderData.billing.address_2 || '',
          city: orderData.billing.city,
          state: orderData.billing.state,
          postcode: orderData.billing.postcode,
          country: orderData.billing.country,
          email: orderData.billing.email,
          phone: orderData.billing.phone || ''
        },
        shipping: {
          first_name: orderData.shipping.first_name,
          last_name: orderData.shipping.last_name,
          address_1: orderData.shipping.address_1,
          address_2: orderData.shipping.address_2 || '',
          city: orderData.shipping.city,
          state: orderData.shipping.state,
          postcode: orderData.shipping.postcode,
          country: orderData.shipping.country
        },
        line_items: orderData.line_items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          ...(item.variation_id && { variation_id: item.variation_id })
        })),
        ...(orderData.shipping_lines && orderData.shipping_lines.length > 0 && {
          shipping_lines: orderData.shipping_lines
        }),
        ...(orderData.coupon_lines && orderData.coupon_lines.length > 0 && {
          coupon_lines: orderData.coupon_lines
        }),
        ...(orderData.customer_note && { customer_note: orderData.customer_note }),
        ...(orderData.customer_id && orderData.customer_id > 0 && { customer_id: orderData.customer_id })
      }
      
      console.log('Creating WooCommerce order with data:', {
        payment_method: wooCommerceOrderData.payment_method,
        billing_email: wooCommerceOrderData.billing.email,
        line_items_count: wooCommerceOrderData.line_items.length,
        customer_id: (wooCommerceOrderData as any).customer_id || 'guest'
      })

      const response = await this.client.post('/orders', wooCommerceOrderData)
      
      // Handle different response formats
      let orderData_response
      if (typeof response.data === 'string') {
        try {
          orderData_response = JSON.parse(response.data)
        } catch (parseError) {
          console.warn('Failed to parse order response as JSON, checking for empty response...')
          
          // Check if order was created despite empty response
          if (response.status === 201 || response.status === 200) {
            console.log('Order appears to have been created (status 201/200) despite empty response')
            
            // Try to extract order ID from Location header
            const locationHeader = response.headers['location'] || response.headers['Location']
            if (locationHeader) {
              const orderIdMatch = locationHeader.match(/\/orders\/(\d+)/)
              if (orderIdMatch) {
                const orderId = parseInt(orderIdMatch[1])
                console.log('Extracted order ID from Location header:', orderId)
                
                // Try to fetch the order details
                try {
                  const orderDetails = await this.getOrder(orderId)
                  console.log('Successfully retrieved order details after creation')
                  return orderDetails
                } catch (fetchError) {
                  console.warn('Failed to fetch order details, returning minimal order object')
                  return { id: orderId, status: 'pending' } as Order
                }
              }
            }
            
            // Fallback: try to get recent orders to find the newly created one
            try {
              console.log('Attempting to find newly created order in recent orders...')
              const recentOrders = await this.getOrders(orderData.customer_id, { per_page: 5, orderby: 'date', order: 'desc' })
              if (recentOrders.orders.length > 0) {
                console.log('Found recent order, assuming it\'s the newly created one')
                return recentOrders.orders[0]
              }
            } catch (recentOrdersError) {
              console.warn('Failed to fetch recent orders')
            }
            
            // Final fallback
            console.warn('Unable to retrieve order details, returning success indicator')
            return { id: Date.now(), status: 'pending', created_via: 'rest-api' } as Order
          }
          
          throw new Error('Failed to parse order response and no success status')
        }
      } else {
        orderData_response = response.data
      }
      
      console.log('Order created successfully:', {
        id: orderData_response.id,
        status: orderData_response.status,
        total: orderData_response.total
      })
      
      return orderData_response
    } catch (error: any) {
      console.error('Error creating order:', error)
      
      // Enhanced error handling for different WooCommerce error codes
      if (error.response?.data) {
        const errorData = error.response.data
        const errorCode = errorData.code
        const errorMessage = errorData.message || 'Unknown order error'
        
        console.error('WooCommerce order error:', { 
          code: errorCode, 
          message: errorMessage,
          data: errorData.data,
          status: error.response.status
        })

        // Log specific parameter validation errors
        if (errorData.data?.params) {
          console.error('Invalid parameters:', errorData.data.params)
        }

        // Special handling for billing parameter errors
        if (errorMessage.includes('billing') || errorMessage.includes('Invalid parameter(s): billing')) {
          console.error('Billing address validation failed. Check required fields:')
          console.error('Required: first_name, last_name, address_1, city, state, postcode, country, email')
        }
        
        // Categorize errors for better user experience
        let userFriendlyMessage = errorMessage
        switch (errorCode) {
          case 'woocommerce_rest_cannot_create':
            userFriendlyMessage = 'Unable to create order. Please check your information and try again.'
            break
          case 'woocommerce_rest_invalid_product_id':
            userFriendlyMessage = 'One or more products in your cart are no longer available.'
            break
          case 'woocommerce_rest_invalid_customer_id':
            userFriendlyMessage = 'Customer information is invalid. Please refresh and try again.'
            break
          case 'woocommerce_rest_insufficient_stock':
            userFriendlyMessage = 'Insufficient stock for one or more items in your cart.'
            break
          case 'rest_invalid_param':
            if (errorMessage.includes('billing')) {
              userFriendlyMessage = 'Please check your billing address information. Some required fields may be missing or invalid.'
            }
            break
        }
        
        const orderError = new Error(userFriendlyMessage)
        ;(orderError as any).code = errorCode
        ;(orderError as any).data = errorData
        throw orderError
      }
      
      throw error
    }
  }


  async getOrder(id: number): Promise<Order> {
    try {
      const response = await this.client.get(`/orders/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching order:', error)
      throw error
    }
  }

  async getOrders(customerId?: number, params: {
    page?: number
    per_page?: number
    status?: string
    orderby?: string
    order?: 'asc' | 'desc'
  } = {}): Promise<{ orders: Order[], total: number, totalPages: number }> {
    try {
      const queryParams = customerId ? { ...params, customer: customerId } : params
      const response = await this.client.get('/orders', { params: queryParams })
      return {
        orders: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  }

  // Payment Processing Methods
  async updateOrderStatus(orderId: number, status: string, customerNote?: string): Promise<Order> {
    try {
      console.log(`Updating order ${orderId} status to: ${status}`)
      
      const updateData: any = { status }
      if (customerNote) {
        updateData.customer_note = customerNote
      }
      
      const response = await this.client.put(`/orders/${orderId}`, updateData)
      
      console.log('Order status updated successfully:', {
        orderId: response.data.id,
        newStatus: response.data.status,
        dateModified: response.data.date_modified
      })
      
      return response.data
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  async markOrderAsPaid(orderId: number, transactionId?: string, paymentMethod?: string): Promise<Order> {
    try {
      console.log(`Marking order ${orderId} as paid`, { transactionId, paymentMethod })
      
      const updateData: any = {
        status: 'processing', // or 'completed' depending on your workflow
        set_paid: true
      }
      
      // Add transaction ID if provided
      if (transactionId) {
        updateData.transaction_id = transactionId
      }
      
      // Update payment method if provided
      if (paymentMethod) {
        updateData.payment_method = paymentMethod
      }
      
      // Add meta data for payment confirmation
      updateData.meta_data = [
        {
          key: '_payment_confirmed_at',
          value: new Date().toISOString()
        }
      ]
      
      if (transactionId) {
        updateData.meta_data.push({
          key: '_transaction_id',
          value: transactionId
        })
      }
      
      const response = await this.client.put(`/orders/${orderId}`, updateData)
      
      console.log('Order marked as paid successfully:', {
        orderId: response.data.id,
        status: response.data.status,
        transactionId: response.data.transaction_id,
        datePaid: response.data.date_paid
      })
      
      return response.data
    } catch (error) {
      console.error('Error marking order as paid:', error)
      throw error
    }
  }

  // Store API Nonce Retrieval with Fallback
  async getStoreApiNonce(): Promise<string> {
    try {
      if (!this.isConfigured()) {
        console.warn('WooCommerce Store API base URL is not configured. Using fallback nonce.')
        return 'fallback-nonce-' + Date.now()
      }
      
      console.log('Attempting to get Store API nonce from:', this.baseURL)
      const storeApiClient = this.createStoreApiClient(10000)
      
      // Try to get nonce from Store API cart endpoint
      const response = await storeApiClient.get('/wp-json/wc/store/v1/cart', {
        // Add headers that might help with CORS and authentication
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Store API nonce response status:', response.status)
      console.log('Store API nonce response headers:', Object.keys(response.headers))
      
      // Extract nonce from headers - try multiple possible header names
      const possibleNonceHeaders = [
        'x-wc-store-api-nonce',
        'X-WC-Store-API-Nonce', 
        'cart-token',
        'Cart-Token',
        'nonce',
        'Nonce'
      ]
      
      let nonce = null
      for (const headerName of possibleNonceHeaders) {
        if (response.headers[headerName]) {
          nonce = response.headers[headerName]
          console.log(`Found nonce in header '${headerName}':`, nonce.substring(0, 10) + '...')
          break
        }
      }
      
      if (nonce) {
        console.log('Store API nonce retrieved successfully')
        return nonce
      }
      
      // Check if the response itself contains cart data with a token
      if (response.data && response.data.cart_token) {
        console.log('Found cart token in response data:', response.data.cart_token.substring(0, 10) + '...')
        return response.data.cart_token
      }
      
      // Fallback nonce
      console.warn('No nonce found in Store API response headers or data, using fallback')
      console.warn('Available headers:', Object.keys(response.headers))
      return 'fallback-nonce-' + Date.now()
      
    } catch (error: any) {
      console.error('Failed to get Store API nonce:', error)
      
      // Provide specific error information for debugging
      if (error.response?.status === 404) {
        console.error('Store API endpoint not found - WooCommerce may not be installed or Store API disabled')
      } else if (error.response?.status === 401) {
        console.error('Store API authentication failed - this might be expected for initial nonce requests')
      } else if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused to WordPress server')
      } else if (error.code === 'ENOTFOUND') {
        console.error('WordPress server not found - check domain configuration')
      }
      
      // Always return a fallback nonce instead of throwing
      return 'fallback-nonce-' + Date.now()
    }
  }

  // Customers
  async createCustomer(customerData: {
    email: string
    first_name: string
    last_name: string
    username?: string
    password: string
    billing?: CustomerAddress
    shipping?: CustomerAddress
  }): Promise<Customer> {
    try {
      const response = await this.client.post('/customers', customerData)
      return response.data
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  // WooCommerce Store API Registration - Note: Store API doesn't have customer registration
  async registerCustomerViaStoreAPI(customerData: {
    email: string
    password: string
    first_name: string
    last_name: string
    username?: string
  }): Promise<{ success: boolean, customer?: Customer, message?: string }> {
    // Note: WooCommerce Store API doesn't actually have a customer registration endpoint
    // The Store API is primarily for cart and checkout operations, not user management
    // This method is kept for backward compatibility but will always fail
    
    console.warn('WooCommerce Store API does not support customer registration.')
    console.warn('The Store API is designed for cart and checkout operations only.')
    console.warn('Customer registration should use the WooCommerce REST API instead.')
    
    return {
      success: false,
      message: 'WooCommerce Store API does not support customer registration. Using REST API fallback.'
    }
  }

  // WooCommerce REST API Registration - Fallback method for headless WordPress sites
  async registerCustomerViaWooCommerce(customerData: {
    email: string
    password: string
    first_name: string
    last_name: string
    username?: string
  }): Promise<{ success: boolean, customer?: Customer, message?: string }> {
    try {
      if (!this.isConfigured()) {
        console.warn('WooCommerce REST API is not configured. Cannot register customer.')
        throw new Error('WooCommerce REST API is not configured')
      }

      console.log('Starting WooCommerce REST API customer registration for:', customerData.email)
      
      // Prepare registration data for WooCommerce REST API (fallback method)
      const registrationData = {
        email: customerData.email,
        password: customerData.password,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        username: customerData.username || customerData.email.split('@')[0],
        role: 'customer',
        billing: {
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          email: customerData.email
        },
        shipping: {
          first_name: customerData.first_name,
          last_name: customerData.last_name
        }
      }

      console.log('REST API Registration data being sent:', {
        email: registrationData.email,
        username: registrationData.username,
        first_name: registrationData.first_name,
        last_name: registrationData.last_name,
        role: registrationData.role,
        hasPassword: !!registrationData.password
      })
      
      console.log('Attempting WooCommerce REST API registration to:', `${this.baseURL}/wp-json/wc/v3/customers`)
      
      // Use WooCommerce REST API customer creation endpoint (fallback method)
      const response = await this.client.post('/customers', registrationData)

      console.log('WooCommerce REST API Registration Response Status:', response.status, response.statusText)
      console.log('WooCommerce REST API Registration Success:', {
        hasCustomer: !!response.data,
        customerId: response.data?.id,
        customerEmail: response.data?.email
      })

      return {
        success: true,
        customer: response.data,
        message: 'Registration successful'
      }

    } catch (error: any) {
      console.error('WooCommerce REST API registration error:', error)
      
      let errorMessage = 'Registration failed. Please try again.'
      
      // Handle WooCommerce REST API specific errors
      if (error.response?.data) {
        const errorData = error.response.data
        console.error('WooCommerce REST API Registration Error Details:', errorData)
        
        // Handle specific WooCommerce REST API error codes
        if (errorData.code === 'registration-error-email-exists' || errorData.code === 'existing_user_email') {
          errorMessage = 'An account with this email address already exists. Please use a different email or try logging in.'
        } else if (errorData.code === 'registration-error-username-exists' || errorData.code === 'existing_user_login') {
          errorMessage = 'This username is already taken. Please choose a different username.'
        } else if (errorData.code === 'woocommerce_rest_invalid_email') {
          errorMessage = 'Please enter a valid email address.'
        } else if (errorData.code === 'woocommerce_rest_invalid_username') {
          errorMessage = 'Please enter a valid username.'
        } else if (errorData.code === 'woocommerce_rest_invalid_password') {
          errorMessage = 'Please enter a valid password.'
        } else if (errorData.code === 'woocommerce_rest_cannot_create') {
          errorMessage = 'User registration is currently disabled. Please contact the administrator.'
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (error.response?.status) {
        // Handle HTTP status codes
        if (error.response.status === 403) {
          errorMessage = 'User registration is disabled on this site. Please contact the administrator.'
        } else if (error.response.status === 404) {
          errorMessage = 'Registration endpoint not found. Please check WooCommerce REST API configuration.'
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid registration data. Please check your information and try again.'
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please check WooCommerce API credentials.'
        }
      }
      
      return {
        success: false,
        message: errorMessage
      }
    }
  }

  async getCustomer(id: number): Promise<Customer> {
    try {
      const response = await this.client.get(`/customers/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching customer:', error)
      throw error
    }
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
    try {
      const response = await this.client.put(`/customers/${id}`, customerData)
      return response.data
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  // Payment methods
  async getPaymentGateways() {
    return this.safeApiCall(
      async () => {
        console.log('🔄 [WC-API] Fetching payment gateways...')
        
        const response = await this.client.get('/payment_gateways')
        console.log('Payment gateways response:', {
          total: response.data.length,
          enabled: response.data.filter((gateway: any) => gateway.enabled).length
        })
        
        const enabledGateways = response.data.filter((gateway: any) => gateway.enabled)
        
        if (enabledGateways.length === 0) {
          console.warn('No enabled payment gateways found')
          console.log('Available gateways (disabled):', response.data.map((g: any) => ({ id: g.id, title: g.title, enabled: g.enabled })))
          throw new Error('No payment gateways are enabled in WooCommerce. Please configure payment methods in WooCommerce settings.')
        }
        
        console.log('✅ [WC-API] Enabled payment gateways:', enabledGateways.map((g: any) => ({ id: g.id, title: g.title })))
        return enabledGateways
      },
      [], // Return empty array if WooCommerce is not available
      'getPaymentGateways'
    ).catch((error: any) => {
      console.error('Error fetching payment gateways:', error)
      
      // Provide detailed error information
      if (error.response?.status === 404) {
        throw new Error('WooCommerce payment gateways endpoint not found. Please ensure WooCommerce is installed and activated.')
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your WooCommerce API credentials.')
      } else if (error.message?.includes('No payment gateways')) {
        throw error // Re-throw our custom message
      } else {
        throw new Error(`Failed to load payment methods: ${error.message || 'Unknown error'}`)
      }
    })
  }

  // Shipping methods
  async getShippingZones() {
    try {
      const response = await this.client.get('/shipping/zones')
      return response.data
    } catch (error: any) {
      console.error('Error fetching shipping zones:', error)
      
      // Provide detailed error information
      if (error.response?.status === 404) {
        throw new Error('WooCommerce shipping zones endpoint not found. Please ensure WooCommerce is installed and activated.')
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your WooCommerce API credentials.')
      } else {
        throw new Error(`Failed to load shipping zones: ${error.message || 'Unknown error'}`)
      }
    }
  }

  async getShippingMethods(zoneId: number) {
    try {
      const response = await this.client.get(`/shipping/zones/${zoneId}/methods`)
      const enabledMethods = response.data.filter((method: any) => method.enabled)
      
      // Don't throw error if no methods - many stores use simple shipping
      if (enabledMethods.length === 0) {
        console.warn(`No shipping methods enabled for zone ${zoneId}`)
        return [] // Return empty array instead of throwing error
      }
      
      return enabledMethods
    } catch (error: any) {
      console.error('Error fetching shipping methods:', error)
      
      // Provide detailed error information
      if (error.response?.status === 404) {
        throw new Error('WooCommerce shipping methods endpoint not found. Please ensure WooCommerce is installed and activated.')
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your WooCommerce API credentials.')
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to WordPress server. Please check if the server is running.')
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('WordPress server not found. Please check your WORDPRESS_URL configuration.')
      } else {
        throw new Error(`Failed to load shipping methods: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // Coupons
  async getCoupons(params: {
    page?: number
    per_page?: number
    search?: string
    code?: string
  } = {}) {
    try {
      const response = await this.client.get('/coupons', { params })
      return {
        coupons: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      throw error
    }
  }

  async getCouponByCode(code: string): Promise<WooCommerceCoupon | null> {
    try {
      const response = await this.client.get('/coupons', {
        params: { code }
      })
      return response.data.length > 0 ? response.data[0] : null
    } catch (error: any) {
      console.error('Error fetching coupon by code:', error)
      
      // Provide detailed error information
      if (error.response?.status === 404) {
        throw new Error('WooCommerce coupons endpoint not found. Please ensure WooCommerce is installed and activated.')
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your WooCommerce API credentials.')
      } else {
        throw new Error(`Failed to fetch coupon: ${error.message || 'Unknown error'}`)
      }
    }
  }

  async validateCoupon(code: string, cartTotal: number = 0, userEmail?: string): Promise<CouponValidationResult> {
    try {
      const coupon = await this.getCouponByCode(code)
      
      if (!coupon) {
        return {
          valid: false,
          error: 'Coupon code not found',
          errorCode: 'woocommerce_coupon_not_exist'
        }
      }

      // Check if coupon is expired
      if (coupon.date_expires) {
        const expiryDate = new Date(coupon.date_expires)
        const now = new Date()
        if (now > expiryDate) {
          return {
            valid: false,
            error: 'This coupon has expired',
            errorCode: 'woocommerce_coupon_expired'
          }
        }
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return {
          valid: false,
          error: 'Coupon usage limit has been reached',
          errorCode: 'woocommerce_coupon_usage_limit_reached'
        }
      }

      // Check minimum amount
      if (coupon.minimum_amount && cartTotal < parseFloat(coupon.minimum_amount)) {
        return {
          valid: false,
          error: `Minimum order amount of $${coupon.minimum_amount} required`,
          errorCode: 'woocommerce_coupon_minimum_amount'
        }
      }

      // Check maximum amount
      if (coupon.maximum_amount && cartTotal > parseFloat(coupon.maximum_amount)) {
        return {
          valid: false,
          error: `Maximum order amount of $${coupon.maximum_amount} exceeded`,
          errorCode: 'woocommerce_coupon_maximum_amount'
        }
      }

      // Check email restrictions
      if (coupon.email_restrictions.length > 0 && userEmail) {
        const emailAllowed = coupon.email_restrictions.some(email => 
          email.toLowerCase() === userEmail.toLowerCase() || 
          (email.includes('*') && new RegExp(email.replace(/\*/g, '.*')).test(userEmail))
        )
        if (!emailAllowed) {
          return {
            valid: false,
            error: 'This coupon is not valid for your email address',
            errorCode: 'woocommerce_coupon_not_valid_for_email'
          }
        }
      }

      return {
        valid: true,
        coupon
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      return {
        valid: false,
        error: 'Error validating coupon',
        errorCode: 'woocommerce_coupon_validation_error'
      }
    }
  }

  async applyCoupon(cartKey: string, couponCode: string) {
    try {
      if (!this.isConfigured()) {
        console.warn('WooCommerce Store API base URL is not configured. Skipping applyCoupon().')
        return null
      }

      const storeApiClient = this.createStoreApiClient()

      console.log('Applying coupon:', { code: couponCode, cartKey: cartKey ? cartKey.substring(0, 10) + '...' : 'null' })

      const response = await storeApiClient.post('/wp-json/wc/store/v1/cart/apply-coupon', {
        code: couponCode,
      }, {
        headers: { 
          'Cart-Token': cartKey,
          'X-WC-Store-API-Nonce': cartKey,
          'Content-Type': 'application/json'
        }
      })

      console.log('Coupon applied successfully:', response.data)
      console.log('Response headers after coupon apply:', response.headers)
      
      // Check if we got a new cart token from the response
      const newCartToken = response.headers['cart-token'] || response.headers['Cart-Token'] || 
                          response.headers['x-wc-store-api-nonce'] || response.headers['X-WC-Store-API-Nonce']
      if (newCartToken && newCartToken !== cartKey) {
        console.log('New cart token received after coupon apply:', newCartToken.substring(0, 10) + '...')
        response.data.cart_token = newCartToken
      }
      
      return response.data
    } catch (error: any) {
      console.error('Error applying coupon:', error)
      
      // Handle specific WooCommerce coupon errors
      if (error.response?.data?.code) {
        const errorCode = error.response.data.code
        const errorMessage = error.response.data.message || 'Unknown coupon error'
        
        console.error('WooCommerce coupon error:', { code: errorCode, message: errorMessage })
        
        // Create a more user-friendly error object
        const couponError = new Error(errorMessage)
        ;(couponError as any).code = errorCode
        ;(couponError as any).data = error.response.data
        throw couponError
      }
      
      throw error
    }
  }

  async removeCoupon(cartKey: string, couponCode: string) {
    try {
      if (!this.isConfigured()) {
        console.warn('WooCommerce Store API base URL is not configured. Skipping removeCoupon().')
        return null
      }

      const storeApiClient = this.createStoreApiClient()

      console.log('Removing coupon:', { code: couponCode, cartKey: cartKey ? cartKey.substring(0, 10) + '...' : 'null' })

      // First, let's get the current cart to verify the coupon is applied and get the latest cart state
      console.log('Getting current cart state before coupon removal...')
      const currentCart = await this.getCart(cartKey)
      console.log('Full current cart data:', JSON.stringify(currentCart, null, 2))
      console.log('Current cart coupons:', currentCart?.coupons)
      console.log('Looking for coupon code:', couponCode)
      
      // Check if the coupon is actually applied to the cart
      const appliedCoupon = currentCart?.coupons?.find((c: any) => {
        console.log(`Comparing "${c.code}" with "${couponCode}"`)
        return c.code === couponCode
      })
      
      if (!appliedCoupon) {
        console.warn(`Coupon ${couponCode} is not applied to the cart according to server state.`)
        console.warn('Applied coupons on server:', currentCart?.coupons?.map((c: any) => c.code))
        console.warn('Cart has coupons array:', Array.isArray(currentCart?.coupons))
        console.warn('Coupons array length:', currentCart?.coupons?.length || 0)
        
        // This is a synchronization issue - the frontend thinks the coupon is applied but the server doesn't have it
        // Instead of trying to remove a non-existent coupon, we should return the current cart state
        // This will allow the frontend to sync with the server state
        console.log('Synchronization issue detected: returning current cart state to sync frontend with server')
        
        // Return the current cart data to allow frontend synchronization
        return currentCart
      } else {
        console.log(`Confirmed coupon ${couponCode} is applied. Proceeding with removal...`)
      }

      const response = await storeApiClient.post('/wp-json/wc/store/v1/cart/remove-coupon', {
        code: couponCode,
      }, {
        headers: { 
          'Cart-Token': cartKey,
          'X-WC-Store-API-Nonce': cartKey,
          'Content-Type': 'application/json'
        }
      })

      console.log('Coupon removed successfully:', response.data)
      console.log('Response headers after coupon removal:', response.headers)
      
      // Check if we got a new cart token from the response (similar to applyCoupon)
      const newCartToken = response.headers['cart-token'] || response.headers['Cart-Token'] || 
                          response.headers['x-wc-store-api-nonce'] || response.headers['X-WC-Store-API-Nonce']
      if (newCartToken && newCartToken !== cartKey) {
        console.log('New cart token received after coupon removal:', newCartToken.substring(0, 10) + '...')
        response.data.cart_token = newCartToken
      }
      
      return response.data
    } catch (error: any) {
      console.error('Error removing coupon:', error)
      console.error('Error response data:', error.response?.data)
      console.error('Error response status:', error.response?.status)
      
      // Handle specific WooCommerce coupon errors
      if (error.response?.data?.code) {
        const errorCode = error.response.data.code
        const errorMessage = error.response.data.message || 'Unknown coupon error'
        
        console.error('WooCommerce coupon removal error:', { code: errorCode, message: errorMessage })
        
        // Create a more user-friendly error object
        const couponError = new Error(errorMessage)
        ;(couponError as any).code = errorCode
        ;(couponError as any).data = error.response.data
        throw couponError
      }
      
      throw error
    }
  }

  // Update order metadata
  async updateOrderMeta(orderId: number, metaData: Record<string, any>): Promise<Order> {
    try {
      console.log(`Updating order ${orderId} metadata:`, Object.keys(metaData))
      
      // Convert metadata object to WooCommerce meta_data array format
      const meta_data = Object.entries(metaData).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }))
      
      const response = await this.client.put(`/orders/${orderId}`, {
        meta_data
      })
      
      console.log('Order metadata updated successfully:', {
        orderId: response.data.id,
        metaDataCount: meta_data.length
      })
      
      return response.data
    } catch (error) {
      console.error('Error updating order metadata:', error)
      throw error
    }
  }
}

export const woocommerceApi = new WooCommerceAPI()
