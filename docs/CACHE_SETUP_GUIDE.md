# Headless WordPress Cache Setup Guide

This guide explains how to set up and use the WordPress cache system for your Next.js headless site.

## Overview

The cache system stores WordPress data (posts, pages, products, categories, menus) as local JSON files for fast access. When content is updated in WordPress, the cache is automatically refreshed via webhooks.

### Architecture

```
WordPress (Backend)
  ↓ (Content Update)
  ↓ Webhook trigger
  ↓
Next.js API Route (/api/webhooks/wordpress)
  ↓ Verify signature
  ↓ Refresh cache
  ↓
Local Cache (.next/cache/wordpress/*.json)
  ↓ Fast reads
  ↓
Your Next.js Pages
```

## Features

✅ **Automatic Cache Refresh** - WordPress sends webhooks when content changes
✅ **Manual Refresh** - API endpoint for manual/scheduled cache updates
✅ **Selective Refresh** - Refresh specific data types (products, pages, etc.)
✅ **Signature Verification** - Secure webhook validation with HMAC
✅ **Debug Mode** - Detailed logging for troubleshooting
✅ **Non-blocking** - Webhooks don't slow down WordPress admin

## Quick Start

### Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the following variables:
   ```env
   # Your WordPress site URL
   NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com

   # WooCommerce API credentials (from WooCommerce → Settings → Advanced → REST API)
   WC_CONSUMER_KEY=ck_xxxxxxxxxxxxx
   WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxx

   # Enable caching
   ENABLE_CACHE=true

   # Secret for manual cache refresh API
   CACHE_REFRESH_SECRET=your-random-secret-here

   # Secret for webhook signature verification
   WEBHOOK_SECRET=your-webhook-secret-here
   ```

3. Generate secure secrets:
   ```bash
   # Generate a random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Step 2: Install WordPress Plugin

1. Upload the plugin to WordPress:
   - Copy the `wordpress-plugin/headless-wordpress-helper` folder
   - Upload to `/wp-content/plugins/` on your WordPress server
   - Or zip the folder and upload via WordPress admin

2. Activate the plugin:
   - Go to **Plugins** in WordPress admin
   - Find "Headless WordPress Helper"
   - Click **Activate**

### Step 3: Configure WordPress Webhooks

1. Go to **Settings → Headless Webhooks** in WordPress admin

2. Configure the settings:
   - **Webhook URL**: `https://your-nextjs-site.com/api/webhooks/wordpress`
   - **Webhook Secret**: Same value as `WEBHOOK_SECRET` in your `.env.local`
   - **Debug Mode**: Enable for testing (disable in production)

3. Click **Save Settings**

4. Test the webhook:
   - Click **Send Test Webhook** button
   - Check your Next.js console for the webhook log
   - You should see: `🔔 [WEBHOOK] Received: test test 0`

### Step 4: Initial Cache Population

Before your site can serve data, you need to populate the cache:

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Manually trigger a cache refresh:
   ```bash
   # Visit this URL in your browser or use curl
   curl "http://localhost:3000/api/cache/refresh?secret=YOUR_CACHE_REFRESH_SECRET"
   ```

3. Verify cache files were created:
   ```bash
   ls .next/cache/wordpress/
   ```

   You should see files like:
   - `site-info.json`
   - `menus.json`
   - `products.json`
   - `product-categories.json`
   - `pages.json`
   - `posts.json`

## Usage

### Automatic Cache Refresh (Webhooks)

Once configured, the cache will automatically refresh when you:
- Create, update, or delete a post in WordPress
- Create, update, or delete a page in WordPress
- Create, update, or delete a product in WooCommerce
- Create, update, or delete a category in WooCommerce
- Update or delete a menu in WordPress

**How it works:**
1. Admin updates content in WordPress
2. WordPress plugin detects the change
3. Plugin sends webhook to Next.js
4. Next.js refreshes the relevant cache
5. New data is immediately available

### Manual Cache Refresh

You can manually refresh the cache using the API endpoint:

#### Refresh All Data
```bash
curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=all"
```

#### Refresh Specific Data Type
```bash
# Refresh only products
curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=products"

# Refresh only pages
curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=pages"

# Refresh only posts
curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=posts"

# Refresh only categories
curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=categories"

# Refresh only menus
curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=menus"

# Refresh only site info
curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=site-info"
```

### Scheduled Cache Refresh (Optional)

For a backup refresh mechanism, you can set up a cron job:

#### Using Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cache/refresh?secret=YOUR_SECRET&type=all",
    "schedule": "0 */6 * * *"
  }]
}
```

This refreshes the cache every 6 hours.

#### Using External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):
- Set URL: `https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=all`
- Set schedule: Every 6 hours (or as needed)

## API Endpoints

### 1. Webhook Receiver

**Endpoint:** `POST /api/webhooks/wordpress`

Receives webhooks from WordPress when content is updated.

**Headers:**
- `Content-Type: application/json`
- `X-WP-Signature: <hmac-signature>` (if webhook secret is configured)

**Payload:**
```json
{
  "action": "created|updated|deleted",
  "type": "post|page|product|category|menu",
  "id": 123,
  "data": { ... }
}
```

**Health Check:**
```bash
curl "https://your-site.com/api/webhooks/wordpress"
```

### 2. Manual Cache Refresh

**Endpoint:** `GET /api/cache/refresh`

Manually refreshes the cache.

**Query Parameters:**
- `secret` (required): Your `CACHE_REFRESH_SECRET`
- `type` (optional): Data type to refresh (`all`, `products`, `categories`, `pages`, `posts`, `menus`, `site-info`)

**Response:**
```json
{
  "success": true,
  "message": "Full cache refresh completed",
  "metadata": { ... },
  "duration": "1234ms",
  "stats": { ... }
}
```

### 3. Cache Management (POST)

**Endpoint:** `POST /api/cache/refresh`

Advanced cache management operations.

**Query Parameters:**
- `secret` (required): Your `CACHE_REFRESH_SECRET`

**Body:**
```json
{
  "action": "invalidate|stats",
  "type": "products",
  "id": 123
}
```

## Cache Service Usage in Code

### Get Cached Data

```typescript
import { cacheService } from '@/lib/cache-service'

// Get all products
const products = await cacheService.getProducts()

// Get product by slug
const product = await cacheService.getProductBySlug('my-product')

// Get all pages
const pages = await cacheService.getPages()

// Get page by slug
const page = await cacheService.getPageBySlug('about')

// Get all posts
const posts = await cacheService.getPosts()

// Get menu by location
const menu = await cacheService.getMenuByLocation('primary')

// Get all categories
const categories = await cacheService.getProductCategories()
```

### Manual Cache Operations

```typescript
// Refresh all data
await cacheService.refreshAll()

// Refresh specific data type
await cacheService.refreshPartial('products')

// Invalidate specific cache
await cacheService.invalidate('products')

// Clear all cache
await cacheService.clear()

// Get cache statistics
const stats = cacheService.getStats()
console.log('Cache hit rate:', stats.hitRate)
```

## Troubleshooting

### Cache files not being created

1. Check directory permissions:
   ```bash
   mkdir -p .next/cache/wordpress
   chmod 755 .next/cache/wordpress
   ```

2. Enable cache in environment:
   ```env
   ENABLE_CACHE=true
   ```

3. Check Next.js console for errors

### Webhooks not working

1. **Test the endpoint directly:**
   ```bash
   curl -X GET "https://your-site.com/api/webhooks/wordpress"
   ```

   Should return:
   ```json
   {
     "success": true,
     "message": "WordPress webhook endpoint is active"
   }
   ```

2. **Enable debug mode** in WordPress plugin (Settings → Headless Webhooks)
   - Check WordPress `debug.log` file for webhook logs

3. **Check signature verification:**
   - Ensure `WEBHOOK_SECRET` in `.env.local` matches WordPress plugin settings
   - Try temporarily removing the secret to test without signature verification

4. **Verify WordPress can reach Next.js:**
   - Make sure your Next.js site is accessible from WordPress server
   - Check firewall rules if using a staging server

### Products showing old data

1. Check if webhooks are firing:
   ```bash
   # Check Next.js logs for webhook messages
   # You should see: 🔔 [WEBHOOK] Received: updated product 123
   ```

2. Manually refresh products:
   ```bash
   curl "https://your-site.com/api/cache/refresh?secret=YOUR_SECRET&type=products"
   ```

3. Check cache expiry:
   ```env
   # In .env.local, adjust cache expiry
   CACHE_EXPIRY_MINUTES=60
   ```

### Signature verification failing

1. Ensure secrets match:
   - `.env.local` → `WEBHOOK_SECRET`
   - WordPress → Settings → Headless Webhooks → Webhook Secret

2. Secrets should be identical (no extra spaces or quotes)

3. Check WordPress plugin debug logs:
   ```
   [Headless Webhooks] Sending: {"action":"updated","type":"product"...}
   ```

## Performance Tips

1. **Cache Expiry**: Set appropriate expiry times
   - Frequently updated content: `CACHE_EXPIRY_MINUTES=30`
   - Rarely updated content: `CACHE_EXPIRY_MINUTES=1440` (24 hours)

2. **Selective Refresh**: Only refresh changed data types via webhooks

3. **ISR + Cache**: Combine with Next.js ISR (Incremental Static Regeneration)
   ```typescript
   export const revalidate = 3600 // 1 hour
   ```

4. **CDN Caching**: Add CDN cache headers for API routes

## Security Recommendations

1. **Use Strong Secrets**:
   ```bash
   # Generate cryptographically secure secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Enable Signature Verification**: Always set `WEBHOOK_SECRET` in production

3. **Restrict API Access**: Consider IP whitelisting for cache refresh endpoints

4. **Use HTTPS**: Always use HTTPS in production for webhook endpoints

5. **Monitor Logs**: Regularly check webhook logs for suspicious activity

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in environment
- [ ] Set `ENABLE_CACHE=true`
- [ ] Configure strong `CACHE_REFRESH_SECRET`
- [ ] Configure strong `WEBHOOK_SECRET`
- [ ] Update webhook URL in WordPress to production domain
- [ ] Disable debug mode in WordPress plugin
- [ ] Test webhook with production endpoint
- [ ] Set up scheduled backup refresh (cron job)
- [ ] Monitor cache hit rates and performance
- [ ] Set up error monitoring (Sentry, etc.)

## Cache File Structure

Cache files are stored in `.next/cache/wordpress/`:

```
.next/cache/wordpress/
├── site-info.json       # WordPress site metadata
├── menus.json           # Navigation menus
├── products.json        # WooCommerce products
├── product-categories.json # Product categories
├── pages.json           # WordPress pages
├── posts.json           # Blog posts
└── metadata.json        # Cache metadata (timestamps, etc.)
```

Each file contains:
```json
{
  "data": [ ... ],        // Actual cached data
  "lastUpdated": "2024-...",  // ISO timestamp
  "expiry": 60            // Expiry time in minutes
}
```

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section above
- Review Next.js console logs
- Review WordPress debug.log (if debug mode enabled)
- Check network tab in browser DevTools for API calls

## Version History

- **v1.3.0** - Added webhook support for automatic cache refresh
- **v1.2.0** - Added manual cache refresh API
- **v1.0.0** - Initial cache implementation
