'use client'

import React, { useState, useEffect } from 'react'
import { 
  CardElement,
  useStripe, 
  useElements,
  Elements 
} from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getStripeErrorMessage, getPaymentStatusMessage } from '@/lib/stripe-service'

// Stripe instance will be loaded dynamically from backend
let stripePromise: Promise<Stripe | null> | null = null

// Get Stripe publishable key from backend
const getStripePromise = async () => {
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

interface StripePaymentFormProps {
  clientSecret: string
  amount: number
  currency: string
  orderId: number
  customerEmail: string
  billingDetails: {
    name: string
    email: string
    phone?: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  onSuccess: (paymentIntentId: string, orderNumber?: string) => void
  onError: (error: string) => void
}

/**
 * WordPress API response for confirm-payment endpoint
 */
interface ConfirmPaymentResponse {
  success: boolean
  order_status: string
  order_number: string
  message?: string
}

// Payment Form Component (wrapped by Elements provider)
function PaymentForm({
  amount,
  currency,
  orderId,
  customerEmail,
  billingDetails,
  onSuccess,
  onError,
  clientSecret,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [isConfirmingWithWordPress, setIsConfirmingWithWordPress] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage('Payment system not loaded. Please refresh the page.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setPaymentStatus('processing')

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement)
      
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Build billing details only with valid, present fields (no placeholders)
      const normalizedBillingDetails: any = {}
      if (billingDetails.name) normalizedBillingDetails.name = billingDetails.name
      if (billingDetails.email) normalizedBillingDetails.email = billingDetails.email
      if (billingDetails.phone) normalizedBillingDetails.phone = billingDetails.phone

      const addr: any = {}
      if (billingDetails.address?.line1) addr.line1 = billingDetails.address.line1
      if (billingDetails.address?.line2) addr.line2 = billingDetails.address.line2
      if (billingDetails.address?.city) addr.city = billingDetails.address.city
      if (billingDetails.address?.state) addr.state = billingDetails.address.state
      if (billingDetails.address?.postal_code) addr.postal_code = billingDetails.address.postal_code
      if (billingDetails.address?.country) addr.country = billingDetails.address.country.toUpperCase().substring(0, 2)
      if (addr.line1 || addr.city || addr.state || addr.postal_code || addr.country) {
        normalizedBillingDetails.address = addr
      }

      console.log('Confirming payment with Stripe...', {
        clientSecret: clientSecret.substring(0, 20) + '...',
        billingDetails: normalizedBillingDetails
      })

      // Confirm payment with Stripe using CardElement
      // For Indian regulations on export, include name and address when available
      const shouldIncludeBilling = !!(
        normalizedBillingDetails.name &&
        normalizedBillingDetails.address &&
        normalizedBillingDetails.address.line1 &&
        normalizedBillingDetails.address.country &&
        normalizedBillingDetails.address.city &&
        normalizedBillingDetails.address.postal_code
      )

      const confirmParams: any = {
        payment_method: {
          card: cardElement,
        },
      }
      if (shouldIncludeBilling) {
        confirmParams.payment_method.billing_details = normalizedBillingDetails
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        confirmParams
      )

      if (error) {
        console.error('Stripe confirm error (raw):', error)
        // Payment failed
        const errorMsg = getStripeErrorMessage(error)
        setErrorMessage(errorMsg)
        setPaymentStatus('failed')
        onError(errorMsg)
      } else if (paymentIntent) {
        // Payment succeeded
        setPaymentStatus(paymentIntent.status)
        
        if (paymentIntent.status === 'succeeded') {
          console.log('✅ Stripe payment succeeded:', paymentIntent.id)
          
          // Call WordPress API to confirm payment and update order status
          try {
            setIsConfirmingWithWordPress(true)
            console.log('📡 Calling WordPress API to confirm payment...')
            
            const wpApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WP_URL
            if (!wpApiUrl) {
              throw new Error('WordPress URL not configured')
            }
            
            const response = await fetch(`${wpApiUrl}/wp-json/stripe/v1/confirm-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order_id: orderId,
                payment_intent_id: paymentIntent.id,
              }),
            })
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
              throw new Error(errorData.message || `API request failed with status ${response.status}`)
            }
            
            const data: ConfirmPaymentResponse = await response.json()
            console.log('✅ WordPress API response:', data)
            
            if (data.success) {
              console.log(`✅ Order status updated to: ${data.order_status}`)
              console.log(`📦 Order number: ${data.order_number}`)
              onSuccess(paymentIntent.id, data.order_number)
            } else {
              throw new Error(data.message || 'Failed to confirm payment with WordPress')
            }
          } catch (apiError: any) {
            console.error('❌ WordPress API error:', apiError)
            setErrorMessage(`Payment succeeded but order confirmation failed: ${apiError.message}`)
            setIsConfirmingWithWordPress(false)
            // Still call onSuccess with payment intent ID so user can contact support
            onError(`Payment succeeded (${paymentIntent.id}) but order confirmation failed. Please contact support.`)
          }
        } else if (paymentIntent.status === 'processing') {
          // Payment is processing (e.g., bank transfers)
          console.log('Payment processing:', paymentIntent.id)
          setErrorMessage('Payment is being processed. You will receive a confirmation email shortly.')
          onSuccess(paymentIntent.id)
        } else if (paymentIntent.status === 'requires_action') {
          // 3D Secure authentication required
          setErrorMessage('Additional authentication required. Please complete the verification.')
        } else {
          setErrorMessage(getPaymentStatusMessage(paymentIntent.status))
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      const errorMsg = err.message || 'An unexpected error occurred during payment'
      setErrorMessage(errorMsg)
      setPaymentStatus('failed')
      onError(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Card Element */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 mr-2 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
        </div>
        
        <CardElement 
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
              invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
              },
            },
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {paymentStatus === 'succeeded' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Redirecting to order confirmation...
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || isProcessing || isConfirmingWithWordPress}
        className="w-full"
        size="lg"
      >
        {isConfirmingWithWordPress ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Confirming order...
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            Pay {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(amount)}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-center text-sm text-gray-500">
        <Lock className="inline h-4 w-4 mr-1" />
        Your payment is secured by Stripe with 256-bit SSL encryption
      </div>
    </div>
  )
}

// Main wrapper component
export function StripePaymentForm(props: StripePaymentFormProps) {
  const { clientSecret } = props
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getStripePromise().then(async (promise) => {
      const stripe = await promise
      setStripeInstance(stripe)
      setIsLoading(false)
    })
  }, [])

  if (!clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payment initialization failed. Please try again or contact support.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading || !stripeInstance) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-600">Loading payment form...</span>
      </div>
    )
  }

  return (
    <Elements stripe={stripeInstance}>
      <PaymentForm {...props} />
    </Elements>
  )
}
