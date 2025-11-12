# WordPress & WooCommerce API Setup Guide

This guide will help you configure your WordPress backend to work properly with the Next.js frontend.

## Prerequisites

1. WordPress site with admin access
2. WooCommerce plugin installed and activated
3. SSL certificate (recommended for production)

## Step 1: Install Required WordPress Plugins

### Essential Plugins:
1. **WooCommerce** - For ecommerce functionality
2. **WP REST API Menus** - For menu API support
3. **Application Passwords** (WordPress 5.6+) - For authentication
4. **Custom Post Type UI** (optional) - For custom content types

### Install WP REST API Menus Plugin:
```bash
# Via WordPress Admin
1. Go to Plugins > Add New
2. Search for "WP-REST-API V2 Menus"
3. Install and activate

# Or download from: https://wordpress.org/plugins/wp-rest-api-v2-menus/
```

## Step 2: Configure WooCommerce API

### Generate API Keys:
1. Go to **WooCommerce > Settings > Advanced > REST API**
2. Click **Add Key**
3. Fill in the details:
   - Description: "Next.js Frontend"
   - User: Select an admin user
   - Permissions: Read/Write
4. Click **Generate API Key**
5. Copy the **Consumer Key** and **Consumer Secret**

### API Endpoints Available:
- Products: `/wp-json/wc/v3/products`
- Categories: `/wp-json/wc/v3/products/categories`
- Orders: `/wp-json/wc/v3/orders`
- Customers: `/wp-json/wc/v3/customers`

## Step 3: Configure WordPress Menus

### Create Navigation Menu:
1. Go to **Appearance > Menus**
2. Create a new menu called "Primary Menu"
3. Add menu items (Pages, Categories, Custom Links)
4. Assign to "Primary Menu" location
5. Save the menu

### Menu API Endpoints:
- All menus: `/wp-json/menus/v1/menus`
- Menu by location: `/wp-json/menus/v1/locations/{location}`
- Menu items: `/wp-json/menus/v1/menus/{id}`

## Step 4: Environment Configuration

Create `.env.local` file in your Next.js project root:

```env
# WordPress Configuration
WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2
WOOCOMMERCE_API_URL=https://your-wordpress-site.com/wp-json/wc/v3

# WooCommerce API Keys (from Step 2)
WORDPRESS_CONSUMER_KEY=ck_your_consumer_key_here
WORDPRESS_CONSUMER_SECRET=cs_your_consumer_secret_here

# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 5: Test API Endpoints

### Test WordPress Posts:
```bash
curl "https://your-site.com/wp-json/wp/v2/posts"
```

### Test WooCommerce Products:
```bash
curl -u "consumer_key:consumer_secret" \
  "https://your-site.com/wp-json/wc/v3/products"
```

### Test Menus:
```bash
curl "https://your-site.com/wp-json/menus/v1/locations/primary"
```

## Step 6: WordPress Configuration

### Enable CORS (if needed):
Add to your WordPress `functions.php`:

```php
// Enable CORS for REST API
function add_cors_http_header(){
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}
add_action('init','add_cors_http_header');
```

### Increase API Limits:
```php
// Increase REST API limits
function increase_rest_api_limits($query_vars) {
    if (isset($query_vars['per_page'])) {
        $query_vars['per_page'] = min($query_vars['per_page'], 100);
    }
    return $query_vars;
}
add_filter('rest_product_query', 'increase_rest_api_limits');
```

## Step 7: Sample Data Setup

### Create Sample Products:
1. Go to **Products > Add New**
2. Add product details:
   - Name, description, price
   - Product images
   - Categories and tags
   - Stock information
3. Set some products as "Featured"
4. Create sale prices for some products

### Create Sample Content:
1. Add blog posts with featured images
2. Create product categories
3. Set up menu structure
4. Configure homepage content

## Troubleshooting

### Common Issues:

1. **404 Errors on API Calls:**
   - Check permalink structure (Settings > Permalinks)
   - Ensure "Post name" is selected
   - Save permalinks

2. **Authentication Errors:**
   - Verify API keys are correct
   - Check user permissions
   - Ensure HTTPS for production

3. **CORS Errors:**
   - Add CORS headers (see Step 6)
   - Check server configuration
   - Verify domain settings

4. **Menu API Not Working:**
   - Install WP REST API Menus plugin
   - Create and assign menus
   - Check menu location names

### Debug API Calls:
Enable WordPress debug mode in `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Security Considerations

1. **Use HTTPS** in production
2. **Limit API key permissions** to read-only if possible
3. **Implement rate limiting** on your server
4. **Validate and sanitize** all API responses
5. **Use environment variables** for sensitive data

## Performance Optimization

1. **Enable caching** for API responses
2. **Use CDN** for images and assets
3. **Implement pagination** for large datasets
4. **Optimize database queries**
5. **Use Redis/Memcached** for object caching

## Next Steps

1. Test all API endpoints
2. Verify product data is displaying correctly
3. Check menu navigation is working
4. Test cart functionality
5. Set up error monitoring and logging

For more detailed information, refer to:
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
