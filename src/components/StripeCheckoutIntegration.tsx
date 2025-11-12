'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StripePaymentForm } from './StripePaymentForm'
import { createPaymentIntent } from '@/lib/stripe-service'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { CustomerAddress } from '@/types'

interface StripeCheckoutIntegrationProps {
  orderData: {
    payment_method: string
    payment_method_title: string
    billing: CustomerAddress
    shipping: CustomerAddress
    line_items: Array<{
      product_id: number
      quantity: number
    }>
    coupon_lines?: Array<{
      code: string
    }>
    customer_note?: string
    customer_id?: number
  }
  amount: number
  currency?: string
  onSuccess?: (orderId: number) => void
  onError?: (error: string) => void
}

export function StripeCheckoutIntegration({
  orderData,
  amount,
  currency = 'usd',
  onSuccess,
  onError,
}: StripeCheckoutIntegrationProps) {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  // Step 1: Create WooCommerce order and Payment Intent
  const initializePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Step 1: Creating WooCommerce order...')
      
      // Create order in WooCommerce with pending payment status
      const order = await woocommerceApi.createOrder({
        ...orderData,
        payment_method: 'stripe',
        payment_method_title: 'Credit Card (Stripe)',
        set_paid: false, // Order is not paid yet
      })

      if (!order || !order.id) {
        throw new Error('Failed to create order')
      }

      console.log('Order created:', order.id)
      setOrderId(order.id)

      console.log('Step 2: Creating Stripe Payment Intent...')
      
      // Create Payment Intent with order details
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        orderId: order.id,
        customerEmail: orderData.billing.email || '',
        metadata: {
          order_id: order.id.toString(),
          customer_name: `${orderData.billing.first_name} ${orderData.billing.last_name}`,
        },
      })

      console.log('Payment Intent created:', paymentIntent.paymentIntentId)
      setClientSecret(paymentIntent.clientSecret)
      setPaymentIntentId(paymentIntent.paymentIntentId)

      // Store Payment Intent ID in order metadata
      await fetch(`/api/orders/${order.id}/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent.paymentIntentId }),
      })

      console.log('Payment Intent linked to order')
    } catch (err: any) {
      console.error('Payment initialization error:', err)
      const errorMessage = err.message || 'Failed to initialize payment'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Initialize payment on mount
  useEffect(() => {
    initializePayment()
  }, [])

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('Payment successful:', paymentIntentId)

    if (orderId) {
      try {
        // Update order status to processing
        await woocommerceApi.updateOrderStatus(
          orderId,
          'processing',
          'Payment completed via Stripe'
        )

        console.log('Order status updated to processing')
        
        // Call success callback
        onSuccess?.(orderId)

        // Redirect to order confirmation
        router.push(`/order-confirmation/${orderId}`)
      } catch (err) {
        console.error('Failed to update order status:', err)
        // Still redirect even if status update fails
        router.push(`/order-confirmation/${orderId}`)
      }
    }
  }

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    console.error('Payment error:', errorMessage)
    setError(errorMessage)
    onError?.(errorMessage)

    // Update order status to failed if order was created
    if (orderId) {
      woocommerceApi.updateOrderStatus(
        orderId,
        'failed',
        `Payment failed: ${errorMessage}`
      ).catch(err => console.error('Failed to update order status:', err))
    }
  }

  // Loading state
  if (loading || !clientSecret) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Preparing Payment
            </h3>
            <p className="text-sm text-gray-600">
              {!orderId ? 'Creating your order...' : 'Initializing secure payment...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !clientSecret) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            onClick={initializePayment}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Payment form
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <StripePaymentForm
        clientSecret={clientSecret}
        amount={amount}
        currency={currency}
        orderId={orderId!}
        customerEmail={orderData.billing.email || ''}
        billingDetails={{
          name: `${orderData.billing.first_name} ${orderData.billing.last_name}`,
          email: orderData.billing.email || '',
          phone: orderData.billing.phone,
          address: {
            line1: orderData.billing.address_1,
            line2: orderData.billing.address_2,
            city: orderData.billing.city,
            state: orderData.billing.state,
            postal_code: orderData.billing.postcode,
            country: orderData.billing.country,
          },
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  )
}
