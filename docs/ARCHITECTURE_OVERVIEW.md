# Le Bake Stories - Architecture Overview

**Visual Guide to System Architecture**

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │   Shop     │  │    Cart    │  │  Checkout  │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS FRONTEND (Port 3000)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Components (50+)                                  │  │
│  │  - WoodMart Theme Components                             │  │
│  │  - shadcn/ui Components                                  │  │
│  │  - Page Components                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Contexts (State Management)                       │  │
│  │  - CartContext          - AuthContext                    │  │
│  │  - WishlistContext      - WooCommerceContext             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes (30+ endpoints)                              │  │
│  │  /api/products, /api/cart, /api/orders, etc.            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Business Logic                                          │  │
│  │  - woocommerce-api.ts (1849 lines)                       │  │
│  │  - cache-service.ts (870 lines)                          │  │
│  │  - api.ts (WordPress integration)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CACHE LAYER (.next/cache)                    │
│  - Products Cache (60 min)                                      │
│  - Categories Cache (60 min)                                    │
│  - Posts Cache (60 min)                                         │
│  - Site Info Cache (60 min)                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WORDPRESS BACKEND (CMS)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WordPress Core + WooCommerce                            │  │
│  │  - Products, Orders, Customers                           │  │
│  │  - Posts, Pages, Media                                   │  │
│  │  - Custom Post Types (Banners, Testimonials)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Custom Plugins (5)                                      │  │
│  │  - headless-image-optimizer                              │  │
│  │  - headless-stripe-integration                           │  │
│  │  - headless-paypal-integration                           │  │
│  │  - headless-wordpress-helper                             │  │
│  │  - hero-banners                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REST APIs                                               │  │
│  │  - WordPress REST API (wp/v2)                            │  │
│  │  - WooCommerce REST API (wc/v3)                          │  │
│  │  - Custom Endpoints                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                         MYSQL DATABASE                          │
│  - WordPress Tables (wp_posts, wp_users, etc.)                 │
│  - WooCommerce Tables (wc_order_items, etc.)                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   AWS S3    │  │ CloudFront  │  │   Stripe    │            │
│  │   Images    │  │     CDN     │  │  Payments   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   PayPal    │  │ Cloudflare  │                              │
│  │  Payments   │  │  (Pending)  │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Product Browsing Flow

```
User Opens Shop Page
        ↓
Next.js Server Component
        ↓
Check Cache (cache-service.ts)
        ↓
┌───────┴────────┐
│ Cache Hit?     │
└───────┬────────┘
        │
   ┌────┴────┐
   │   YES   │              NO
   │         │              │
   ↓         └──────────────┤
Return        │              │
Cached        │              ↓
Products      │       /api/products
              │              ↓
              │       woocommerce-api.ts
              │              ↓
              │       WooCommerce REST API
              │              ↓
              │       WordPress/MySQL
              │              ↓
              │       Return Products
              │              ↓
              └──────> Cache Result
                            ↓
                      Render Shop Page
                            ↓
                      User Sees Products
```

### 2. Add to Cart Flow (Guest User)

```
User Clicks "Add to Cart"
        ↓
CartContext.addToCart()
        ↓
Check if Guest or Authenticated
        ↓
┌───────┴────────┐
│    Guest User? │
└───────┬────────┘
        │
   ┌────┴────┐
   │   YES   │              NO (Authenticated)
   │         │              │
   ↓         │              ↓
Store in     │         /api/cart
localStorage │              ↓
(cart-key)   │         WooCommerce Session API
        │    │              ↓
        │    │         WordPress Database
        │    │              │
        ↓    │              │
Update       │              │
UI State     │              │
        │    └──────────────┘
        ↓
Cart Drawer Opens
        ↓
User Sees Updated Cart
```

### 3. Checkout & Payment Flow

```
User Proceeds to Checkout
        ↓
Checkout Page Loads
        ↓
User Fills Billing/Shipping Forms
        ↓
User Selects Payment Method
        ↓
┌───────────────┴─────────────┐
│   Stripe    or    PayPal    │
└───────────────┬─────────────┘
                │
        ┌───────┴────────┐
        │                │
        ↓                ↓
   Stripe API      PayPal API
        │                │
        ↓                ↓
   Create Payment   Create Order
   Intent               │
        │                ↓
        ↓           Capture Payment
   Confirm Payment      │
        │                │
        └────────┬───────┘
                 ↓
        /api/orders (Create Order)
                 ↓
        woocommerce-api.ts
                 ↓
        WooCommerce REST API
                 ↓
        WordPress (Create Order)
                 ↓
        MySQL (Store Order)
                 ↓
        Update Order Status
                 ↓
        Send Confirmation Email
                 ↓
        Redirect to Order Confirmation
                 ↓
        User Sees Order Details
```

### 4. Elementor Page Rendering Flow

```
User Visits /about
        ↓
About Page Component
        ↓
/api/pages?slug=about
        ↓
WordPress REST API
        ↓
Get Page Data (HTML Content)
        ↓
ElementorStylesLoader Component
        ↓
/api/elementor-css?pageId=123
        ↓
Fetch WordPress Page HTML
        ↓
Extract Elementor CSS URLs
        ↓
Return CSS File Paths
        ↓
Load CSS Files in Browser
        ↓
ContentRenderer Component
        ↓
Sanitize HTML Content
        │
        ├─ Remove <script> tags
        ├─ Remove event handlers
        ├─ Fix image URLs
        └─ Preserve Elementor classes
        ↓
Render HTML with dangerouslySetInnerHTML
        ↓
Apply Elementor Styles
        ↓
User Sees Styled Page
        
⚠️ ISSUE: JavaScript widgets don't initialize
    (animations, sliders, tabs, etc.)
    
✅ SOLUTION: Server-side rendering (pending)
```

### 5. Cache Invalidation Flow

```
Content Updated in WordPress
        ↓
WooCommerce/WordPress Webhook Fired
        ↓
/api/webhooks/woocommerce
        ↓
Verify Webhook Signature
        ↓
Identify Changed Resource
        │
        ├─ Product Updated → Clear products cache
        ├─ Order Created → Clear orders cache
        ├─ Post Updated → Clear posts cache
        └─ Category Updated → Clear categories cache
        ↓
Cache Files Deleted
        ↓
Next Request Fetches Fresh Data
        ↓
New Data Cached
        ↓
Users See Updated Content
```

---

## 📦 Component Hierarchy

### Shop Page Component Tree

```
<ShopPage>
  │
  ├─ <ProductFilters>
  │   ├─ <CategoryFilter>
  │   ├─ <PriceFilter>
  │   └─ <AttributeFilters>
  │
  ├─ <ProductGrid>
  │   └─ <ProductCard> (x12)
  │       ├─ <ProductImage>
  │       ├─ <ProductInfo>
  │       │   ├─ <ProductTitle>
  │       │   ├─ <ProductPrice>
  │       │   └─ <ProductRating>
  │       ├─ <AddToCartButton>
  │       └─ <WishlistButton>
  │
  └─ <Pagination>
```

### Cart Page Component Tree

```
<CartPage>
  │
  ├─ <CartItemsList>
  │   └─ <CartItem> (x N items)
  │       ├─ <ProductImage>
  │       ├─ <ProductInfo>
  │       ├─ <QuantitySelector>
  │       │   ├─ <DecrementButton>
  │       │   ├─ <QuantityInput>
  │       │   └─ <IncrementButton>
  │       ├─ <ItemPrice>
  │       └─ <RemoveButton>
  │
  ├─ <CouponInput>
  │   ├─ <Input>
  │   └─ <ApplyButton>
  │
  └─ <CartTotals>
      ├─ <Subtotal>
      ├─ <ShippingCost>
      ├─ <TaxAmount>
      ├─ <DiscountAmount>
      ├─ <Total>
      └─ <CheckoutButton>
```

### Checkout Page Component Tree

```
<CheckoutPage>
  │
  ├─ <BillingForm>
  │   ├─ <Input: First Name>
  │   ├─ <Input: Last Name>
  │   ├─ <Input: Email>
  │   ├─ <Input: Phone>
  │   ├─ <Input: Address>
  │   ├─ <Input: City>
  │   ├─ <Input: State>
  │   └─ <Input: Zip Code>
  │
  ├─ <ShippingForm> (if different from billing)
  │   └─ [Same fields as billing]
  │
  ├─ <PaymentMethodSelector>
  │   ├─ <RadioButton: Stripe>
  │   └─ <RadioButton: PayPal>
  │
  ├─ <PaymentForm>
  │   ├─ <StripePaymentForm> (if Stripe selected)
  │   │   ├─ <CardElement>
  │   │   └─ <PayButton>
  │   │
  │   └─ <PayPalPaymentForm> (if PayPal selected)
  │       └─ <PayPalButtons>
  │
  └─ <OrderReview>
      ├─ <OrderItems>
      ├─ <OrderTotals>
      └─ <PlaceOrderButton>
```

---

## 🗂️ File Structure

```
le_bake_stories/
│
├── 📁 src/
│   │
│   ├── 📁 app/                          # Next.js 14 App Router
│   │   ├── 📄 layout.tsx                # Root layout
│   │   ├── 📄 page.tsx                  # Home page
│   │   │
│   │   ├── 📁 api/                      # API Routes (30+ endpoints)
│   │   │   ├── 📁 products/
│   │   │   │   └── 📄 route.ts          # GET /api/products
│   │   │   ├── 📁 cart/
│   │   │   │   └── 📄 route.ts          # GET/POST /api/cart
│   │   │   ├── 📁 orders/
│   │   │   │   └── 📄 route.ts          # GET/POST /api/orders
│   │   │   ├── 📁 stripe/
│   │   │   │   ├── 📄 create-payment-intent/
│   │   │   │   └── 📄 confirm-payment/
│   │   │   └── ...
│   │   │
│   │   ├── 📁 shop/
│   │   │   └── 📄 page.tsx              # Shop page
│   │   ├── 📁 cart/
│   │   │   └── 📄 page.tsx              # Cart page
│   │   ├── 📁 checkout/
│   │   │   └── 📄 page.tsx              # Checkout page
│   │   ├── 📁 product/[slug]/
│   │   │   └── 📄 page.tsx              # Single product
│   │   ├── 📁 login/
│   │   │   └── 📄 page.tsx              # Login page
│   │   ├── 📁 register/
│   │   │   └── 📄 page.tsx              # Register page
│   │   ├── 📁 my-account/
│   │   │   └── 📄 page.tsx              # Account dashboard
│   │   ├── 📁 about/
│   │   │   └── 📄 page.tsx              # About (Elementor)
│   │   └── 📁 blog/
│   │       ├── 📄 page.tsx              # Blog listing
│   │       └── 📁 [slug]/
│   │           └── 📄 page.tsx          # Single post
│   │
│   ├── 📁 components/
│   │   │
│   │   ├── 📁 themes/                   # WoodMart Theme Components
│   │   │   ├── 📄 header.tsx            # Site header
│   │   │   ├── 📄 footer.tsx            # Site footer
│   │   │   ├── 📄 client-layout.tsx     # Main layout wrapper
│   │   │   ├── 📄 product-card.tsx      # Product display
│   │   │   ├── 📄 product-grid.tsx      # Product grid
│   │   │   ├── 📄 shop-page.tsx         # Shop page logic
│   │   │   ├── 📄 cart-page.tsx         # Cart page logic
│   │   │   ├── 📄 checkout-page.tsx     # Checkout logic
│   │   │   ├── 📄 cart-drawer.tsx       # Slide-out cart
│   │   │   ├── 📄 hero-banner.tsx       # Hero slider
│   │   │   ├── 📄 blog-card.tsx         # Blog post card
│   │   │   └── ...
│   │   │
│   │   ├── 📁 ui/                       # shadcn/ui Components
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   └── ... (25+ components)
│   │   │
│   │   ├── 📄 StripePaymentForm.tsx     # Stripe integration
│   │   ├── 📄 PayPalPaymentForm.tsx     # PayPal integration
│   │   └── 📄 ContactForm.tsx           # Contact form
│   │
│   ├── 📁 contexts/                     # React Contexts
│   │   ├── 📄 cart-context.tsx          # 🔥 Cart state (complex)
│   │   ├── 📄 auth-context.tsx          # Auth state
│   │   ├── 📄 wishlist-context.tsx      # Wishlist state
│   │   └── 📄 woocommerce-context.tsx   # WC connection
│   │
│   ├── 📁 lib/                          # Business Logic
│   │   ├── 📄 woocommerce-api.ts        # 🔥 WooCommerce (1849 lines)
│   │   ├── 📄 api.ts                    # WordPress API
│   │   ├── 📄 cache-service.ts          # 🔥 Caching (870 lines)
│   │   ├── 📄 stripe-service.ts         # Stripe logic
│   │   ├── 📄 paypal-service.ts         # PayPal logic
│   │   ├── 📄 image-cache-service.ts    # Image caching
│   │   ├── 📄 cart-persistence.ts       # Cart storage
│   │   └── 📄 utils.ts                  # Utilities
│   │
│   ├── 📁 types/
│   │   └── 📄 index.ts                  # 🔥 TypeScript types (800+ lines)
│   │
│   └── 📁 styles/
│       └── 📄 globals.css               # Global styles + Tailwind
│
├── 📁 wordpress-plugin/                 # Custom WordPress Plugins
│   ├── 📁 headless-image-optimizer/     # S3/CloudFront images
│   ├── 📁 headless-stripe-integration/  # Stripe backend
│   ├── 📁 headless-paypal-integration/  # PayPal backend
│   ├── 📁 headless-wordpress-helper/    # CORS, helpers
│   └── 📁 hero-banners/                 # Custom banners CPT
│
├── 📁 docs/                             # Documentation (200+ pages)
│   ├── 📄 README.md                     # Documentation hub
│   ├── 📄 EXECUTIVE_SUMMARY.md          # Quick overview
│   ├── 📄 COMPREHENSIVE_PROJECT_REPORT.md # Full analysis (70 pages)
│   ├── 📄 IMPLEMENTATION_TODO.md        # Task list
│   ├── 📄 QUICK_START_GUIDE.md          # Getting started
│   ├── 📄 ARCHITECTURE_OVERVIEW.md      # This file
│   ├── 📄 WOOCOMMERCE_SETUP.md          # eCommerce setup
│   └── 📄 wordpress-setup.md            # WordPress setup
│
├── 📁 public/                           # Static assets
│   ├── 📄 favicon.svg
│   ├── 📄 manifest.json
│   └── 📄 categories.json
│
├── 📁 scripts/
│   └── 📄 cache-manager.js              # Cache CLI tool
│
├── 📄 next.config.js                    # Next.js configuration
├── 📄 tailwind.config.js                # Tailwind configuration
├── 📄 tsconfig.json                     # TypeScript configuration
├── 📄 package.json                      # Dependencies
└── 📄 README.md                         # Project README
```

---

## 🔐 Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Security Layers                         │
└────────────────────────────────────────────────────────────┘

Layer 1: Network Security
  ├─ HTTPS (SSL/TLS)
  ├─ CORS Configuration
  ├─ Security Headers (X-Frame-Options, CSP, etc.)
  └─ Cloudflare WAF (pending)

Layer 2: Authentication
  ├─ JWT Tokens (WordPress)
  ├─ Token Expiry (24 hours)
  ├─ Secure Token Storage (httpOnly cookies)
  └─ Password Hashing (WordPress bcrypt)

Layer 3: Input Validation
  ├─ Form Validation (React Hook Form + Zod)
  ├─ XSS Prevention (HTML sanitization)
  ├─ SQL Injection Prevention (WordPress prepared statements)
  └─ CSRF Protection (WordPress nonces)

Layer 4: API Security
  ├─ WooCommerce API Keys (Consumer Key/Secret)
  ├─ Basic Auth over HTTPS
  ├─ Rate Limiting (pending)
  └─ Webhook Signature Verification

Layer 5: Payment Security
  ├─ PCI Compliance (Stripe handles cards)
  ├─ No card data stored
  ├─ Stripe.js (client-side tokenization)
  └─ PayPal hosted checkout

Layer 6: Data Security
  ├─ Environment Variables (.env.local)
  ├─ Secrets not in code
  ├─ WordPress user roles & capabilities
  └─ Database encryption (WordPress)
```

---

## ⚡ Performance Architecture

```
┌────────────────────────────────────────────────────────────┐
│                 Performance Optimizations                  │
└────────────────────────────────────────────────────────────┘

1. Server-Side Rendering (SSR)
   ├─ Initial HTML generated on server
   ├─ Fast Time to First Byte (TTFB)
   └─ SEO friendly

2. Static Site Generation (SSG)
   ├─ Pre-render pages at build time
   ├─ Ultra-fast page loads
   └─ Reduced server load

3. Incremental Static Regeneration (ISR)
   ├─ Update static pages without rebuilding
   ├─ Best of SSR + SSG
   └─ Revalidate on demand

4. Client-Side Caching
   ├─ localStorage (cart, wishlist)
   ├─ sessionStorage (temporary data)
   └─ IndexedDB (future)

5. Server-Side Caching
   ├─ File-based cache (.next/cache)
   ├─ 60-minute expiry
   ├─ Checksum validation
   └─ Selective invalidation

6. Image Optimization
   ├─ Next.js Image component
   ├─ Lazy loading
   ├─ Responsive images
   ├─ WebP format (future)
   └─ CDN delivery (S3 + CloudFront)

7. Code Splitting
   ├─ Automatic by Next.js
   ├─ Route-based splitting
   ├─ Component-level lazy loading
   └─ Dynamic imports

8. Asset Optimization
   ├─ Minified CSS/JS
   ├─ Font optimization
   ├─ Tree shaking
   └─ Brotli compression (pending)

9. CDN Strategy
   ├─ Static assets on CDN (pending)
   ├─ Images on CloudFront
   ├─ Edge caching (Cloudflare pending)
   └─ Global distribution
```

---

## 🔄 State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  React Context Architecture                 │
└─────────────────────────────────────────────────────────────┘

<App>
  │
  └─ <ThemeProvider> (next-themes)
      │
      └─ <Providers> (custom wrapper)
          │
          ├─ <WooCommerceProvider>
          │   │
          │   ├─ State:
          │   │   ├─ isConnected
          │   │   ├─ hasError
          │   │   └─ status
          │   │
          │   └─ Methods:
          │       ├─ checkConnection()
          │       └─ retryConnection()
          │
          ├─ <AuthProvider>
          │   │
          │   ├─ State:
          │   │   ├─ user
          │   │   ├─ isAuthenticated
          │   │   ├─ token
          │   │   └─ loading
          │   │
          │   └─ Methods:
          │       ├─ login()
          │       ├─ logout()
          │       ├─ register()
          │       └─ updateUser()
          │
          ├─ <CartProvider>
          │   │
          │   ├─ State:
          │   │   ├─ cart
          │   │   │   ├─ items[]
          │   │   │   ├─ totals
          │   │   │   └─ coupons[]
          │   │   ├─ loading
          │   │   └─ error
          │   │
          │   └─ Methods:
          │       ├─ addToCart()
          │       ├─ removeFromCart()
          │       ├─ updateQuantity()
          │       ├─ applyCoupon()
          │       ├─ removeCoupon()
          │       └─ clearCart()
          │
          └─ <WishlistProvider>
              │
              ├─ State:
              │   ├─ items[]
              │   └─ loading
              │
              └─ Methods:
                  ├─ addToWishlist()
                  ├─ removeFromWishlist()
                  ├─ clearWishlist()
                  └─ isInWishlist()
```

---

## 🔌 API Integration Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              API Integration Layers                          │
└──────────────────────────────────────────────────────────────┘

Frontend Components
        ↓
React Hooks (useState, useEffect, useSWR)
        ↓
API Routes (/src/app/api/*)
        ↓
API Clients (/src/lib/*)
        │
        ├─ woocommerce-api.ts
        │   │
        │   ├─ Products API
        │   │   ├─ getProducts()
        │   │   ├─ getProductBySlug()
        │   │   ├─ searchProducts()
        │   │   └─ getFeaturedProducts()
        │   │
        │   ├─ Cart API
        │   │   ├─ getCart()
        │   │   ├─ addToCart()
        │   │   ├─ updateCart()
        │   │   └─ removeFromCart()
        │   │
        │   ├─ Orders API
        │   │   ├─ createOrder()
        │   │   ├─ getOrders()
        │   │   └─ getOrder()
        │   │
        │   ├─ Customers API
        │   │   ├─ createCustomer()
        │   │   ├─ getCustomer()
        │   │   └─ updateCustomer()
        │   │
        │   └─ Coupons API
        │       ├─ validateCoupon()
        │       └─ applyCoupon()
        │
        └─ api.ts (WordPress)
            │
            ├─ Posts API
            │   ├─ getPosts()
            │   └─ getPost()
            │
            ├─ Pages API
            │   ├─ getPages()
            │   └─ getPage()
            │
            ├─ Media API
            │   └─ getMedia()
            │
            └─ Menus API
                └─ getMenu()
        ↓
Cache Layer (cache-service.ts)
        ↓
REST APIs (WordPress/WooCommerce)
        ↓
WordPress Backend
        ↓
MySQL Database
```

---

## 📊 Database Schema (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                     WordPress Tables                         │
└─────────────────────────────────────────────────────────────┘

wp_posts
  ├─ ID (primary key)
  ├─ post_author
  ├─ post_date
  ├─ post_content
  ├─ post_title
  ├─ post_status (publish, draft, etc.)
  ├─ post_type (post, page, product, etc.)
  └─ post_name (slug)

wp_postmeta
  ├─ meta_id (primary key)
  ├─ post_id (foreign key → wp_posts.ID)
  ├─ meta_key (e.g., _price, _stock, etc.)
  └─ meta_value

wp_users
  ├─ ID (primary key)
  ├─ user_login
  ├─ user_pass (hashed)
  ├─ user_email
  ├─ user_nicename
  └─ display_name

wp_usermeta
  ├─ umeta_id (primary key)
  ├─ user_id (foreign key → wp_users.ID)
  ├─ meta_key
  └─ meta_value

wp_terms
  ├─ term_id (primary key)
  ├─ name (category name)
  └─ slug

wp_term_taxonomy
  ├─ term_taxonomy_id (primary key)
  ├─ term_id (foreign key → wp_terms.term_id)
  ├─ taxonomy (product_cat, post_tag, etc.)
  └─ parent

┌─────────────────────────────────────────────────────────────┐
│                   WooCommerce Tables                        │
└─────────────────────────────────────────────────────────────┘

wc_order_items
  ├─ order_item_id (primary key)
  ├─ order_item_name (product name)
  ├─ order_item_type (line_item, shipping, etc.)
  └─ order_id (foreign key → wp_posts.ID)

wc_order_itemmeta
  ├─ meta_id (primary key)
  ├─ order_item_id (foreign key → wc_order_items)
  ├─ meta_key (_qty, _line_total, etc.)
  └─ meta_value

wc_product_meta_lookup
  ├─ product_id (primary key)
  ├─ sku
  ├─ price
  ├─ stock_quantity
  └─ stock_status

wc_download_log
wc_webhooks
wc_sessions (guest cart data)
```

---

## 🎯 Critical Paths

### Most Important Code Files

**Rank 1 - Mission Critical** (Don't break these!)
1. `/src/lib/woocommerce-api.ts` (1849 lines) - All WooCommerce logic
2. `/src/contexts/cart-context.tsx` - Cart state management
3. `/src/lib/cache-service.ts` (870 lines) - Caching system

**Rank 2 - Very Important**
4. `/src/components/themes/checkout-page.tsx` - Checkout flow
5. `/src/components/themes/shop-page.tsx` - Product browsing
6. `/src/app/api/orders/route.ts` - Order creation
7. `/src/contexts/auth-context.tsx` - Authentication

**Rank 3 - Important**
8. `/src/components/themes/header.tsx` - Site navigation
9. `/src/components/StripePaymentForm.tsx` - Stripe payments
10. `/src/types/index.ts` - Type definitions

### Most Important WordPress Plugins

**Rank 1 - Essential**
1. WooCommerce - Core eCommerce
2. JWT Authentication - API auth
3. headless-stripe-integration - Payments

**Rank 2 - Very Important**
4. headless-wordpress-helper - CORS, helpers
5. headless-image-optimizer - Image delivery

**Rank 3 - Important**
6. headless-paypal-integration - Alternative payments
7. hero-banners - Homepage banners

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Production Setup                       │
└────────────────────────────────────────────────────────────┘

Development Environment
  ├─ localhost:3000 (Next.js)
  ├─ manila.esdemo.in (WordPress)
  └─ Test payment credentials

        ↓ npm run build

Production Build
  ├─ Optimized bundles
  ├─ Static assets
  └─ Server components

        ↓ Deploy

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Vercel     │◄───────│  CloudFront  │◄───────│     S3       │
│ (Next.js App)│        │     (CDN)    │        │   (Images)   │
└──────┬───────┘        └──────────────┘        └──────────────┘
       │
       │ API Calls
       │
       ↓
┌──────────────┐
│  WordPress   │
│  + MySQL     │
│  (Backend)   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Cloudflare  │
│ (CDN + WAF)  │
│  (Pending)   │
└──────────────┘

External Services:
  ├─ Stripe API (payments)
  ├─ PayPal API (payments)
  ├─ Google Analytics (tracking)
  └─ SendGrid (emails, optional)
```

---

## 🎯 Key Takeaways

### Architecture Strengths
✅ Clean separation of concerns
✅ Type-safe with TypeScript
✅ Scalable cache system
✅ Modular component design
✅ Security-first approach
✅ Performance optimized

### Areas for Improvement
⚠️ Elementor JS widgets (hardest part)
⚠️ SEO plugin integration
⚠️ Cloudflare migration
⚠️ Rate limiting
⚠️ Error monitoring (Sentry)

### Best Practices Followed
✅ React best practices
✅ Next.js patterns
✅ TypeScript strict mode
✅ Error boundaries
✅ Loading states
✅ Responsive design
✅ Accessibility basics

---

**For More Details**:
- Full analysis: [COMPREHENSIVE_PROJECT_REPORT.md](./COMPREHENSIVE_PROJECT_REPORT.md)
- Quick start: [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)
- TODO list: [IMPLEMENTATION_TODO.md](./IMPLEMENTATION_TODO.md)

---

*Last Updated: November 17, 2025*




