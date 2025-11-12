# Installation Guide

## Quick Start

### Step 1: Create Plugin Zip File

```bash
cd wordpress-plugin
zip -r headless-stripe-integration.zip headless-stripe-integration/
```

Or on Windows PowerShell:
```powershell
Compress-Archive -Path "wordpress-plugin\headless-stripe-integration" -DestinationPath "headless-stripe-integration.zip"
```

### Step 2: Upload to WordPress

1. Go to WordPress Admin → Plugins → Add New → Upload Plugin
2. Choose `headless-stripe-integration.zip`
3. Click "Install Now"
4. Click "Activate Plugin"

### Step 3: Configure Stripe Keys

**Option A: Using WooCommerce Stripe Gateway (Recommended)**

1. Install "WooCommerce Stripe Gateway" plugin from WordPress.org
2. Go to WooCommerce → Settings → Payments → Stripe
3. Enable Stripe and configure your API keys
4. Done! The Headless Stripe Integration will use these keys

**Option B: Configure Directly in Plugin**

1. Go to WooCommerce → Headless Stripe
2. Enable test mode (for testing)
3. Enter your Test Publishable Key (starts with `pk_test_`)
4. Enter your Test Secret Key (starts with `sk_test_`)
5. Click "Save Settings"

Get your keys from: https://dashboard.stripe.com/test/apikeys

### Step 4: Configure Webhooks (Critical for Order Status Updates!)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter: `https://your-wordpress-site.com/wc-api/stripe_webhook`
4. Select these events:
   - ✅ payment_intent.succeeded
   - ✅ payment_intent.payment_failed
   - ✅ charge.refunded
   - ✅ charge.dispute.created
   - ✅ charge.dispute.closed
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Go to WooCommerce → Headless Stripe in WordPress
8. Paste the webhook secret
9. Click "Save Settings"

### Step 5: Update Frontend Environment Variables

Edit your `.env` file:

```env
# Make sure this matches your WordPress Stripe configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Your WordPress URL
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
```

**Important**: Restart your Next.js dev server after updating `.env`:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Step 6: Test the Integration

1. **Test API Endpoint**
   
   Open browser console and run:
   ```javascript
   fetch('https://your-site.com/wp-json/stripe/v1/config')
     .then(r => r.json())
     .then(console.log)
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "publishable_key": "pk_test_...",
     "mode": "test"
   }
   ```

2. **Test Payment Flow**
   
   - Add items to cart
   - Go to checkout
   - Fill in billing details
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC, any ZIP
   - Complete payment
   - Order should change to "Processing" status

3. **Test Webhook**
   
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook endpoint
   - Click "Send test webhook"
   - Select `payment_intent.succeeded`
   - Check WordPress logs for webhook processing

## Fixing the Stripe.js Error

The error you're seeing:
```
TypeError: Cannot read properties of undefined (reading 'match')
```

This happens because `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is undefined.

### Solution:

1. **Check `.env` file exists** in your project root
2. **Verify the key is set**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SN4C2KjG1sywVbiNSgWAF1T9O6YVTx0QK3VH7mY6iMItJiYkmtF40m2ySDEONsUqTSsLLeOwfIAj0udctuU2Uen00DJ7QlxRu
   ```
3. **Restart Next.js server** (this is critical!)
4. **Verify in browser console**:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   ```

## Verification Checklist

- [ ] Plugin installed and activated
- [ ] Stripe keys configured (WooCommerce or plugin settings)
- [ ] Webhook endpoint added to Stripe Dashboard
- [ ] Webhook secret configured in plugin
- [ ] Frontend `.env` file has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Next.js server restarted after `.env` changes
- [ ] Test payment completed successfully
- [ ] Order status changed to "Processing"

## Common Issues

### "Stripe keys not configured"
- Configure keys in WooCommerce → Headless Stripe
- OR install WooCommerce Stripe Gateway plugin

### Stripe.js initialization error
- Check `.env` file has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Restart Next.js dev server
- Clear browser cache

### Order status not updating
- Configure webhooks in Stripe Dashboard
- Add webhook secret to plugin settings
- Test webhook delivery in Stripe Dashboard

### CORS errors
- Plugin includes CORS headers automatically
- If issues persist, check server CORS configuration

## Next Steps

After successful installation:

1. Test with Stripe test cards: https://stripe.com/docs/testing
2. Monitor webhook delivery in Stripe Dashboard
3. Check order status updates in WooCommerce
4. When ready, switch to live mode and use live keys
