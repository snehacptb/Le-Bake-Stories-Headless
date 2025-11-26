# SEOPress Headless API

Exposes SEOPress metadata via WordPress REST API for headless implementations.

## Installation

1. Upload the `seopress-headless-api` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Make sure SEOPress plugin is installed and activated

## Features

- ✅ Exposes SEOPress metadata for posts, pages, and products via REST API
- ✅ Includes meta title, description, Open Graph, and Twitter Card data
- ✅ Supports taxonomy (categories/tags) SEO metadata
- ✅ Provides breadcrumb data
- ✅ Includes robots meta directives
- ✅ Global SEO settings endpoint
- ✅ Custom endpoint for fetching SEO data by slug
- ✅ **NEW:** Admin verification endpoint for headless admin panel
- ✅ **NEW:** SEO data update endpoint (admin only) with JWT authentication
- ✅ **NEW:** Edit URL endpoint for iframe-based WordPress editor integration

## Features for Headless Admin

This plugin enables a **floating "Edit SEO" button** on your headless frontend that:
- ✅ Shows only for authenticated WordPress admins
- ✅ Opens WordPress post editor in an iframe modal
- ✅ Allows editing SEO directly in WordPress with SEOPress
- ✅ Works exactly like traditional WordPress admin experience

See the Next.js integration documentation for implementation details.

## API Endpoints

### 1. Get SEO Data with Post/Page/Product

SEO data is automatically included in standard WordPress REST API responses:

```
GET /wp-json/wp/v2/posts/{id}
GET /wp-json/wp/v2/pages/{id}
GET /wp-json/wp/v2/posts?slug={slug}
GET /wp-json/wc/v3/products?slug={slug}
```

Response includes `seopress_meta` field with all SEO data.

### 2. Get SEO Data by Slug

```
GET /wp-json/seopress/v1/seo/{post-type}/{slug}
```

Example:
```
GET /wp-json/seopress/v1/seo/post/my-blog-post
GET /wp-json/seopress/v1/seo/product/chocolate-cake
```

### 3. Get Global SEO Settings

```
GET /wp-json/seopress/v1/settings
```

Returns site-wide SEO configuration including:
- Site name and description
- Social media accounts
- Verification codes (Google, Bing, Pinterest)
- Analytics IDs

### 4. Verify Admin User (Requires JWT Authentication)

```
GET /wp-json/seopress/v1/verify-admin
Authorization: Bearer {jwt_token}
```

Returns admin status and user information for authenticated users.

**Response:**
```json
{
  "is_admin": true,
  "can_edit_posts": true,
  "user_id": 1,
  "user_email": "admin@example.com",
  "user_roles": ["administrator"],
  "display_name": "Admin User"
}
```

### 5. Get Edit URL (Admin Only)

```
GET /wp-json/seopress/v1/edit-url/{post_id}
Authorization: Bearer {jwt_token}
```

Returns the WordPress admin edit URL for the specified post. Used by the headless frontend to open the WordPress editor in an iframe.

**Response:**
```json
{
  "success": true,
  "post_id": 123,
  "post_type": "post",
  "post_title": "My Blog Post",
  "edit_url": "https://example.com/wp-admin/post.php?post=123&action=edit",
  "admin_url": "https://example.com/wp-admin/"
}
```

**Permissions:** Requires `edit_posts` or `manage_options` capability.

### 6. Update SEO Data (Admin Only) - Programmatic API

```
POST /wp-json/seopress/v1/update/{post_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "Custom SEO Title",
  "description": "Custom meta description",
  "canonical": "https://example.com/custom-url",
  "robots": {
    "noindex": false,
    "nofollow": false,
    "noarchive": false,
    "nosnippet": false,
    "noimageindex": false
  },
  "og_title": "Custom OG Title",
  "og_description": "Custom OG Description",
  "og_image": "https://example.com/image.jpg",
  "twitter_title": "Custom Twitter Title",
  "twitter_description": "Custom Twitter Description",
  "twitter_image": "https://example.com/twitter-image.jpg"
}
```

**Note:** This endpoint is available for programmatic updates but is not used by the default floating SEO button implementation (which uses iframe-based editing instead).

**Permissions:** Requires `edit_posts` or `manage_options` capability.

## Usage in Next.js

See the Next.js integration documentation in your frontend codebase.

## JWT Authentication Setup (For Admin Features)

To use admin verification and SEO update features, install and configure JWT Authentication:

1. Install **JWT Authentication for WP REST API** plugin
2. Add to your `wp-config.php`:

```php
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

3. Add to your `.htaccess`:

```apache
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
```

## Requirements

- WordPress 5.0 or higher
- SEOPress plugin (free or pro)
- PHP 7.4 or higher
- JWT Authentication plugin (for admin features only)

## Support

For support, please contact the development team.

