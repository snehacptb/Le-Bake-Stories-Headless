# Floating "Edit SEO" Button - Implementation Guide

## Overview

The floating "Edit SEO" button provides a WordPress-like admin experience for your headless Next.js site. When clicked, it opens the WordPress post editor in an iframe modal, allowing admins to edit SEO metadata directly in WordPress with SEOPress.

## Features

✅ **WordPress-Style Interface**: Opens actual WordPress editor in an iframe
✅ **Admin-Only Visibility**: Only shows for authenticated WordPress admins
✅ **Auto-Reload**: Page reloads after editing to show updated SEO data
✅ **Context-Aware**: Detects current post/page/product automatically
✅ **Secure**: Uses JWT authentication to verify admin status

## How It Works

### User Flow

1. **Admin logs in** to the Next.js site (using WordPress credentials)
2. **Floating button appears** in bottom-right corner (only for admins)
3. **Click "Edit SEO"** button
4. **Modal opens** with iframe loading WordPress post editor
5. **Scroll to SEOPress metabox** in the editor
6. **Edit SEO metadata** (title, description, Open Graph, etc.)
7. **Save in WordPress** (click "Update" or "Publish")
8. **Click "Done Editing"** → Modal closes → Page reloads with fresh data

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AdminPanelWrapper (in Providers)                    │  │
│  │  • Detects current URL                               │  │
│  │  • Fetches post ID from WordPress API                │  │
│  │  • Passes data to FloatingSEOPanel                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FloatingSEOPanel Component                          │  │
│  │  • Shows floating button                             │  │
│  │  • Opens modal with iframe on click                  │  │
│  │  • Loads: /wp-admin/post.php?post=ID&action=edit     │  │
│  │  • Reloads page after editing                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↓
                      JWT Authentication
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    WordPress Backend                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SEOPress Headless API Plugin                        │  │
│  │  • /wp-json/seopress/v1/verify-admin                 │  │
│  │    → Verifies user is admin                          │  │
│  │  • /wp-json/seopress/v1/edit-url/{post_id}           │  │
│  │    → Returns WordPress edit URL                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WordPress Post Editor                               │  │
│  │  • Standard WP editor with SEOPress metabox          │  │
│  │  • Admin edits SEO directly in WordPress             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. FloatingSEOPanel (`src/components/admin/floating-seo-panel.tsx`)

**Purpose**: Displays the floating button and iframe modal

**Key Features**:
- Shows only for authenticated admins
- Opens WordPress editor in iframe
- Handles modal open/close
- Reloads page after editing

**Props**:
```typescript
interface FloatingSEOPanelProps {
  postId?: number          // WordPress post ID
  postSlug?: string        // Post slug (for fallback)
  postType?: 'post' | 'page' | 'product'
}
```

### 2. AdminPanelWrapper (`src/components/admin/admin-panel-wrapper.tsx`)

**Purpose**: Wraps FloatingSEOPanel and provides context

**Key Features**:
- Detects current URL and post type
- Fetches post ID from WordPress API
- Only renders on client (prevents hydration issues)
- Integrated in Providers component

### 3. useAdminAuth Hook (`src/hooks/use-admin-auth.ts`)

**Purpose**: Checks admin authentication status

**Returns**:
```typescript
{
  isAdmin: boolean
  canEditPosts: boolean
  isLoading: boolean
  error: string | null
  userId?: number
  userRoles?: string[]
  displayName?: string
}
```

## Installation & Setup

### 1. WordPress Plugin Setup

1. **Install SEOPress Headless API Plugin**:
   - Upload `wordpress-plugin/seopress-headless-api/` to `/wp-content/plugins/`
   - Activate the plugin

2. **Install JWT Authentication Plugin**:
   ```bash
   # Install via WordPress admin or upload manually
   # Plugin: JWT Authentication for WP REST API
   ```

3. **Configure JWT in `wp-config.php`**:
   ```php
   define('JWT_AUTH_SECRET_KEY', 'your-super-secret-key-here');
   define('JWT_AUTH_CORS_ENABLE', true);
   ```

4. **Update `.htaccess`** (if using Apache):
   ```apache
   RewriteCond %{HTTP:Authorization} ^(.*)
   RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
   ```

### 2. Next.js Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2
WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2
```

### 3. Integration (Already Done)

The floating button is already integrated in your app via the `Providers` component:

```typescript
// src/components/providers.tsx
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <WooCommerceProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <AdminPanelWrapper /> {/* ← Floating SEO button */}
          </WishlistProvider>
        </CartProvider>
      </WooCommerceProvider>
    </AuthProvider>
  )
}
```

## API Endpoints

### WordPress REST API Endpoints

#### 1. Verify Admin
```
GET /wp-json/seopress/v1/verify-admin
Authorization: Bearer {jwt_token}
```

**Response**:
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

#### 2. Get Edit URL (Optional)
```
GET /wp-json/seopress/v1/edit-url/{post_id}
Authorization: Bearer {jwt_token}
```

**Response**:
```json
{
  "success": true,
  "post_id": 123,
  "post_type": "post",
  "post_title": "My Blog Post",
  "edit_url": "https://your-site.com/wp-admin/post.php?post=123&action=edit",
  "admin_url": "https://your-site.com/wp-admin/"
}
```

### Next.js API Endpoint

#### Admin Verification Proxy
```
GET /api/admin/verify
Authorization: Bearer {jwt_token}
```

Proxies to WordPress and returns admin status.

## Security

### Authentication Flow

1. User logs in via Next.js frontend
2. JWT token stored in `localStorage` as `wc-auth-token`
3. Token sent with all admin API requests
4. WordPress verifies token and user permissions
5. Only users with `manage_options` or `edit_posts` capability can access

### Iframe Security

The iframe uses the `sandbox` attribute with specific permissions:
```typescript
sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
```

This allows:
- ✅ WordPress editor functionality
- ✅ Form submissions
- ✅ Media uploader popups
- ❌ Top-level navigation
- ❌ Malicious scripts

## Customization

### Change Button Position

Edit `src/components/admin/floating-seo-panel.tsx`:

```typescript
// Current: bottom-6 right-6
<button className="fixed bottom-6 right-6 z-50 ...">

// Example: top-right
<button className="fixed top-6 right-6 z-50 ...">

// Example: left side
<button className="fixed bottom-6 left-6 z-50 ...">
```

### Change Button Style

```typescript
// Current gradient
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Solid color
className="bg-blue-600"

// Different colors
className="bg-gradient-to-r from-green-600 to-teal-600"
```

### Customize URL Detection

Edit `src/components/admin/admin-panel-wrapper.tsx`:

```typescript
// Add custom URL patterns
if (pathParts[0] === 'custom-post-type' && pathParts.length > 1) {
  postSlug = pathParts[1]
  postType = 'page' // or your custom post type
}
```

### Disable Auto-Reload

Edit `src/components/admin/floating-seo-panel.tsx`:

```typescript
const handleCloseModal = () => {
  setIsModalOpen(false)
  setEditUrl(null)
  setError(null)
  
  // Comment out or remove this to disable auto-reload
  // setTimeout(() => {
  //   window.location.reload()
  // }, 300)
}
```

## Troubleshooting

### Button Not Showing

1. **Check if user is logged in**:
   - User must be authenticated with WordPress credentials
   - JWT token must be in localStorage

2. **Check admin permissions**:
   - User must have `administrator` or `editor` role
   - Check browser console for authentication errors

3. **Check post detection**:
   - Button only shows on post/page/product pages
   - Check URL matches patterns in `admin-panel-wrapper.tsx`

### Iframe Not Loading

1. **Check WordPress URL**:
   - Verify `NEXT_PUBLIC_WORDPRESS_API_URL` in `.env.local`
   - Try accessing the URL directly in browser

2. **Check CORS settings**:
   - WordPress must allow iframe embedding
   - Check `X-Frame-Options` header

3. **Check authentication**:
   - JWT token must be valid
   - User must have edit permissions

### Changes Not Showing After Save

1. **Check cache**:
   - Clear browser cache
   - Check if WordPress caching is enabled
   - Verify Next.js cache settings

2. **Manual reload**:
   - Try refreshing the page manually
   - Check browser console for errors

## Development vs Production

### Development Mode

- SEODebugPanel shows in development (if added to pages)
- More verbose error messages
- Hot reload may interfere with iframe

### Production Mode

- Admin panel only shows for authenticated admins
- No debug panels
- Optimized performance

## Best Practices

1. **Always use HTTPS** in production for secure JWT transmission
2. **Keep JWT secret secure** - never commit to version control
3. **Set short JWT expiration** (e.g., 24 hours) for security
4. **Test with different user roles** to ensure proper permissions
5. **Monitor WordPress admin access logs** for security

## Testing Checklist

- [ ] Button appears for admin users
- [ ] Button hidden for non-admin users
- [ ] Button hidden for logged-out users
- [ ] Modal opens on click
- [ ] Iframe loads WordPress editor
- [ ] Can edit SEO in WordPress
- [ ] Changes save in WordPress
- [ ] Page reloads after closing modal
- [ ] Updated SEO data appears on page
- [ ] Works on post pages
- [ ] Works on product pages
- [ ] Works on custom pages
- [ ] Mobile responsive
- [ ] No console errors

## Support

For issues or questions:
1. Check WordPress error logs
2. Check browser console for JavaScript errors
3. Verify JWT token is valid
4. Test WordPress REST API endpoints directly
5. Check SEOPress plugin is active and configured

## License

Part of Le Bake Stories headless WordPress implementation.


