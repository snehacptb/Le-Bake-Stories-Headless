import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { woocommerceApi } from '@/lib/woocommerce-api'

// Initialize Stripe with proper error handling for build process
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
}) : null

// Webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe is not configured')
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      )
    }

    console.log('Webhook event received:', {
      type: event.type,
      id: event.id,
    })

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  const orderId = paymentIntent.metadata.orderId

  if (!orderId || orderId === 'pending') {
    console.warn('No order ID found in payment intent metadata')
    return
  }

  try {
    // Update WooCommerce order status to processing/completed
    await woocommerceApi.updateOrderStatus(
      parseInt(orderId),
      'processing',
      `Payment completed via Stripe. Transaction ID: ${paymentIntent.id}`
    )

    // Store payment intent ID in order meta
    await woocommerceApi.updateOrderMeta(parseInt(orderId), {
      _stripe_payment_intent_id: paymentIntent.id,
      _stripe_charge_id: paymentIntent.latest_charge,
      _stripe_payment_method: paymentIntent.payment_method,
      _paid_date: new Date().toISOString(),
    })

    console.log(`Order ${orderId} marked as processing with Stripe payment`)
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error)
    // Don't throw - we still want to acknowledge the webhook
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)

  const orderId = paymentIntent.metadata.orderId

  if (!orderId || orderId === 'pending') {
    console.warn('No order ID found in payment intent metadata')
    return
  }

  try {
    const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed'

    // Update order status to failed
    await woocommerceApi.updateOrderStatus(
      parseInt(orderId),
      'failed',
      `Payment failed: ${failureMessage}. Payment Intent: ${paymentIntent.id}`
    )

    // Store failure information
    await woocommerceApi.updateOrderMeta(parseInt(orderId), {
      _stripe_payment_intent_id: paymentIntent.id,
      _stripe_payment_error: failureMessage,
      _payment_failed_date: new Date().toISOString(),
    })

    console.log(`Order ${orderId} marked as failed`)
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error)
  }
}

// Handle canceled payment
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id)

  const orderId = paymentIntent.metadata.orderId

  if (!orderId || orderId === 'pending') {
    return
  }

  try {
    await woocommerceApi.updateOrderStatus(
      parseInt(orderId),
      'cancelled',
      `Payment canceled. Payment Intent: ${paymentIntent.id}`
    )

    console.log(`Order ${orderId} marked as cancelled`)
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error)
  }
}

// Handle payment processing
async function handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment processing:', paymentIntent.id)

  const orderId = paymentIntent.metadata.orderId

  if (!orderId || orderId === 'pending') {
    return
  }

  try {
    await woocommerceApi.updateOrderStatus(
      parseInt(orderId),
      'on-hold',
      `Payment is being processed. Payment Intent: ${paymentIntent.id}`
    )

    console.log(`Order ${orderId} marked as on-hold (processing payment)`)
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error)
  }
}

// Handle refund
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id)

  // Find order by charge ID
  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) {
    console.warn('No payment intent ID found in charge')
    return
  }

  try {
    // You would need to implement a method to find order by payment intent ID
    // For now, we'll log it
    console.log(`Refund processed for payment intent: ${paymentIntentId}`)
    console.log(`Refund amount: ${charge.amount_refunded / 100}`)
  } catch (error) {
    console.error('Failed to process refund:', error)
  }
}

// Handle dispute
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log('Dispute created:', dispute.id)

  const chargeId = dispute.charge as string

  try {
    console.log(`Dispute created for charge: ${chargeId}`)
    console.log(`Dispute reason: ${dispute.reason}`)
    console.log(`Dispute amount: ${dispute.amount / 100}`)
    
    // You could send an email notification to admin here
  } catch (error) {
    console.error('Failed to process dispute:', error)
  }
}
