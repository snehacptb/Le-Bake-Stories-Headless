# WooCommerce Setup Guide

This guide will help you set up the complete WooCommerce functionality for your headless WordPress + Next.js ecommerce site.

## Overview

The implementation includes:
- **Shop Page** → Product grid with filtering, sorting, and search
- **Cart Page** → Cart management with quantity updates and coupon support
- **Checkout Page** → Complete checkout flow with billing/shipping forms
- **My Account Page** → User dashboard with orders, addresses, and profile management
- **Authentication** → Login/register with WordPress JWT
- **Cart Context** → Global cart state management
- **Multi-site Ready** → Reusable across different WordPress sites

## WordPress Backend Setup

### 1. Required WordPress Plugins

Install these plugins on your WordPress backend:

```bash
# Core WooCommerce
- WooCommerce (latest version)
- WooCommerce REST API (included with WooCommerce)

# Menu Integration
- WP-REST-API V2 Menus

# Authentication
- JWT Authentication for WP REST API

# Optional but Recommended
- WooCommerce Stripe Gateway
- WooCommerce PayPal Payments
- WooCommerce PDF Invoices & Packing Slips
```

### 2. WooCommerce API Keys

1. Go to **WooCommerce → Settings → Advanced → REST API**
2. Click **Add Key**
3. Set permissions to **Read/Write**
4. Copy the **Consumer Key** and **Consumer Secret**

### 3. JWT Authentication Setup

Add to your WordPress `wp-config.php`:

```php
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

Add to your `.htaccess`:

```apache
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
```

### 4. CORS Configuration

Add to your WordPress `functions.php`:

```php
function add_cors_http_header(){
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
}
add_action('init','add_cors_http_header');
```

## Next.js Frontend Setup

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and update:

```bash
# WordPress Configuration
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com

# WooCommerce Configuration
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_your_consumer_key_here
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_your_consumer_secret_here

# Authentication
NEXT_PUBLIC_JWT_AUTH_URL=https://your-wordpress-site.com/wp-json/jwt-auth/v1

# Site Configuration
NEXT_PUBLIC_SITE_NAME=Your Store Name
NEXT_PUBLIC_BRAND_NAME=Your Brand
```

### 2. Required Dependencies

The following dependencies are already included:

```json
{
  "dependencies": {
    "date-fns": "^2.30.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.263.1",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-tabs": "^1.0.4"
  }
}
```

## Features Overview

### Shop Page (`/shop`)
- Product grid with responsive layout
- Advanced filtering (category, price, rating, stock status)
- Search functionality
- Sorting options (price, popularity, rating, date)
- Grid/List view toggle
- Pagination
- Add to cart functionality

### Cart Page (`/cart`)
- Cart item management
- Quantity updates
- Item removal
- Coupon code application
- Price calculations (subtotal, tax, shipping, total)
- Continue shopping link
- Proceed to checkout

### Checkout Page (`/checkout`)
- Customer information form
- Billing address form
- Shipping address form (with "same as billing" option)
- Payment method selection
- Order notes
- Terms and conditions
- Account creation option
- Order summary
- SSL security indicators

### My Account Page (`/my-account`)
- Dashboard overview
- Order history with status tracking
- Address management (billing & shipping)
- Profile information editing
- Wishlist (placeholder)
- Logout functionality

### Authentication
- Login page with email/password
- Registration with validation
- Password visibility toggle
- Remember me option
- Forgot password link
- JWT token management
- Protected routes

## Multi-site Configuration

### For Multiple Websites

1. **Environment Variables**: Each site uses its own `.env.local`
2. **WordPress Backend**: Each site connects to its own WordPress instance
3. **Branding**: Customize `NEXT_PUBLIC_BRAND_NAME` and `NEXT_PUBLIC_BRAND_LOGO`
4. **Styling**: Modify Tailwind classes in components for different themes

### Site-specific Customization

```bash
# Site 1 (.env.local)
NEXT_PUBLIC_SITE_ID=1
NEXT_PUBLIC_BRAND_NAME=Fashion Store
NEXT_PUBLIC_WORDPRESS_URL=https://fashion-wp.com

# Site 2 (.env.local)
NEXT_PUBLIC_SITE_ID=2
NEXT_PUBLIC_BRAND_NAME=Electronics Hub
NEXT_PUBLIC_WORDPRESS_URL=https://electronics-wp.com
```

## API Integration

### WooCommerce API Endpoints Used

- `GET /wp-json/wc/v3/products` - Product listing
- `GET /wp-json/wc/v3/products/{id}` - Single product
- `GET /wp-json/wc/v3/products/categories` - Product categories
- `POST /wp-json/wc/v3/orders` - Create order
- `GET /wp-json/wc/v3/orders` - Order history
- `GET /wp-json/wc/v3/customers/{id}` - Customer data
- `PUT /wp-json/wc/v3/customers/{id}` - Update customer
- `GET /wp-json/wc/v3/payment_gateways` - Payment methods
- `GET /wp-json/wc/v3/shipping/zones` - Shipping zones

### WordPress API Endpoints Used

- `POST /wp-json/jwt-auth/v1/token` - Authentication
- `GET /wp-json/menus/v1/menus` - Navigation menus
- `GET /wp-json/wp/v2/pages` - Pages for fallback menu

## Security Considerations

1. **API Keys**: Never expose consumer secrets in frontend code
2. **Authentication**: JWT tokens stored in localStorage (consider httpOnly cookies for production)
3. **CORS**: Properly configured for your domain
4. **SSL**: Always use HTTPS in production
5. **Validation**: All forms include client and server-side validation

## Performance Optimizations

1. **Image Optimization**: Next.js Image component with proper sizing
2. **Lazy Loading**: Components load on demand
3. **Caching**: API responses cached where appropriate
4. **Code Splitting**: Automatic with Next.js App Router
5. **SEO**: Proper meta tags and structured data

## Testing

### Test the Implementation

1. **Products**: Create test products in WooCommerce
2. **Categories**: Set up product categories
3. **Payment**: Configure test payment gateways
4. **Shipping**: Set up shipping zones and methods
5. **Users**: Test registration and login flow
6. **Orders**: Complete test purchases

### Common Issues

1. **CORS Errors**: Check WordPress CORS configuration
2. **API Authentication**: Verify consumer keys and JWT setup
3. **Menu Loading**: Ensure wp-rest-api-v2-menus plugin is active
4. **Product Images**: Check WordPress media permissions

## Deployment

### Production Checklist

- [ ] Update environment variables for production URLs
- [ ] Configure production payment gateways
- [ ] Set up SSL certificates
- [ ] Configure CDN for images
- [ ] Set up monitoring and analytics
- [ ] Test all functionality in production environment

## Support

For issues or questions:
1. Check the WordPress and WooCommerce logs
2. Verify API endpoints in browser/Postman
3. Check browser console for JavaScript errors
4. Ensure all required plugins are active and updated

This implementation provides a complete, production-ready WooCommerce solution that replicates traditional WordPress/themestheme functionality while leveraging the performance benefits of a headless architecture.
