import axios from 'axios'
import https from 'https'

interface WooCommerceStatus {
  isActive: boolean
  isConfigured: boolean
  lastChecked: number
  error?: string
}

class WooCommerceStatusService {
  private status: WooCommerceStatus = {
    isActive: false,
    isConfigured: false,
    lastChecked: 0
  }
  
  private checkInterval = 5 * 60 * 1000 // Check every 5 minutes
  private listeners: Array<(status: WooCommerceStatus) => void> = []
  private isChecking = false

  constructor() {
    // Don't call async checkStatus in constructor - causes issues
    // Status will be checked on first use instead
    
    // Set up periodic checks only on client-side
    if (typeof window !== 'undefined') {
      // Initial check after a short delay
      setTimeout(() => {
        this.checkStatus()
      }, 100)
      
      setInterval(() => {
        this.checkStatus()
      }, this.checkInterval)
    }
  }

  /**
   * Check if WooCommerce plugin is active and configured
   */
  async checkStatus(): Promise<WooCommerceStatus> {
    // Prevent multiple simultaneous checks
    if (this.isChecking) {
      return this.status
    }

    this.isChecking = true

    try {
      // Try multiple environment variable names for compatibility
      // On server: prefer non-NEXT_PUBLIC_ versions
      // On client: use NEXT_PUBLIC_ versions
      const baseURL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 
                      process.env.WORDPRESS_API_URL || 
                      process.env.WORDPRESS_URL
      
      const consumerKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || 
                         process.env.WC_CONSUMER_KEY || 
                         process.env.WORDPRESS_CONSUMER_KEY
      
      const consumerSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || 
                            process.env.WC_CONSUMER_SECRET || 
                            process.env.WORDPRESS_CONSUMER_SECRET

      // Check if WooCommerce is configured
      const isConfigured = !!(baseURL && consumerKey && consumerSecret)

      if (!isConfigured) {
        this.updateStatus({
          isActive: false,
          isConfigured: false,
          lastChecked: Date.now(),
          error: 'WooCommerce credentials not configured'
        })
        return this.status
      }

      // Create a lightweight client for status checking
      // Apply same domain detection logic as other API calls
      const isLocalDomain = baseURL.includes('localhost') || 
                           baseURL.includes('127.0.0.1') || 
                           baseURL.includes('.local') ||
                           baseURL.includes('192.168.') ||
                           baseURL.includes('10.0.')
      
      let statusCheckURL
      if (isLocalDomain && process.env.NODE_ENV === 'development') {
        // For local development, preserve the original protocol
        statusCheckURL = baseURL.replace(/\/$/, '') + '/wp-json/wc/v3'
      } else {
        // For production domains, ensure HTTPS is used
        statusCheckURL = baseURL.replace(/\/$/, '').replace('http://', 'https://') + '/wp-json/wc/v3'
      }
      
      const client = axios.create({
        baseURL: statusCheckURL,
        timeout: 10000,
        auth: {
          username: consumerKey,
          password: consumerSecret,
        },
        // Handle SSL issues in development
        ...(typeof window === 'undefined' ? {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            timeout: 10000,
          })
        } : {})
      })

      // Try to fetch system status - this is a lightweight endpoint
      const response = await client.get('/system_status')
      
      // If we get here, WooCommerce is active and responding
      this.updateStatus({
        isActive: true,
        isConfigured: true,
        lastChecked: Date.now(),
        error: undefined
      })

    } catch (error: any) {
      let isActive = false
      let errorMessage = 'Unknown error'

      if (error.response?.status === 404) {
        errorMessage = 'WooCommerce plugin is not active or REST API is disabled'
      } else if (error.response?.status === 401) {
        errorMessage = 'WooCommerce API credentials are invalid'
        // API credentials are wrong, but WooCommerce might still be active
        isActive = true
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = 'Cannot connect to WordPress server'
      } else if (error.code?.includes('CERT') || error.message?.includes('certificate')) {
        errorMessage = 'SSL certificate error'
        // SSL error doesn't mean WooCommerce is inactive
        isActive = true
      } else {
        errorMessage = error.message || 'Connection error'
      }

      this.updateStatus({
        isActive,
        isConfigured: !!(process.env.NEXT_PUBLIC_WORDPRESS_URL && process.env.NEXT_PUBLIC_WC_CONSUMER_KEY),
        lastChecked: Date.now(),
        error: errorMessage
      })
    } finally {
      this.isChecking = false
    }

    return this.status
  }

  /**
   * Get current WooCommerce status
   */
  getStatus(): WooCommerceStatus {
    return { ...this.status }
  }

  /**
   * Check if WooCommerce is available (active and configured)
   */
  isAvailable(): boolean {
    return this.status.isActive && this.status.isConfigured
  }

  /**
   * Check if WooCommerce is configured (has credentials)
   */
  isConfigured(): boolean {
    return this.status.isConfigured
  }

  /**
   * Subscribe to status changes
   */
  subscribe(callback: (status: WooCommerceStatus) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Force a status check (useful for manual refresh)
   */
  async refresh(): Promise<WooCommerceStatus> {
    return await this.checkStatus()
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(newStatus: WooCommerceStatus) {
    const statusChanged = 
      this.status.isActive !== newStatus.isActive ||
      this.status.isConfigured !== newStatus.isConfigured ||
      this.status.error !== newStatus.error

    this.status = newStatus

    if (statusChanged) {
      console.log('WooCommerce status changed:', {
        isActive: newStatus.isActive,
        isConfigured: newStatus.isConfigured,
        error: newStatus.error
      })

      // Notify all listeners
      this.listeners.forEach(callback => {
        try {
          callback(newStatus)
        } catch (error) {
          console.error('Error in WooCommerce status listener:', error)
        }
      })
    }
  }

  /**
   * Get a user-friendly status message
   */
  getStatusMessage(): string {
    if (!this.status.isConfigured) {
      return 'WooCommerce is not configured. Please check your environment variables.'
    }
    
    if (!this.status.isActive) {
      return this.status.error || 'WooCommerce plugin is not active.'
    }
    
    return 'WooCommerce is active and ready.'
  }

  /**
   * Check if the status is stale and needs refresh
   */
  isStale(): boolean {
    const now = Date.now()
    const age = now - this.status.lastChecked
    return age > this.checkInterval
  }
}

// Create singleton instance
export const wooCommerceStatus = new WooCommerceStatusService()

// Export types
export type { WooCommerceStatus }
