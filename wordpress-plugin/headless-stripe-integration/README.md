# Headless Stripe Integration (Enhanced) v4.0.0

## 🎯 Overview

Enhanced WordPress plugin for headless WooCommerce Stripe integration with comprehensive webhook support and automatic order status management.

## ✨ Key Features

- ✅ **Payment Intent API** - Create and manage Stripe payment intents
- ✅ **Order Status Management** - Automatic status updates via webhooks
- ✅ **Webhook Support** - Full Stripe webhook event handling
- ✅ **CORS Headers** - Proper CORS configuration for headless architecture
- ✅ **Dual Configuration** - Works with WooCommerce Stripe Gateway OR standalone
- ✅ **Error Handling** - Comprehensive error logging and recovery
- ✅ **Test & Live Modes** - Support for both test and production environments

## 📋 Requirements

- WordPress 5.8+
- WooCommerce 5.0+
- PHP 7.4+
- Stripe Account

## 🚀 Installation

### 1. Upload Plugin

```bash
# Zip the plugin folder
cd wordpress-plugin
zip -r headless-stripe-integration.zip headless-stripe-integration/

# Upload via WordPress Admin
WordPress Admin → Plugins → Add New → Upload Plugin
```

### 2. Activate Plugin

Activate "Headless Stripe Integration (Enhanced)" from the Plugins page.

### 3. Configure Stripe Keys

**Option A: Use WooCommerce Stripe Gateway (Recommended)**

1. Install and activate WooCommerce Stripe Gateway plugin
2. Go to WooCommerce → Settings → Payments → Stripe
3. Configure your Stripe API keys
4. The Headless Stripe Integration will automatically use these keys

**Option B: Configure Keys Directly**

1. Go to WooCommerce → Headless Stripe
2. Enter your Stripe API keys (test or live)
3. Save settings

### 4. Configure Webhooks (Important!)

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter webhook URL: `https://your-site.com/wc-api/stripe_webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Go to WooCommerce → Headless Stripe
7. Paste the webhook secret and save

## 🔧 Frontend Integration

### Environment Variables

Add to your `.env` file:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
```

### Payment Flow

Your existing frontend code should work with this plugin. The plugin provides these endpoints:

1. **Create Payment Intent**
   ```javascript
   const response = await fetch(`${wpUrl}/wp-json/stripe/v1/create-payment-intent`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ order_id: orderId })
   });
   const { clientSecret } = await response.json();
   ```

2. **Confirm Payment**
   ```javascript
   const response = await fetch(`${wpUrl}/wp-json/stripe/v1/confirm-payment`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       order_id: orderId,
       payment_intent_id: paymentIntent.id
     })
   });
   ```

## 📊 Order Status Flow

### Automatic Status Updates (via Webhooks)

| Stripe Event | Order Status | Description |
|--------------|--------------|-------------|
| `payment_intent.succeeded` | Processing | Payment successful, order ready for fulfillment |
| `payment_intent.payment_failed` | Failed | Payment declined or failed |
| `charge.refunded` (full) | Refunded | Full refund issued |
| `charge.refunded` (partial) | Processing | Partial refund (note added) |
| `charge.dispute.created` | On Hold | Customer disputed payment |
| `charge.dispute.closed` (won) | Processing | Dispute won, order valid |
| `charge.dispute.closed` (lost) | Failed | Dispute lost, payment reversed |

### Manual Status Updates

The plugin also handles manual payment confirmation via the REST API when webhooks aren't available.

## 🐛 Troubleshooting

### Issue: Stripe.js Error - "Cannot read properties of undefined"

**Cause**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is undefined in your frontend.

**Solution**:
1. Check your `.env` file has the correct key
2. Restart your Next.js dev server after adding env variables
3. Verify the key starts with `pk_test_` or `pk_live_`

### Issue: "Stripe keys not configured"

**Solution**:
1. Go to WooCommerce → Headless Stripe
2. Configure your API keys
3. OR install WooCommerce Stripe Gateway plugin

### Issue: Webhooks not working

**Solution**:
1. Verify webhook URL is correct: `https://your-site.com/wc-api/stripe_webhook`
2. Check webhook secret is configured in plugin settings
3. Test webhook in Stripe Dashboard
4. Check WordPress error logs: `/wp-content/debug.log`

### Issue: Order status not updating

**Solution**:
1. Verify webhooks are configured
2. Check that webhook events are being received (Stripe Dashboard → Webhooks → View logs)
3. Enable WordPress debug logging to see webhook processing

### Enable Debug Logging

Add to `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Check logs at: `/wp-content/debug.log`

## 🔒 Security

- ✅ Webhook signature verification
- ✅ Payment intent validation
- ✅ Order ID verification
- ✅ Secure API key storage
- ✅ CORS origin validation

## 📝 API Reference

### GET /wp-json/stripe/v1/config

Returns Stripe configuration for frontend.

**Response:**
```json
{
  "success": true,
  "publishable_key": "pk_test_...",
  "mode": "test"
}
```

### POST /wp-json/stripe/v1/create-payment-intent

Creates a Stripe payment intent for an order.

**Request:**
```json
{
  "order_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "intentId": "pi_xxx",
  "amount": 5000,
  "currency": "usd"
}
```

### POST /wp-json/stripe/v1/confirm-payment

Confirms payment and updates order status.

**Request:**
```json
{
  "order_id": 123,
  "payment_intent_id": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "order_id": 123,
  "order_status": "processing",
  "order_number": "123",
  "transaction_id": "pi_xxx"
}
```

## 🔄 Migration from Old Plugin

If upgrading from the standalone v3.0.0:

1. Deactivate old plugin
2. Install and activate this new version
3. Reconfigure webhook secret (if using webhooks)
4. Test payment flow

All existing orders and metadata will be preserved.

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Enable debug logging and check logs
3. Verify Stripe Dashboard for webhook delivery
4. Check browser console for frontend errors

## 📄 License

GPL v2 or later

## 🙏 Credits

Created by TechBrein to solve WooCommerce Stripe integration challenges in headless architectures.
