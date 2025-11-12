/**
 * PayPal Service
 * Handles PayPal payment integration with WordPress backend
 */

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WP_URL

export interface PayPalConfig {
  client_id: string
  sandbox_mode: boolean
}

export interface PayPalOrderResponse {
  id: string
  status: string
  links?: Array<{
    href: string
    rel: string
    method: string
  }>
}

export interface PayPalCaptureResponse {
  id: string
  status: string
  purchase_units?: any[]
}

class PayPalService {
  private baseUrl: string

  constructor() {
    if (!WORDPRESS_URL) {
      throw new Error('WordPress URL is not configured')
    }
    this.baseUrl = `${WORDPRESS_URL}/wp-json/paypal/v1`
  }

  /**
   * Check if PayPal is available and configured
   */
  async checkStatus(): Promise<{ active: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/status`)
      
      if (!response.ok) {
        throw new Error('Failed to check PayPal status')
      }

      return await response.json()
    } catch (error) {
      console.error('PayPal status check failed:', error)
      throw error
    }
  }

  /**
   * Get PayPal configuration (client ID for SDK)
   */
  async getConfig(): Promise<PayPalConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/config`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || 'Failed to get PayPal configuration')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get PayPal config:', error)
      throw error
    }
  }

  /**
   * Create PayPal order from WooCommerce order
   */
  async createOrder(wooOrderId: number): Promise<PayPalOrderResponse> {
    try {
      console.log('Creating PayPal order for WooCommerce order:', wooOrderId)
      
      const response = await fetch(`${this.baseUrl}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: wooOrderId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || 'Failed to create PayPal order')
      }

      const data = await response.json()
      console.log('PayPal order created:', data.id)
      return data
    } catch (error) {
      console.error('Failed to create PayPal order:', error)
      throw error
    }
  }

  /**
   * Capture PayPal payment
   */
  async captureOrder(paypalOrderId: string, wooOrderId: number): Promise<PayPalCaptureResponse> {
    try {
      console.log('Capturing PayPal order:', paypalOrderId)
      
      const response = await fetch(`${this.baseUrl}/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paypal_order_id: paypalOrderId,
          woo_order_id: wooOrderId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || 'Failed to capture PayPal payment')
      }

      const data = await response.json()
      console.log('PayPal payment captured:', data.status)
      return data
    } catch (error) {
      console.error('Failed to capture PayPal payment:', error)
      throw error
    }
  }

  /**
   * Get PayPal order details
   */
  async getOrderDetails(paypalOrderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/order/${paypalOrderId}`)
      
      if (!response.ok) {
        throw new Error('Failed to get PayPal order details')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get PayPal order details:', error)
      throw error
    }
  }

  /**
   * Cancel PayPal order
   */
  async cancelOrder(paypalOrderId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/cancel-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paypal_order_id: paypalOrderId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel PayPal order')
      }
    } catch (error) {
      console.error('Failed to cancel PayPal order:', error)
      throw error
    }
  }
}

export const paypalService = new PayPalService()
