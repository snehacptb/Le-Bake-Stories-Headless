import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js'

// Initialize Stripe with publishable key from backend
let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = async () => {
  if (!stripePromise) {
    try {
      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL
      const response = await fetch(`${wpUrl}/wp-json/stripe/v1/config`)
      const data = await response.json()
      
      if (data.success && data.publishable_key) {
        stripePromise = loadStripe(data.publishable_key)
      } else {
        console.error('Failed to get Stripe config from backend')
        stripePromise = Promise.resolve(null)
      }
    } catch (error) {
      console.error('Error fetching Stripe config:', error)
      stripePromise = Promise.resolve(null)
    }
  }
  return stripePromise
}

// Create Payment Intent
export interface CreatePaymentIntentParams {
  amount: number
  currency?: string
  orderId?: number
  customerEmail?: string
  metadata?: Record<string, string>
}

export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> {
  try {
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create payment intent')
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

// Confirm Payment
export interface ConfirmPaymentParams {
  stripe: Stripe
  elements: StripeElements
  clientSecret: string
  returnUrl: string
  billingDetails?: {
    name?: string
    email?: string
    phone?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
}

export async function confirmPayment(params: ConfirmPaymentParams) {
  const { stripe, elements, clientSecret, returnUrl, billingDetails } = params

  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: billingDetails,
        },
      },
      redirect: 'if_required', // Only redirect if 3D Secure is required
    })

    if (error) {
      throw error
    }

    return { paymentIntent, error: null }
  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    return { paymentIntent: null, error }
  }
}

// Update order with Payment Intent ID
export async function updateOrderWithPaymentIntent(
  orderId: number,
  paymentIntentId: string
): Promise<void> {
  try {
    // This would call your WooCommerce API to update order metadata
    const response = await fetch(`/api/orders/${orderId}/payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    })

    if (!response.ok) {
      throw new Error('Failed to update order with payment intent')
    }
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

// Format amount for display
export function formatAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

// Get payment status message
export function getPaymentStatusMessage(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'Payment successful! Your order is being processed.'
    case 'processing':
      return 'Payment is being processed. This may take a few moments.'
    case 'requires_payment_method':
      return 'Payment failed. Please try a different payment method.'
    case 'requires_action':
      return 'Additional authentication required. Please complete the verification.'
    case 'requires_confirmation':
      return 'Payment requires confirmation.'
    case 'canceled':
      return 'Payment was canceled.'
    default:
      return 'Payment status unknown.'
  }
}

// Handle Stripe errors
export function getStripeErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred'

  switch (error.type) {
    case 'card_error':
      return error.message || 'Your card was declined. Please try a different payment method.'
    case 'validation_error':
      return error.message || 'Invalid payment information. Please check your details.'
    case 'invalid_request_error':
      return 'Invalid payment request. Please try again.'
    case 'api_error':
      return 'Payment service temporarily unavailable. Please try again later.'
    case 'rate_limit_error':
      return 'Too many requests. Please wait a moment and try again.'
    case 'authentication_error':
      return 'Payment authentication failed. Please try again.'
    default:
      return error.message || 'Payment failed. Please try again.'
  }
}
