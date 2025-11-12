'use client'

import React, { useEffect, useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { paypalService } from '@/lib/paypal-service'
import { Loader2 } from 'lucide-react'

interface PayPalPaymentFormProps {
  orderId: number
  orderTotal: number
  currency?: string
  onSuccess: (paypalOrderId: string) => void
  onError: (error: string) => void
  onCancel?: () => void
}

export function PayPalPaymentForm({
  orderId,
  orderTotal,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
}: PayPalPaymentFormProps) {
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sandboxMode, setSandboxMode] = useState(false)

  useEffect(() => {
    loadPayPalConfig()
  }, [])

  const loadPayPalConfig = async () => {
    try {
      console.log('Loading PayPal configuration...')
      const config = await paypalService.getConfig()
      
      if (!config.client_id) {
        throw new Error('PayPal client ID not configured')
      }

      console.log('PayPal config loaded:', {
        sandbox_mode: config.sandbox_mode,
        client_id_present: !!config.client_id
      })

      setClientId(config.client_id)
      setSandboxMode(config.sandbox_mode)
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load PayPal config:', err)
      setError(err.message || 'Failed to load PayPal configuration')
      setLoading(false)
      onError(err.message || 'Failed to load PayPal configuration')
    }
  }

  const createOrder = async () => {
    try {
      console.log('Creating PayPal order for WooCommerce order:', orderId)
      const paypalOrder = await paypalService.createOrder(orderId)
      
      if (!paypalOrder.id) {
        throw new Error('Failed to create PayPal order')
      }

      console.log('PayPal order created successfully:', paypalOrder.id)
      return paypalOrder.id
    } catch (err: any) {
      console.error('Error creating PayPal order:', err)
      onError(err.message || 'Failed to create PayPal order')
      throw err
    }
  }

  const onApprove = async (data: any) => {
    try {
      console.log('PayPal payment approved:', data.orderID)
      
      // Capture the payment
      const captureResult = await paypalService.captureOrder(data.orderID, orderId)
      
      if (captureResult.status === 'COMPLETED') {
        console.log('PayPal payment captured successfully')
        onSuccess(data.orderID)
      } else {
        throw new Error(`Payment capture failed with status: ${captureResult.status}`)
      }
    } catch (err: any) {
      console.error('Error capturing PayPal payment:', err)
      onError(err.message || 'Failed to capture PayPal payment')
    }
  }

  const onCancelHandler = () => {
    console.log('PayPal payment cancelled by user')
    if (onCancel) {
      onCancel()
    }
  }

  const onErrorHandler = (err: any) => {
    console.error('PayPal button error:', err)
    onError(err.message || 'PayPal payment error')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading PayPal...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    )
  }

  if (!clientId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">PayPal is not configured. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="paypal-payment-form">
      <PayPalScriptProvider
        options={{
          clientId: clientId,
          currency: currency,
          intent: 'capture',
          ...(sandboxMode && { 'data-sdk-integration-source': 'integrationbuilder_sc' }),
        }}
      >
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Complete Payment with PayPal</h3>
            <p className="text-sm text-gray-600 mt-1">
              Click the PayPal button below to complete your payment securely.
            </p>
          </div>

          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onCancel={onCancelHandler}
            onError={onErrorHandler}
            forceReRender={[orderTotal, currency, orderId]}
          />

          {sandboxMode && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                <strong>Sandbox Mode:</strong> This is a test environment. Use PayPal sandbox credentials.
              </p>
            </div>
          )}
        </div>
      </PayPalScriptProvider>
    </div>
  )
}
