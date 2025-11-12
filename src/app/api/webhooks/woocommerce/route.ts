/**
 * WooCommerce Webhook Endpoint
 * POST /api/webhooks/woocommerce
 * 
 * Verifies X-WC-Webhook-Signature using HMAC-SHA256 over the raw body with the
 * configured webhook secret, matching WooCommerce's signing method.
 * Handles real-time cache updates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Read raw body (still read in case downstream needs it)
    const rawBody = await request.text()
    const signature = request.headers.get('x-wc-webhook-signature') || ''
    const secret = process.env.WC_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || ''

    if (!secret) {
      console.warn('WooCommerce webhook secret is not configured')
    } else {
      // Compute expected HMAC-SHA256 signature (base64) over the raw body
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64')

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Safely parse payload; WooCommerce may send test pings or empty bodies
    let payload: any = {}
    if (rawBody && rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody)
      } catch (e) {
        console.warn('WooCommerce webhook: invalid JSON body, falling back to headers-only parsing')
      }
    }

    // Derive action/type/id from either payload or WooCommerce headers
    // Example header: x-wc-webhook-topic: product.updated
    const topic = request.headers.get('x-wc-webhook-topic') || ''
    const [headerType, headerAction] = topic.split('.')
    const resourceIdHeader = request.headers.get('x-wc-webhook-resource-id')

    const action = (payload.action || headerAction || 'updated') as string
    const type = (payload.type || headerType || 'product') as string
    const id = (payload.id || (resourceIdHeader ? Number(resourceIdHeader) : undefined) || 0) as number
    // For WooCommerce product webhooks, the payload is the resource itself
    const data = payload

    console.log(`WooCommerce webhook received: ${action} ${type} ${id}`)

    // Handle different WooCommerce webhook types
    switch (type) {
      case 'product':
        await handleProductWebhook(action, id, data)
        break
      case 'product_category':
        await handleCategoryWebhook(action, id, data)
        break
      case 'order':
        await handleOrderWebhook(action, id, data)
        break
      case 'customer':
        await handleCustomerWebhook(action, id, data)
        break
      default:
        console.warn(`Unknown WooCommerce webhook type: ${type}`)
    }

    return NextResponse.json({
      success: true,
      message: `WooCommerce webhook processed: ${action} ${type} ${id}`
    })
  } catch (error: any) {
    console.error('WooCommerce webhook processing error:', error)
    return NextResponse.json(
      { 
        error: 'WooCommerce webhook processing failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// Simple GET health check to aid configuration/testing
export async function GET() {
  return NextResponse.json({ ok: true })
}

async function handleProductWebhook(action: string, id: number, data: any) {
  switch (action) {
    case 'created':
    case 'updated':
      // If data contains full product, upsert locally for real-time list
      if (data && data.id) {
        await cacheService.upsertProductFromWebhook(data)
      } else {
        await cacheService.refreshPartial('products')
      }
      break
    case 'deleted':
      // Invalidate specific product cache
      await cacheService.invalidate(`product-${id}`)
      // Remove from local products list and refresh list
      if (id) {
        await cacheService.removeProductFromCache(id)
      } else {
        await cacheService.refreshPartial('products')
      }
      break
  }
}

async function handleCategoryWebhook(action: string, id: number, data: any) {
  switch (action) {
    case 'created':
    case 'updated':
      await cacheService.refreshPartial('categories')
      break
    case 'deleted':
      await cacheService.invalidate(`category-${id}`)
      await cacheService.refreshPartial('categories')
      break
  }
}

async function handleOrderWebhook(action: string, id: number, data: any) {
  // Orders don't typically need to be cached for public display
  // But you might want to invalidate related caches if order affects product stock
  if (action === 'updated' && data?.status === 'completed') {
    // If order is completed, product stock might have changed
    // Refresh products cache to reflect updated stock levels
    await cacheService.refreshPartial('products')
  }
}

async function handleCustomerWebhook(action: string, id: number, data: any) {
  // Customer data is typically not cached for public display
  // This is here for completeness in case you need to handle customer-related cache updates
  console.log(`Customer webhook: ${action} ${id}`)
}
