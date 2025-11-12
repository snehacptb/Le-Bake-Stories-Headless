# Headless PayPal Integration Plugin

This WordPress plugin provides REST API endpoints for integrating WooCommerce PayPal Payments with a headless WordPress site.

## 🚨 Important: Credentials Setup Required

This plugin requires PayPal API credentials to function. The WooCommerce PayPal Payments plugin's Partner Referral flow doesn't always expose credentials in a way that's accessible to headless setups.

**Quick Fix:** Use the included `set-credentials.php` script to manually configure your credentials. See [Setup Instructions](#setup-instructions) below.

## Features

- ✅ Check PayPal plugin status and availability
- ✅ Get PayPal configuration (client ID for SDK)
- ✅ Create PayPal orders from WooCommerce orders
- ✅ Capture PayPal payments
- ✅ Get PayPal order details
- ✅ Automatic WooCommerce order status updates

## Requirements

- WordPress 5.8 or higher
- WooCommerce 5.0 or higher
- WooCommerce PayPal Payments plugin (active and configured)
- PHP 7.4 or higher

## Installation

1. **Upload the plugin:**
   - Copy the `headless-paypal-integration` folder to your WordPress `wp-content/plugins/` directory

2. **Activate the plugin:**
   - Go to WordPress Admin → Plugins
   - Find "Headless PayPal Integration" and click "Activate"

3. **Install WooCommerce PayPal Payments:**
   - Install and activate the "WooCommerce PayPal Payments" plugin
   - This plugin works alongside it to provide headless API access

## Setup Instructions

### Option 1: Quick Setup with Script (Recommended)

1. **Get PayPal API Credentials:**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
   - Navigate to **Apps & Credentials**
   - Choose **Sandbox** (for testing) or **Live** (for production)
   - Click **Create App** and give it a name
   - Copy your **Client ID** and **Client Secret**

2. **Run the Setup Script:**
   - Edit `set-credentials.php` in this plugin folder
   - Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with your credentials
   - Set `$sandbox_mode` to `true` for testing or `false` for production
   - Upload the file to your WordPress root directory
   - Visit `https://your-site.com/set-credentials.php` in your browser
   - Follow the on-screen instructions
   - **Delete the file** after setup for security

3. **Test the Integration:**
   - Visit `https://your-site.com/wp-json/paypal/v1/config`
   - You should see your client ID and sandbox mode
   - Try creating an order through your checkout page

### Option 2: Manual Setup via Code

Add this to your theme's `functions.php` or a custom plugin:

```php
add_action('init', function() {
    if (get_option('ppcp_manual_credentials_set')) {
        return;
    }
    
    update_option('woocommerce-ppcp-data-common', array(
        'client_id' => 'YOUR_CLIENT_ID_HERE',
        'client_secret' => 'YOUR_CLIENT_SECRET_HERE',
        'sandbox_on' => true, // false for production
    ));
    
    update_option('ppcp_manual_credentials_set', true);
});
```

### Option 3: WP-CLI Setup

```bash
wp option update woocommerce-ppcp-data-common '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET","sandbox_on":true}' --format=json
```

### Verify Setup

After setup, test these endpoints:
- Config: `https://your-site.com/wp-json/paypal/v1/config`
- Status: `https://your-site.com/wp-json/paypal/v1/status`

Check WordPress error logs at `/wp-content/debug.log` for detailed information.

## REST API Endpoints

### 1. Check PayPal Status
```
GET /wp-json/paypal/v1/status
```
Returns whether PayPal Payments plugin is active and enabled.

**Response:**
```json
{
  "active": true,
  "message": "PayPal is active and configured"
}
```

### 2. Get PayPal Configuration
```
GET /wp-json/paypal/v1/config
```
Returns PayPal client ID for loading the PayPal SDK.

**Response:**
```json
{
  "client_id": "YOUR_PAYPAL_CLIENT_ID",
  "sandbox_mode": false
}
```

### 3. Create PayPal Order
```
POST /wp-json/paypal/v1/create-order
```

**Request Body:**
```json
{
  "order_id": 123
}
```

**Response:**
```json
{
  "id": "PAYPAL_ORDER_ID",
  "status": "CREATED",
  "links": [...]
}
```

### 4. Capture PayPal Payment
```
POST /wp-json/paypal/v1/capture-order
```

**Request Body:**
```json
{
  "paypal_order_id": "PAYPAL_ORDER_ID",
  "woo_order_id": 123
}
```

**Response:**
```json
{
  "id": "PAYPAL_ORDER_ID",
  "status": "COMPLETED",
  "purchase_units": [...]
}
```

### 5. Get PayPal Order Details
```
GET /wp-json/paypal/v1/order/{paypal_order_id}
```

**Response:**
```json
{
  "id": "PAYPAL_ORDER_ID",
  "status": "APPROVED",
  ...
}
```

### 6. Cancel PayPal Order
```
POST /wp-json/paypal/v1/cancel-order
```

**Request Body:**
```json
{
  "paypal_order_id": "PAYPAL_ORDER_ID"
}
```

## How It Works

1. **Customer initiates checkout** on your headless frontend
2. **WooCommerce order is created** with payment method set to PayPal
3. **Frontend calls** `/wp-json/paypal/v1/create-order` with the WooCommerce order ID
4. **Plugin creates PayPal order** via PayPal API and returns the PayPal order ID
5. **Frontend displays PayPal buttons** using the PayPal SDK
6. **Customer approves payment** in PayPal popup
7. **Frontend calls** `/wp-json/paypal/v1/capture-order` to capture the payment
8. **Plugin captures payment** and updates WooCommerce order status to "Processing"
9. **Customer is redirected** to order confirmation page

## Integration with Headless Site

The headless WordPress site includes:

1. **PayPal Service** (`src/lib/paypal-service.ts`): Handles API calls to WordPress
2. **PayPal Payment Form** (`src/components/PayPalPaymentForm.tsx`): Renders PayPal buttons
3. **Checkout Page Integration**: Automatically detects and handles PayPal payments

## Troubleshooting

### PayPal plugin not detected
- Ensure WooCommerce PayPal Payments plugin is installed and activated
- Check that PayPal is enabled in WooCommerce → Settings → Payments

### Client ID not found
- Configure PayPal API credentials in WooCommerce → Settings → Payments → PayPal
- Enter both Client ID and Client Secret

### Payment capture fails
- Check WordPress error logs for detailed error messages
- Verify PayPal API credentials are correct
- Ensure PayPal account is in good standing

### CORS errors
- The plugin endpoints use `permission_callback => '__return_true'` to allow public access
- Ensure your WordPress site allows REST API requests from your frontend domain

## Security Notes

- All payment processing happens through PayPal's secure servers
- No sensitive payment information is stored on your WordPress site
- PayPal order IDs and transaction IDs are stored in WooCommerce order meta
- Consider adding authentication for production use

## Support

For issues or questions:
1. Check WordPress error logs
2. Enable WooCommerce logging (WooCommerce → Status → Logs)
3. Review PayPal API documentation: https://developer.paypal.com/

## License

GPL v2 or later
