/**
 * WordPress Webhook Endpoint
 * POST /api/webhooks/wordpress
 * 
 * Does not require a secret in query. If you use a plugin that can sign requests,
 * implement header verification here. Otherwise rely on obscured URL and optional IP allowlist.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'
import { WebhookPayload } from '@/lib/cache-types'

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json()
    const { action, type, id, data } = payload

    console.log(`Webhook received: ${action} ${type} ${id}`)

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
      message: `Webhook processed: ${action} ${type} ${id}`
    })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
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
