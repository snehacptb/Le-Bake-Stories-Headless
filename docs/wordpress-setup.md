# WordPress Backend Setup Guide

This guide will help you set up WordPress with WooCommerce as a headless CMS for your Next.js frontend.

## Prerequisites

- WordPress 6.4+ installation
- PHP 8.0+
- MySQL 8.0+
- Admin access to WordPress

## Step 1: Install Required Plugins

### Core Plugins
1. **WooCommerce** (Latest version)
   - Go to Plugins → Add New
   - Search for "WooCommerce"
   - Install and activate

2. **Advanced Custom Fields (ACF)**
   - Search for "Advanced Custom Fields"
   - Install and activate
   - Enables custom fields for products and posts

3. **JWT Authentication for WP REST API**
   - Search for "JWT Authentication for WP REST API"
   - Install and activate
   - Enables secure API authentication

### Optional but Recommended
4. **WP REST API Cache**
   - Improves API performance
   - Search for "WP REST API Cache"

5. **Yoast SEO**
   - For better SEO management
   - Adds SEO data to REST API

## Step 2: Configure WooCommerce

### Basic Setup
1. Go to WooCommerce → Settings
2. Complete the setup wizard:
   - Store location and currency
   - Payment methods (Stripe, PayPal, etc.)
   - Shipping zones and methods
   - Tax settings

### API Configuration
1. Go to WooCommerce → Settings → Advanced → REST API
2. Click "Add Key"
3. Configure:
   - Description: "Next.js Frontend"
   - User: Select admin user
   - Permissions: Read/Write
4. Click "Generate API Key"
5. **Save the Consumer Key and Consumer Secret** - you'll need these for your `.env.local`

### Sample Products
Create some sample products to test:
1. Go to Products → Add New
2. Add product details:
   - Title, description, price
   - Product images
   - Categories and tags
   - Stock management
3. Publish the product

## Step 3: Configure WordPress REST API

### Enable CORS
Add this to your theme's `functions.php` or create a custom plugin:

```php
<?php
// Enable CORS for headless setup
function add_cors_http_header(){
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit(0);
    }
}
add_action('init','add_cors_http_header');

// Add CORS headers to REST API
function add_cors_to_rest_api() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: http://localhost:3000');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}
add_action('rest_api_init', 'add_cors_to_rest_api');
?>
```

### Expose Custom Fields to REST API
Add this to enable ACF fields in REST API:

```php
<?php
// Expose ACF fields to REST API
function expose_acf_fields_to_rest_api() {
    // For posts
    register_rest_field('post', 'acf', array(
        'get_callback' => function($object) {
            return get_fields($object['id']);
        }
    ));
    
    // For products
    register_rest_field('product', 'acf', array(
        'get_callback' => function($object) {
            return get_fields($object['id']);
        }
    ));
}
add_action('rest_api_init', 'expose_acf_fields_to_rest_api');
?>
```

## Step 4: Configure JWT Authentication

### Add JWT Secret
Add this to your `wp-config.php`:

```php
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

### Test JWT Authentication
You can test JWT auth with this endpoint:
```
POST /wp-json/jwt-auth/v1/token
{
    "username": "your_username",
    "password": "your_password"
}
```

## Step 5: Optimize for Headless

### Disable Unnecessary Features
Add to `functions.php`:

```php
<?php
// Disable WordPress features not needed for headless
function disable_headless_unnecessary_features() {
    // Remove theme support for post thumbnails in admin (still available via API)
    // Disable XML-RPC
    add_filter('xmlrpc_enabled', '__return_false');
    
    // Disable pingbacks
    add_filter('wp_headers', function($headers) {
        unset($headers['X-Pingback']);
        return $headers;
    });
    
    // Remove unnecessary meta tags
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
}
add_action('init', 'disable_headless_unnecessary_features');
?>
```

### Increase API Limits
Add to `functions.php`:

```php
<?php
// Increase REST API limits
function increase_rest_api_limits($query_params) {
    $query_params['per_page']['maximum'] = 100;
    return $query_params;
}
add_filter('rest_post_collection_params', 'increase_rest_api_limits');
add_filter('rest_product_collection_params', 'increase_rest_api_limits');
?>
```

## Step 6: Test API Endpoints

### WordPress REST API
Test these endpoints in your browser or Postman:

```
GET /wp-json/wp/v2/posts
GET /wp-json/wp/v2/pages
GET /wp-json/wp/v2/categories
GET /wp-json/wp/v2/tags
GET /wp-json/wp/v2/media
```

### WooCommerce REST API
Test with your API credentials:

```
GET /wp-json/wc/v3/products
GET /wp-json/wc/v3/products/categories
GET /wp-json/wc/v3/orders
GET /wp-json/wc/v3/customers
```

## Step 7: Security Considerations

### Hide WordPress Admin
1. Use a security plugin like Wordfence
2. Change default admin URL
3. Limit login attempts
4. Use strong passwords
5. Enable two-factor authentication

### API Security
1. Use HTTPS in production
2. Implement rate limiting
3. Validate API requests
4. Use proper authentication
5. Regularly update plugins

## Step 8: Performance Optimization

### Caching
1. Install a caching plugin (WP Rocket, W3 Total Cache)
2. Enable object caching (Redis/Memcached)
3. Use a CDN for media files
4. Optimize database queries

### Database Optimization
1. Remove unnecessary plugins
2. Clean up post revisions
3. Optimize database tables
4. Use proper indexing

## Step 9: Content Management

### Creating Content
1. **Products**: Use WooCommerce → Products
2. **Blog Posts**: Use Posts → Add New
3. **Pages**: Use Pages → Add New
4. **Categories**: Organize content with categories
5. **Tags**: Add relevant tags for better filtering

### Custom Fields
Use ACF to add custom fields:
1. Go to Custom Fields → Field Groups
2. Create field groups for products/posts
3. Add fields like:
   - Product specifications
   - Additional images
   - Custom descriptions
   - SEO data

## Step 10: Production Deployment

### Environment Variables
Update your production `.env.local`:

```env
WORDPRESS_API_URL=https://your-production-site.com/wp-json/wp/v2
WORDPRESS_BASE_URL=https://your-production-site.com
WOOCOMMERCE_API_URL=https://your-production-site.com/wp-json/wc/v3
WORDPRESS_CONSUMER_KEY=your_production_consumer_key
WORDPRESS_CONSUMER_SECRET=your_production_consumer_secret
```

### SSL Certificate
1. Install SSL certificate on WordPress site
2. Update WordPress URL settings to use HTTPS
3. Update API endpoints to use HTTPS

### Monitoring
1. Set up uptime monitoring
2. Monitor API response times
3. Track error logs
4. Monitor security events

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS headers in functions.php
   - Verify domain whitelist

2. **API Authentication Fails**
   - Check consumer key/secret
   - Verify user permissions
   - Test API endpoints directly

3. **Missing Product Data**
   - Check WooCommerce API permissions
   - Verify product status (published)
   - Check API response format

4. **Slow API Responses**
   - Enable caching
   - Optimize database
   - Use CDN for images

### Debug Mode
Enable WordPress debug mode in `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

## Next Steps

1. Configure your Next.js environment variables
2. Test API connections
3. Import sample content
4. Customize your frontend
5. Set up production deployment

For more help, refer to:
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Next.js Documentation](https://nextjs.org/docs)
