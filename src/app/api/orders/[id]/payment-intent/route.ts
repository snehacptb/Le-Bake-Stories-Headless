import { NextRequest, NextResponse } from 'next/server'
import { woocommerceApi } from '@/lib/woocommerce-api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id)
    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      )
    }

    // Update order metadata with Stripe Payment Intent ID
    await woocommerceApi.updateOrderMeta(orderId, {
      _stripe_payment_intent_id: paymentIntentId,
      _payment_method: 'stripe',
      _payment_method_title: 'Credit Card (Stripe)',
    })

    console.log(`Order ${orderId} updated with Payment Intent: ${paymentIntentId}`)

    return NextResponse.json({
      success: true,
      orderId,
      paymentIntentId,
    })
  } catch (error: any) {
    console.error('Error updating order with payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}
