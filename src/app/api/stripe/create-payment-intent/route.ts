import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with proper error handling for build process
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Use a valid, stable Stripe API version
  apiVersion: '2025-10-29.clover',
}) : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe is not configured')
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { amount, currency = 'usd', orderId, customerEmail, metadata = {} } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      )
    }

    // Calculate amount in cents (Stripe expects smallest currency unit)
    const amountInCents = Math.round(amount * 100)

    console.log('Creating Payment Intent:', {
      amount: amountInCents,
      currency,
      orderId,
      customerEmail,
    })

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        // Use order_id (underscore) for WooCommerce Stripe Gateway plugin compatibility
        order_id: orderId?.toString() || 'pending',
        orderId: orderId?.toString() || 'pending', // Keep camelCase for backward compatibility
        integration: 'headless-woocommerce',
        customer_email: customerEmail || '',
        ...metadata,
      },
      receipt_email: customerEmail || undefined,
      description: orderId 
        ? `Order #${orderId} - WooCommerce Headless Store`
        : 'WooCommerce Headless Store Purchase',
    })

    console.log('Payment Intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error: any) {
    console.error('Error creating Payment Intent:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment request. Please check your information.' },
        { status: 400 }
      )
    }

    if (error.type === 'StripeAPIError') {
      return NextResponse.json(
        { error: 'Payment service temporarily unavailable. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
