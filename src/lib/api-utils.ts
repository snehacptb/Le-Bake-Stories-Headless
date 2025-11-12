/**
 * API Utilities for WordPress and WooCommerce
 * Provides error handling utilities
 */

import { WordPressPost, WooCommerceProduct, ProductCategory } from '@/types'

/**
 * Check if API is properly configured
 */
export function isApiConfigured(): boolean {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_API_URL
  const consumerKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY
  const consumerSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET
  
  return !!(wordpressUrl && consumerKey && consumerSecret)
}


/**
 * Retry function for API calls with exponential backoff
 */
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error: any) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Don't retry on client errors (4xx), only on server errors (5xx) and network errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Check if the current environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Log API errors in development mode
 */
export function logApiError(error: any, context: string): void {
  if (isDevelopment()) {
    console.group(`🚨 API Error in ${context}`)
    console.error('Error:', error.message)
    console.error('Status:', error.response?.status)
    console.error('Data:', error.response?.data)
    console.error('Config:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    console.groupEnd()
  }
}
