/**
 * WordPress Webhook Endpoint
 * POST /api/webhooks/wordpress
 *
 * Receives webhooks from WordPress when content is updated
 * Supports signature verification for enhanced security
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'
import { WebhookPayload } from '@/lib/cache-types'
import crypto from 'crypto'

// Verify webhook signature (optional but recommended)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return signature === digest
}

export async function POST(request: NextRequest) {
  try {
    // Optional signature verification
    const signature = request.headers.get('x-wp-signature') || ''
    const webhookSecret = process.env.WEBHOOK_SECRET

    // Read raw body for signature verification
    const body = await request.text()

    // Verify signature if both secret and signature are provided
    if (webhookSecret && signature) {
      if (!verifyWebhookSignature(body, signature, webhookSecret)) {
        console.error('❌ [WEBHOOK] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
      console.log('✅ [WEBHOOK] Signature verified')
    }

    const payload: WebhookPayload = JSON.parse(body)
    const { action, type, id, data } = payload

    console.log(`🔔 [WEBHOOK] Received: ${action} ${type} ${id}`)

    // Handle different webhook types
    switch (type) {
      case 'product':
        await handleProductWebhook(action, id, data)
        break
      case 'category':
        await handleCategoryWebhook(action, id, data)
        break
      case 'page':
        await handlePageWebhook(action, id, data)
        break
      case 'post':
        await handlePostWebhook(action, id, data)
        break
      case 'menu':
        await handleMenuWebhook(action, id, data)
        break
      default:
        console.warn(`Unknown webhook type: ${type}`)
    }

    return NextResponse.json({
      success: true,
      message: `Webhook processed: ${action} ${type} ${id}`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'WordPress webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}

async function handleProductWebhook(action: string, id: number, data: any) {
  switch (action) {
    case 'created':
    case 'updated':
      // Refresh products cache to include new/updated product
      await cacheService.refreshPartial('products')
      break
    case 'deleted':
      // Invalidate specific product cache
      await cacheService.invalidate(`product-${id}`)
      // Also refresh products cache to remove deleted product
      await cacheService.refreshPartial('products')
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

async function handlePageWebhook(action: string, id: number, data: any) {
  switch (action) {
    case 'created':
    case 'updated':
      await cacheService.refreshPartial('pages')
      break
    case 'deleted':
      await cacheService.invalidate(`page-${id}`)
      await cacheService.refreshPartial('pages')
      break
  }
}

async function handlePostWebhook(action: string, id: number, data: any) {
  switch (action) {
    case 'created':
    case 'updated':
      await cacheService.refreshPartial('posts')
      break
    case 'deleted':
      await cacheService.invalidate(`post-${id}`)
      await cacheService.refreshPartial('posts')
      break
  }
}

async function handleMenuWebhook(action: string, id: number, data: any) {
  switch (action) {
    case 'created':
    case 'updated':
      await cacheService.refreshPartial('menus')
      break
    case 'deleted':
      await cacheService.invalidate(`menu-${id}`)
      await cacheService.refreshPartial('menus')
      break
  }
}
