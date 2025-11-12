# PayPal Integration Solution

## Problem
The error "PayPal credentials not configured" occurs because the WooCommerce PayPal Payments plugin stores credentials in a way that's not directly accessible. The plugin found the `client_id` but couldn't find the `client_secret`.

## Root Cause
The WooCommerce PayPal Payments plugin uses a **Partner Referral** onboarding flow where:
1. Credentials are managed through PayPal's Partner API
2. The `client_secret` is often not stored in the WordPress database for security reasons
3. The plugin uses internal services to make API calls

## Solutions

### Solution 1: Use Manual API Credentials (Recommended)

This is the most reliable approach for headless WordPress setups.

#### Step 1: Get PayPal REST API Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Log in with your PayPal account
3. Go to **Apps & Credentials**
4. Choose **Sandbox** or **Live** mode
5. Click **Create App**
6. Give it a name (e.g., "My Headless Store")
7. Copy the **Client ID** and **Client Secret**

#### Step 2: Store Credentials in WordPress

Add this code to your WordPress theme's `functions.php` or create a custom plugin:

```php
<?php
// Store PayPal credentials manually
add_action('init', function() {
    // Only run once to set credentials
    if (get_option('ppcp_manual_credentials_set')) {
        return;
    }
    
    // Set your credentials here
    $credentials = array(
        'client_id' => 'YOUR_CLIENT_ID_HERE',
        'client_secret' => 'YOUR_CLIENT_SECRET_HERE',
        'sandbox_on' => true, // Set to false for production
    );
    
    update_option('woocommerce-ppcp-data-common', $credentials);
    update_option('ppcp_manual_credentials_set', true);
});
```

**Important:** Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with your actual credentials.

#### Step 3: Update the Plugin Code

The updated plugin code now searches multiple locations for credentials:
1. `woocommerce-ppcp-data-common` option (manual credentials)
2. `woocommerce-ppcp-data` option (onboarding data)
3. All `ppcp` related options in the database

### Solution 2: Use WP-CLI to Set Credentials

If you have WP-CLI access:

```bash
# For sandbox
wp option update woocommerce-ppcp-data-common '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET","sandbox_on":true}' --format=json

# For production
wp option update woocommerce-ppcp-data-common '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET","sandbox_on":false}' --format=json
```

### Solution 3: Database Direct Insert

If you have database access, run this SQL:

```sql
-- For sandbox credentials
INSERT INTO wp_options (option_name, option_value, autoload) 
VALUES (
    'woocommerce-ppcp-data-common',
    'a:3:{s:9:"client_id";s:80:"YOUR_CLIENT_ID_HERE";s:13:"client_secret";s:80:"YOUR_CLIENT_SECRET_HERE";s:10:"sandbox_on";b:1;}',
    'yes'
) ON DUPLICATE KEY UPDATE 
    option_value = 'a:3:{s:9:"client_id";s:80:"YOUR_CLIENT_ID_HERE";s:13:"client_secret";s:80:"YOUR_CLIENT_SECRET_HERE";s:10:"sandbox_on";b:1;}';
```

**Note:** Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with your actual credentials. Adjust the string lengths (s:80) to match your credential lengths.

## Testing the Fix

After implementing any solution:

1. **Test the config endpoint:**
   ```bash
   curl https://your-wordpress-site.com/wp-json/paypal/v1/config
   ```
   
   Should return:
   ```json
   {
     "client_id": "AYu5OMnf...",
     "sandbox_mode": true
   }
   ```

2. **Check WordPress error logs** for messages like:
   - "Found client_id in: woocommerce-ppcp-data-common"
   - "Found client_secret in: woocommerce-ppcp-data-common"

3. **Test order creation** through your checkout page

## Updated Plugin Features

The updated plugin now:

1. ✅ Searches `woocommerce-ppcp-data-common` option first
2. ✅ Falls back to `woocommerce-ppcp-data` option
3. ✅ Searches all `ppcp` options as last resort
4. ✅ Provides detailed error logging
5. ✅ Better error messages
6. ✅ Increased timeout for API calls (30 seconds)
7. ✅ Better error handling with response codes

## Debugging

Enable WordPress debug logging in `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Check `/wp-content/debug.log` for messages like:
- "PPCP Data Common: Array ( [0] => client_id [1] => client_secret [2] => sandbox_on )"
- "Found client_id in: woocommerce-ppcp-data-common"
- "Found client_secret in: woocommerce-ppcp-data-common"

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables** for production:
   ```php
   $credentials = array(
       'client_id' => getenv('PAYPAL_CLIENT_ID'),
       'client_secret' => getenv('PAYPAL_CLIENT_SECRET'),
       'sandbox_on' => getenv('PAYPAL_SANDBOX') === 'true',
   );
   ```

3. **Restrict API access** to your server's IP in PayPal dashboard

## Alternative: Use WooCommerce PayPal Payments Plugin's Native Flow

If you want to use the plugin's built-in onboarding:

1. Go to **WooCommerce → Settings → Payments → PayPal**
2. Click **Connect to PayPal** or **Set up manually**
3. Complete the onboarding process
4. The plugin will store credentials automatically

However, this may still not work for headless setups due to how the plugin manages credentials internally.

## Next Steps

1. Implement **Solution 1** (Manual API Credentials)
2. Test the `/config` endpoint
3. Try creating an order through your checkout
4. Monitor WordPress error logs
5. If still failing, check the error logs and share them for further debugging

## Support

If you continue to experience issues:
- Check that the WooCommerce PayPal Payments plugin is active
- Verify your PayPal API credentials are correct
- Ensure your PayPal app has the correct permissions
- Check that your server can make outbound HTTPS requests to PayPal
