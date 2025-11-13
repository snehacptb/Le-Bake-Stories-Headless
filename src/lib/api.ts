import axios, { AxiosInstance } from 'axios'
import https from 'https'
import { 
  WordPressPost, 
  WooCommerceProduct, 
  Customer, 
  Order, 
  ProductCategory,
  PaginatedResponse,
  ContactFormData,
  ContactFormSubmissionResponse,
  Testimonial,
  Banner
} from '@/types'
import { isApiConfigured } from './api-utils'

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

// WordPress API Client
class WordPressAPI {
  private client: AxiosInstance

  constructor() {
    // Use your actual WordPress URL
    let wordpressUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://manila.esdemo.in/wp-json/wp/v2'
    // Ensure protocol if missing
    if (wordpressUrl && !/^https?:\/\//i.test(wordpressUrl)) {
      wordpressUrl = `http://${wordpressUrl}`
    }
    
    // Force HTTP in development to avoid SSL certificate issues
    if (process.env.NODE_ENV === 'development' && wordpressUrl.startsWith('https://')) {
      console.warn('Converting HTTPS to HTTP for local development to avoid SSL certificate issues')
      wordpressUrl = wordpressUrl.replace('https://', 'http://')
    }
    
    console.log('🔗 WordPress API URL:', wordpressUrl)
    
    this.client = axios.create({
      baseURL: wordpressUrl,
      timeout: 15000, // Increased timeout for better reliability
      headers: {
        'Content-Type': 'application/json',
      },
      // Handle self-signed certificates in development
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      })
    })
  }

  // Helper method to get root URL for menu endpoints
  private getMenuRootUrl(): string {
    // Prefer the plain site URL when available to avoid duplicating /wp-json
    // Examples we want to produce:
    let siteUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL 
      || process.env.WORDPRESS_BASE_URL 
      || ''

    // Force HTTP in development to avoid SSL certificate issues
    if (process.env.NODE_ENV === 'development' && siteUrl.startsWith('https://')) {
      siteUrl = siteUrl.replace('https://', 'http://')
    }

    if (siteUrl) {
      // Ensure protocol if missing
      if (!/^https?:\/\//i.test(siteUrl)) {
        siteUrl = `http://${siteUrl}`
      }
      return siteUrl.replace(/\/$/, '').replace(/\/wp-json$/, '')
    }

    // Fallback to API URL and strip the REST path to get the site root
    let apiUrl = process.env.WORDPRESS_API_URL 
      || process.env.NEXT_PUBLIC_WORDPRESS_API_URL 
      || 'https://manila.esdemo.in/wp-json/wp/v2'

    // Remove trailing / if any, then remove the wp-json REST segment to yield the site base
    if (apiUrl && !/^https?:\/\//i.test(apiUrl)) {
      apiUrl = `http://${apiUrl}`
    }
    return apiUrl
      .replace(/\/$/, '')
      .replace('/wp-json/wp/v2', '')
      .replace('/wp/v2', '')
      .replace('/wp-json', '')
  }

  // Get site information including title, logo, and site icon
  async getSiteInfo() {
    try {
      console.log('🔍 Fetching site info from WordPress...')
      
      const rootUrl = this.getMenuRootUrl()
      
      // Use WordPress REST API to get comprehensive site settings
      const [siteSettings, rootEndpoint, customLogo] = await Promise.all([
        // Get site title and description from WordPress settings
        this.client.get('/settings').catch(async (error) => {
          console.log('⚠️ Settings endpoint failed, trying alternative methods:', error.response?.status)
          return { data: { title: '', description: '' } }
        }),
        
        // Get site info including site_icon_url from the root endpoint
        axios.get(`${rootUrl}/wp-json/`, {
          timeout: 10000,
          httpsAgent: new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          })
        }).catch(async (error) => {
          console.log('⚠️ Root endpoint failed:', error.response?.status)
          return { data: {} }
        }),
        
        // Get custom logo from media library (fallback for logo)
        this.client.get('/media', {
          params: {
            per_page: 10,
            search: 'logo'
          }
        }).catch(async (error) => {
          console.log('⚠️ Media search failed, trying custom logo meta query:', error.response?.status)
          // Alternative: try to find logo by meta key
          try {
            const response = await this.client.get('/media', {
              params: {
                per_page: 5,
                parent: 0
              }
            })
            // Look for images that might be logos
            const logoImage = response.data.find((media: any) => 
              media.alt_text?.toLowerCase().includes('logo') ||
              media.title?.rendered?.toLowerCase().includes('logo') ||
              media.slug?.toLowerCase().includes('logo')
            )
            return { data: logoImage ? [logoImage] : [] }
          } catch (fallbackError: any) {
            console.log('⚠️ Logo fallback failed:', fallbackError.response?.status)
            return { data: [] }
          }
        })
      ])

      console.log('📋 Site settings response:', siteSettings.data)
      console.log('📋 Root endpoint response:', rootEndpoint.data)
      console.log('📋 Logo search response:', customLogo.data)

      // Extract site info from multiple sources and decode HTML entities
      const rawTitle = siteSettings.data?.title || rootEndpoint.data?.name || ''
      const rawDescription = siteSettings.data?.description || rootEndpoint.data?.description || ''
      
      const title = rawTitle ? decodeHtmlEntities(rawTitle) : ''
      const description = rawDescription ? decodeHtmlEntities(rawDescription) : ''
      
      // Extract site icon from root endpoint (preferred method)
      const siteIconUrl = rootEndpoint.data?.site_icon_url || ''
      const siteIcon = siteIconUrl ? {
        url: siteIconUrl,
        width: 512, // WordPress site icons are typically 512x512
        height: 512,
        alt: `${title} Site Icon` || 'Site Icon'
      } : null
      
      // Extract logo info (fallback method)
      const logoData = Array.isArray(customLogo.data) ? customLogo.data[0] : customLogo.data
      const logo = logoData ? {
        url: logoData.source_url || logoData.guid?.rendered || '',
        width: logoData.media_details?.width || 180,
        height: logoData.media_details?.height || 155,
        alt: logoData.alt_text || (logoData.title?.rendered ? decodeHtmlEntities(logoData.title.rendered) : '') || title || ''
      } : null

      console.log('✅ Site info processed:', { 
        title, 
        description, 
        siteIcon: siteIcon?.url,
        logo: logo?.url 
      })

      return {
        title,
        description,
        logo,
        siteIcon
      }
    } catch (error) {
      console.error('❌ Error fetching site info:', error)
      // Return empty values to avoid dummy placeholders
      return {
        title: '',
        description: '',
        logo: null,
        siteIcon: null
      }
    }
  }

  // Posts
  async getPosts(params?: {
    page?: number
    per_page?: number
    categories?: string
    tags?: string
    search?: string
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<WordPressPost>> {
    const response = await this.client.get('/posts', { params })
    
    return {
      data: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
      currentPage: params?.page || 1,
      hasNextPage: (params?.page || 1) < parseInt(response.headers['x-wp-totalpages'] || '0'),
      hasPrevPage: (params?.page || 1) > 1,
    }
  }

  async getPost(slug: string): Promise<WordPressPost | null> {
    try {
      const response = await this.client.get(`/posts?slug=${slug}`)
      return response.data[0] || null
    } catch (error) {
      console.error('Error fetching post:', error)
      return null
    }
  }

  async getPostById(id: number): Promise<WordPressPost | null> {
    try {
      const response = await this.client.get(`/posts/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching post by ID:', error)
      return null
    }
  }

  // Categories
  async getCategories(): Promise<any[]> {
    try {
      const response = await this.client.get('/categories')
      return response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  // Tags
  async getTags(): Promise<any[]> {
    try {
      const response = await this.client.get('/tags')
      return response.data
    } catch (error) {
      console.error('Error fetching tags:', error)
      return []
    }
  }

  // Pages
  async getPages(params?: {
    page?: number
    per_page?: number
    search?: string
    orderby?: string
    order?: 'asc' | 'desc'
    parent?: number
    status?: string
  }): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.client.get('/pages', { params: { ...params, _embed: true } })
      
      return {
        data: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
        currentPage: params?.page || 1,
        hasNextPage: (params?.page || 1) < parseInt(response.headers['x-wp-totalpages'] || '0'),
        hasPrevPage: (params?.page || 1) > 1,
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    }
  }

  async getPage(slug: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/pages?slug=${slug}&_embed`)
      return response.data[0] || null
    } catch (error) {
      console.error('Error fetching page:', error)
      return null
    }
  }

  async getPageById(id: number): Promise<any | null> {
    try {
      const response = await this.client.get(`/pages/${id}?_embed`)
      return response.data
    } catch (error) {
      console.error('Error fetching page by ID:', error)
      return null
    }
  }

  async getPageByPath(path: string): Promise<any | null> {
    try {
      // Remove leading slash if present
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      
      // Try to find page by slug first
      let page = await this.getPage(cleanPath)
      
      // If not found by slug, try searching by path in all pages
      if (!page) {
        const allPages = await this.getPages({ per_page: 100, status: 'publish' })
        page = allPages.data.find((p: any) => {
          const pageSlug = p.slug
          const pagePath = p.link ? new URL(p.link).pathname.replace(/^\/|\/$/g, '') : pageSlug
          return pagePath === cleanPath || pageSlug === cleanPath
        })
      }
      
      return page || null
    } catch (error) {
      console.error('Error fetching page by path:', error)
      return null
    }
  }

  // Media
  async getMedia(id: number): Promise<any | null> {
    try {
      const response = await this.client.get(`/media/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching media:', error)
      return null
    }
  }

  // Menus - Using WP-REST-API V2 Menus plugin
  async getMenus(): Promise<any[]> {
    const rootUrl = this.getMenuRootUrl()
    console.log('🔍 Fetching all registered menus from WordPress at:', rootUrl)
    
    try {
      // Use the correct WP-REST-API V2 Menus plugin endpoint for all menus
      const endpoint = `${rootUrl}/wp-json/menus/v1/menus`
      
      console.log(`🔗 Trying WP-REST-API V2 Menus endpoint: ${endpoint}`)
      const response = await axios.get(endpoint, { 
        timeout: 10000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        })
      })
      console.log('✅ WP-REST-API V2 Menus endpoint successful:', endpoint)
      console.log('📋 Menu data received:', response.data)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('🎯 Processing menu list from WP-REST-API V2 Menus plugin')
        const menuList = response.data.map((menu: any) => ({
          id: menu.ID || menu.id || menu.term_id,
          name: menu.name,
          slug: menu.slug,
          term_id: menu.term_id,
          count: menu.count,
          description: menu.description || '',
          // Note: /menus endpoint returns basic menu info without items
          items: menu.items || [] // Will be empty for list endpoint
        }))
        console.log('📋 Processed menu list:', menuList.map(m => `${m.name} (${m.count} items registered)`))
        return menuList
      } else {
        console.log('⚠️ No menus found or empty response')
        return []
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch menus from WordPress:', error.message)
      console.error('❌ Error details:', error.response?.data || error.message)
      throw new Error(`WordPress menu API error: ${error.message}. Please ensure the WP-REST-API V2 Menus plugin is installed and activated.`)
    }
  }

  // Get specific menu with items by slug
  async getMenuWithItems(slug: string): Promise<any | null> {
    const rootUrl = this.getMenuRootUrl()
    console.log(`🔍 Fetching specific menu '${slug}' with items from WordPress at:`, rootUrl)
    
    try {
      // Use the specific menu endpoint to get menu with items
      const endpoint = `${rootUrl}/wp-json/menus/v1/menus/${slug}`
      
      console.log(`🔗 Trying specific menu endpoint: ${endpoint}`)
      const response = await axios.get(endpoint, { 
        timeout: 10000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        })
      })
      console.log('✅ Specific menu endpoint successful:', endpoint)
      console.log('📋 Menu with items data received:', response.data)
      
      if (response.data) {
        const menu = response.data
        const processedMenu = {
          id: menu.ID || menu.id || menu.term_id,
          name: menu.name,
          slug: menu.slug,
          term_id: menu.term_id,
          count: menu.count,
          description: menu.description || '',
          items: (menu.items || []).map((item: any) => ({
            id: item.ID || item.id,
            title: item.title || item.post_title,
            url: item.url,
            target: item.target || '',
            parent: item.menu_item_parent || 0,
            order: item.menu_order || 0,
            type: item.type,
            object: item.object,
            object_id: item.object_id,
            classes: item.classes || [],
            description: item.description || '',
            attr_title: item.attr_title || '',
            xfn: item.xfn || ''
          }))
        }
        
        console.log(`📋 Processed menu '${menu.name}' with ${processedMenu.items.length} items`)
        return processedMenu
      } else {
        console.log(`⚠️ Menu '${slug}' not found`)
        return null
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to fetch menu '${slug}' from WordPress:`, error.message)
      console.error('❌ Error details:', error.response?.data || error.message)
      
      // If 404, menu doesn't exist
      if (error.response?.status === 404) {
        console.log(`📋 Menu '${slug}' does not exist`)
        return null
      }
      
      throw new Error(`WordPress menu API error: ${error.message}. Please ensure the WP-REST-API V2 Menus plugin is installed and activated.`)
    }
  }

  async getMenuByLocation(location: string): Promise<any | null> {
    try {
      const rootUrl = this.getMenuRootUrl()
      
      // Try WP-REST-API V2 Menus plugin endpoint for location-based menu fetching
      const endpoint = `${rootUrl}/wp-json/menus/v1/locations/${location}`
      
      try {
        console.log(`🔗 Trying menu location endpoint: ${endpoint}`)
        const response = await axios.get(endpoint, { 
          timeout: 10000,
          httpsAgent: new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          })
        })
        console.log('✅ Menu location endpoint successful:', endpoint)
        console.log('📋 Menu location data received:', response.data)
        return response.data
      } catch (error: any) {
        console.log(`❌ Menu location endpoint failed: ${endpoint}`, error.response?.status || error.message)
      }
      
      // Fallback: get all menus and find by location
      console.log('🔄 Fallback: searching all menus for location:', location)
      const allMenus = await this.getMenus()
      return allMenus.find(menu => menu.location === location) || null
      
    } catch (error) {
      console.log('No custom menu found for location:', location)
      return null
    }
  }

  async getMenuItems(menuSlugOrId: string | number): Promise<any[]> {
    try {
      const menu = await this.getMenuWithItems(String(menuSlugOrId))
      return menu?.items || []
    } catch (error) {
      console.log('Error fetching menu items:', error)
      return []
    }
  }

  async getMenuBySlug(slug: string): Promise<any | null> {
    try {
      // Use the new method that fetches menu with items
      return await this.getMenuWithItems(slug)
    } catch (error) {
      console.error('Error fetching menu by slug:', error)
      return null
    }
  }

  async getMenuLocations(): Promise<any> {
    try {
      const rootUrl = this.getMenuRootUrl()
      
      // Try WP-REST-API V2 Menus plugin endpoint for menu locations
      const endpoint = `${rootUrl}/wp-json/menus/v1/locations`
      
      try {
        console.log(`🔗 Trying menu locations endpoint: ${endpoint}`)
        const response = await axios.get(endpoint, { 
          timeout: 10000,
          httpsAgent: new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          })
        })
        console.log('✅ Menu locations endpoint successful:', endpoint)
        console.log('📋 Menu locations data received:', response.data)
        return response.data
      } catch (error: any) {
        console.log(`❌ Menu locations endpoint failed: ${endpoint}`, error.response?.status || error.message)
      }
      
      console.log('Could not fetch menu locations, using default locations')
      return {
        primary: null,
        footer: null,
        social: null
      }
    } catch (error) {
      console.log('Could not fetch menu locations, using default locations')
      return {
        primary: null,
        footer: null,
        social: null
      }
    }
  }

  async hasMenuAtLocation(location: string): Promise<boolean> {
    try {
      const menu = await this.getMenuByLocation(location)
      return menu && menu.items && menu.items.length > 0
    } catch (error) {
      return false
    }
  }

  async debugMenuEndpoints(): Promise<void> {
    console.log('🔍 Debugging WordPress Menu Endpoints...')
    console.log('Base URL:', this.client.defaults.baseURL)
    
    const rootUrl = this.getMenuRootUrl()
    console.log('Root URL for menus:', rootUrl)
    
    // Test WordPress core endpoints first
    const coreEndpoints = [
      `${rootUrl}/wp-json/wp/v2/menus`,
      `${rootUrl}/wp-json/wp/v2/menu-items`,
      `${rootUrl}/wp-json/wp/v2/menu-locations`
    ]
    
    console.log('Testing WordPress core menu endpoints:')
    for (const endpoint of coreEndpoints) {
      try {
        const response = await axios.get(endpoint)
        console.log(`✅ ${endpoint}: ${response.status} - ${response.data?.length || 'N/A'} items`)
      } catch (error: any) {
        console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`)
      }
    }
    
    // Test WP-REST-API V2 Menus plugin endpoints
    const pluginEndpoints = [
      `${rootUrl}/wp-json/menus/v1/menus`,
      `${rootUrl}/wp-json/menus/v1/locations`,
      `${rootUrl}/wp-json/menus/v1/locations/primary`
    ]
    
    console.log('Testing WP-REST-API V2 Menus plugin endpoints:')
    for (const endpoint of pluginEndpoints) {
      try {
        const response = await axios.get(endpoint)
        console.log(`✅ ${endpoint}: ${response.status} - ${JSON.stringify(response.data).length} chars`)
        if (endpoint.includes('/menus') && Array.isArray(response.data)) {
          console.log(`   📋 Found ${response.data.length} menus:`, response.data.map((m: any) => `${m.name} (${m.items?.length || 0} items)`))
        }
      } catch (error: any) {
        console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`)
      }
    }
  }

  // Contact Form Submission
  async submitContactForm(formData: ContactFormData): Promise<ContactFormSubmissionResponse> {
    try {
      console.log('📧 Submitting contact form:', formData)
      
      const rootUrl = this.getMenuRootUrl()
      
      // Try to submit via custom contact form endpoint (if you have a plugin)
      // This assumes you have a contact form plugin or custom endpoint
      const contactEndpoint = `${rootUrl}/wp-json/contact-form/v1/submit`
      
      try {
        const response = await axios.post(contactEndpoint, formData, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          })
        })
        
        console.log('✅ Contact form submitted successfully via plugin endpoint')
        return {
          success: true,
          message: 'Your message has been sent successfully!',
          data: response.data
        }
      } catch (pluginError: any) {
        console.log('⚠️ Plugin endpoint failed, trying fallback method:', pluginError.response?.status)
        
        // Fallback: Submit via WordPress comments endpoint (creative workaround)
        // This creates a "comment" that can be processed as a contact form submission
        const fallbackData = {
          post: 1, // You might want to create a dedicated "Contact" page for this
          author_name: `${formData.firstName} ${formData.lastName}`,
          author_email: formData.email,
          content: `Subject: ${formData.subject}\n\nPhone: ${formData.phone || 'Not provided'}\n\nMessage:\n${formData.message}`,
          meta: {
            contact_form_submission: true,
            phone: formData.phone,
            subject: formData.subject
          }
        }
        
        try {
          const fallbackResponse = await this.client.post('/comments', fallbackData)
          console.log('✅ Contact form submitted via fallback method')
          return {
            success: true,
            message: 'Your message has been sent successfully!',
            data: fallbackResponse.data
          }
        } catch (fallbackError: any) {
          console.error('❌ Both contact form methods failed:', fallbackError.response?.data || fallbackError.message)
          throw fallbackError
        }
      }
    } catch (error: any) {
      console.error('❌ Error submitting contact form:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message. Please try again later.',
        data: error.response?.data
      }
    }
  }

  // Testimonials - Custom Post Type
  async getTestimonials(params?: {
    page?: number
    per_page?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Testimonial>> {
    try {
      console.log('🔍 Fetching testimonials from WordPress...')
      // Add _embed parameter to get featured media in the same request
      const requestParams = { ...params, _embed: true }
      const response = await this.client.get('/testimonial', { params: requestParams })
      
      // Process testimonials to extract ACF fields and featured media
      const processedTestimonials = await Promise.all(
        response.data.map(async (testimonial: any) => {
          console.log(`🔍 Processing testimonial: ${testimonial.title?.rendered}`)
          console.log(`📷 Featured media ID: ${testimonial.featured_media}`)
          
          const processed: Testimonial = {
            ...testimonial,
            name: testimonial.title?.rendered ? decodeHtmlEntities(testimonial.title.rendered) : '',
            role: testimonial.acf?.role || '',
            comment: testimonial.content?.rendered?.replace(/<[^>]*>/g, '') || testimonial.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
            avatar: ''
          }

          // Try to get featured media from embedded data first
          let avatarUrl = ''

          // 1) Prefer common ACF image fields if present
          const acfImageCandidate = testimonial.acf?.avatar || testimonial.acf?.photo || testimonial.acf?.image
          if (acfImageCandidate) {
            // ACF image can be either a string URL or an object with url/src
            if (typeof acfImageCandidate === 'string') {
              avatarUrl = acfImageCandidate
            } else if (typeof acfImageCandidate === 'object') {
              avatarUrl = acfImageCandidate.url || acfImageCandidate.src || ''
            }
          }
          
          // 2) If no ACF image resolved yet, use featured media (embedded or fetched)
          if (!avatarUrl && testimonial.featured_media && testimonial.featured_media > 0) {
            console.log(`🔍 Processing media for testimonial: ${testimonial.title?.rendered} (ID: ${testimonial.featured_media})`)
            
            // First try embedded data (more efficient)
            if (testimonial._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
              avatarUrl = testimonial._embedded['wp:featuredmedia'][0].source_url
              console.log(`✅ Avatar from embedded data for ${testimonial.title?.rendered}: ${avatarUrl}`)
            } else {
              // Fallback to separate API call
              try {
                console.log(`🔍 Fetching media separately for testimonial: ${testimonial.title?.rendered} (ID: ${testimonial.featured_media})`)
                const media = await this.getMedia(testimonial.featured_media)
                console.log(`📷 Media response:`, media)
                
                if (media?.source_url) {
                  avatarUrl = media.source_url
                  console.log(`✅ Avatar from API call for ${testimonial.title?.rendered}: ${avatarUrl}`)
                } else {
                  console.log(`⚠️ No source_url found in media response for ${testimonial.title?.rendered}`)
                }
              } catch (error) {
                console.log(`❌ Could not fetch testimonial avatar for ${testimonial.title?.rendered}:`, error)
              }
            }
          } else {
            console.log(`⚠️ No featured media ID for testimonial: ${testimonial.title?.rendered}`)
          }
          
          // Use the avatar URL as provided by WordPress (do not rewrite to frontend domain)
          if (avatarUrl) {
            processed.avatar = avatarUrl
          } else {
            processed.avatar = ''
          }

          return processed
        })
      )
      
      console.log(`✅ Fetched ${processedTestimonials.length} testimonials`)
      
      return {
        data: processedTestimonials,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
        currentPage: params?.page || 1,
        hasNextPage: (params?.page || 1) < parseInt(response.headers['x-wp-totalpages'] || '0'),
        hasPrevPage: (params?.page || 1) > 1,
      }
    } catch (error) {
      console.error('❌ Error fetching testimonials:', error)
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    }
  }

  async getTestimonial(slug: string): Promise<Testimonial | null> {
    try {
      const response = await this.client.get(`/testimonial?slug=${slug}`)
      const testimonial = response.data[0]
      
      if (!testimonial) return null

      const processed: Testimonial = {
        ...testimonial,
        name: testimonial.title?.rendered || '',
        role: testimonial.acf?.role || '',
        comment: testimonial.content?.rendered?.replace(/<[^>]*>/g, '') || testimonial.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
        avatar: ''
      }

      // Fetch featured media if available
      if (testimonial.featured_media && testimonial.featured_media > 0) {
        try {
          const media = await this.getMedia(testimonial.featured_media)
          if (media?.source_url) {
            processed.avatar = media.source_url
          }
        } catch (error) {
          console.log('Could not fetch testimonial avatar:', error)
        }
      }

      return processed
    } catch (error) {
      console.error('Error fetching testimonial:', error)
      return null
    }
  }

  async getTestimonialById(id: number): Promise<Testimonial | null> {
    try {
      const response = await this.client.get(`/testimonial/${id}`)
      const testimonial = response.data
      
      if (!testimonial) return null

      const processed: Testimonial = {
        ...testimonial,
        name: testimonial.title?.rendered || '',
        role: testimonial.acf?.role || '',
        comment: testimonial.content?.rendered?.replace(/<[^>]*>/g, '') || testimonial.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
        avatar: ''
      }

      // Fetch featured media if available
      if (testimonial.featured_media && testimonial.featured_media > 0) {
        try {
          const media = await this.getMedia(testimonial.featured_media)
          if (media?.source_url) {
            processed.avatar = media.source_url
          }
        } catch (error) {
          console.log('Could not fetch testimonial avatar:', error)
        }
      }

      return processed
    } catch (error) {
      console.error('Error fetching testimonial by ID:', error)
      return null
    }
  }

  // Banners - Hero Banners Plugin
  async getBanners(activeOnly: boolean = true): Promise<Banner[]> {
    try {
      console.log('🔍 Fetching banners from WordPress...')
      
      const rootUrl = this.getMenuRootUrl()
      const endpoint = activeOnly 
        ? `${rootUrl}/wp-json/hero-banners/v1/active`
        : `${rootUrl}/wp-json/hero-banners/v1/all`
      
      console.log(`🔗 Fetching banners from: ${endpoint}`)
      
      const response = await axios.get(endpoint, {
        timeout: 10000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        })
      })
      
      console.log('✅ Banners fetched successfully:', response.data)
      
      // The response should already be in the correct format based on the plugin
      return response.data || []
    } catch (error: any) {
      console.error('❌ Error fetching banners:', error.response?.data || error.message)
      return []
    }
  }

  async getActiveBanners(): Promise<Banner[]> {
    return this.getBanners(true)
  }

  async getAllBanners(): Promise<Banner[]> {
    return this.getBanners(false)
  }
}

// WooCommerce API Client
class WooCommerceAPI {
  private client: AxiosInstance

  constructor() {
    const consumerKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY
    const consumerSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET
    
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      },
      // Handle self-signed certificates in development
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      })
    })
  }

  // Products
  async getProducts(params?: {
    page?: number
    per_page?: number
    category?: string
    tag?: string
    search?: string
    min_price?: number
    max_price?: number
    on_sale?: boolean
    featured?: boolean
    orderby?: string
    order?: 'asc' | 'desc'
    status?: string
  }): Promise<PaginatedResponse<WooCommerceProduct>> {
    try {
      const response = await this.client.get('/wc/v3/products', { params })
      
      return {
        data: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
        currentPage: params?.page || 1,
        hasNextPage: (params?.page || 1) < parseInt(response.headers['x-wp-totalpages'] || '0'),
        hasPrevPage: (params?.page || 1) > 1,
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    }
  }

  async getProduct(slug: string): Promise<WooCommerceProduct | null> {
    try {
      const response = await this.client.get(`/wc/v3/products?slug=${slug}`)
      return response.data[0] || null
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  async getProductById(id: number): Promise<WooCommerceProduct | null> {
    try {
      const response = await this.client.get(`/wc/v3/products/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching product by ID:', error)
      return null
    }
  }

  async getFeaturedProducts(limit: number = 8): Promise<WooCommerceProduct[]> {
    const response = await this.client.get('/wc/v3/products', {
      params: {
        featured: true,
        per_page: limit,
        status: 'publish'
      }
    })
    return response.data
  }

  async getOnSaleProducts(limit: number = 8): Promise<WooCommerceProduct[]> {
    try {
      const response = await this.client.get('/wc/v3/products', {
        params: {
          on_sale: true,
          per_page: limit,
          status: 'publish'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching sale products:', error)
      return []
    }
  }

  async getRelatedProducts(productId: number, limit: number = 4): Promise<WooCommerceProduct[]> {
    try {
      const product = await this.getProductById(productId)
      if (!product || !product.related_ids.length) return []

      const relatedIds = product.related_ids.slice(0, limit)
      const products = await Promise.all(
        relatedIds.map(id => this.getProductById(id))
      )
      
      return products.filter(Boolean) as WooCommerceProduct[]
    } catch (error) {
      console.error('Error fetching related products:', error)
      return []
    }
  }

  // Product Categories
  async getProductCategories(): Promise<ProductCategory[]> {
    const response = await this.client.get('/wc/v3/products/categories')
    return response.data
  }

  async getProductCategory(id: number): Promise<ProductCategory | null> {
    try {
      const response = await this.client.get(`/wc/v3/products/categories/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching product category:', error)
      return null
    }
  }

  // Orders
  async createOrder(orderData: any): Promise<Order | null> {
    try {
      const response = await this.client.post('/wc/v3/orders', orderData)
      return response.data
    } catch (error) {
      console.error('Error creating order:', error)
      return null
    }
  }

  async getOrder(id: number): Promise<Order | null> {
    try {
      const response = await this.client.get(`/wc/v3/orders/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching order:', error)
      return null
    }
  }

  async getOrders(customerId?: number): Promise<Order[]> {
    try {
      const params = customerId ? { customer: customerId } : {}
      const response = await this.client.get('/wc/v3/orders', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  }

  // Customers
  async createCustomer(customerData: any): Promise<Customer | null> {
    try {
      const response = await this.client.post('/wc/v3/customers', customerData)
      return response.data
    } catch (error) {
      console.error('Error creating customer:', error)
      return null
    }
  }

  async getCustomer(id: number): Promise<Customer | null> {
    try {
      const response = await this.client.get(`/wc/v3/customers/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching customer:', error)
      return null
    }
  }

  async updateCustomer(id: number, customerData: any): Promise<Customer | null> {
    try {
      const response = await this.client.put(`/wc/v3/customers/${id}`, customerData)
      return response.data
    } catch (error) {
      console.error('Error updating customer:', error)
      return null
    }
  }

  // Cart (using WooCommerce Store API if available)
  async getCart(): Promise<any> {
    try {
      const response = await this.client.get('/wc/store/cart')
      return response.data
    } catch (error) {
      console.error('Error fetching cart:', error)
      return null
    }
  }

  async addToCart(productId: number, quantity: number = 1): Promise<any> {
    try {
      const response = await this.client.post('/wc/store/cart/add-item', {
        id: productId,
        quantity
      })
      return response.data
    } catch (error) {
      console.error('Error adding to cart:', error)
      return null
    }
  }

  async updateCartItem(key: string, quantity: number): Promise<any> {
    try {
      const response = await this.client.post('/wc/store/cart/update-item', {
        key,
        quantity
      })
      return response.data
    } catch (error) {
      console.error('Error updating cart item:', error)
      return null
    }
  }

  async removeFromCart(key: string): Promise<any> {
    try {
      const response = await this.client.post('/wc/store/cart/remove-item', { key })
      return response.data
    } catch (error) {
      console.error('Error removing from cart:', error)
      return null
    }
  }
}

// Export API instances
export const wordpressAPI = new WordPressAPI()
export const woocommerceAPI = new WooCommerceAPI()

// Utility functions for data fetching
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 60, // Revalidate every minute
  }
}

export async function getServerSideProps() {
  return {
    props: {},
  }
}
