# Le Bake Stories - Quick Start Guide

**For Developers Taking Over or Continuing This Project**

---

## 🚀 Getting Started in 5 Minutes

### 1. Clone & Install
```bash
git clone <repo-url>
cd le_bake_stories
npm install
```

### 2. Environment Setup
Create `.env.local` with:
```bash
# WordPress
NEXT_PUBLIC_WORDPRESS_URL=https://manila.esdemo.in
NEXT_PUBLIC_WORDPRESS_API_URL=https://manila.esdemo.in/wp-json/wp/v2

# WooCommerce
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_xxxxx
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_xxxxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxx
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## 📁 Project Structure (Where to Find Things)

```
le_bake_stories/
│
├── 📄 DOCUMENTATION (Start Here!)
│   ├── docs/EXECUTIVE_SUMMARY.md          ← 📊 Quick overview
│   ├── docs/COMPREHENSIVE_PROJECT_REPORT.md ← 📖 Full analysis (70 pages)
│   ├── docs/IMPLEMENTATION_TODO.md        ← ✅ What needs to be done
│   └── docs/QUICK_START_GUIDE.md          ← 🚀 You are here
│
├── 🎨 FRONTEND
│   ├── src/app/                           ← Pages (Next.js App Router)
│   │   ├── page.tsx                       ← Home page
│   │   ├── shop/                          ← Shop page
│   │   ├── cart/                          ← Cart page
│   │   ├── checkout/                      ← Checkout page
│   │   ├── product/[slug]/                ← Product pages
│   │   ├── about/                         ← About (Elementor)
│   │   ├── login/                         ← Auth pages
│   │   └── api/                           ← API routes (30+ endpoints)
│   │
│   ├── src/components/
│   │   ├── themes/                        ← WoodMart components (22 files)
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── product-card.tsx
│   │   │   ├── cart-page.tsx
│   │   │   └── ...
│   │   └── ui/                            ← shadcn/ui components (25+)
│   │
│   ├── src/contexts/                      ← State management
│   │   ├── cart-context.tsx               ← Shopping cart
│   │   ├── auth-context.tsx               ← Authentication
│   │   ├── wishlist-context.tsx           ← Wishlist
│   │   └── woocommerce-context.tsx        ← WooCommerce status
│   │
│   ├── src/lib/                           ← Core logic
│   │   ├── woocommerce-api.ts             ← 🔥 1849 lines of WooCommerce logic
│   │   ├── api.ts                         ← WordPress API client
│   │   ├── cache-service.ts               ← 🔥 870 lines of caching
│   │   └── ...
│   │
│   └── src/types/                         ← TypeScript definitions
│       └── index.ts                       ← All types (800+ lines)
│
├── 🔌 WORDPRESS PLUGINS (Backend)
│   └── wordpress-plugin/
│       ├── headless-image-optimizer/      ← S3/CloudFront images
│       ├── headless-stripe-integration/   ← Stripe payments
│       ├── headless-paypal-integration/   ← PayPal payments
│       ├── headless-wordpress-helper/     ← CORS, helpers
│       └── hero-banners/                  ← Custom banners
│
└── 🛠️ UTILITIES
    └── scripts/
        └── cache-manager.js               ← Cache management CLI
```

---

## 🔑 Key Files You'll Edit Most

### 1. **Adding a New Page**
```typescript
// src/app/new-page/page.tsx
import { ClientLayout } from '@/components/themes/client-layout'

export default function NewPage() {
  return (
    <ClientLayout>
      <h1>New Page</h1>
    </ClientLayout>
  )
}
```

### 2. **Fetching WooCommerce Data**
```typescript
// Use the woocommerceApi client
import { woocommerceApi } from '@/lib/woocommerce-api'

// Get products
const products = await woocommerceApi.getProducts({ per_page: 10 })

// Get single product
const product = await woocommerceApi.getProductBySlug('product-slug')

// Get categories
const categories = await woocommerceApi.getProductCategories()
```

### 3. **Fetching WordPress Data**
```typescript
// Use the wordpressAPI client
import { wordpressAPI } from '@/lib/api'

// Get posts
const posts = await wordpressAPI.getPosts({ per_page: 10 })

// Get page
const page = await wordpressAPI.getPage('about')

// Get menus
const menu = await wordpressAPI.getMenu('primary')
```

### 4. **Using Cart Context**
```typescript
'use client'
import { useCart } from '@/contexts/cart-context'

export default function MyComponent() {
  const { cart, addToCart, removeFromCart } = useCart()
  
  return (
    <button onClick={() => addToCart(product)}>
      Add to Cart ({cart.items.length})
    </button>
  )
}
```

### 5. **Using Auth Context**
```typescript
'use client'
import { useAuth } from '@/contexts/auth-context'

export default function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  if (!isAuthenticated) {
    return <button onClick={() => login(email, password)}>Login</button>
  }
  
  return <div>Welcome, {user.name}!</div>
}
```

---

## 🧪 Common Tasks

### Running the Site
```bash
# Development
npm run dev               # http://localhost:3000

# Production build
npm run build
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Cache Management
```bash
# Refresh all caches
npm run cache:refresh

# View cache statistics
npm run cache:stats

# Clear all caches
npm run cache:clear

# Interactive cache manager
npm run cache:manage
```

### WordPress Plugin Installation
1. Copy plugin folder to `/wp-content/plugins/`
2. Activate in WordPress admin
3. Configure in plugin settings

Example:
```bash
cp -r wordpress-plugin/headless-stripe-integration/ /path/to/wordpress/wp-content/plugins/
```

---

## 🐛 Troubleshooting

### Issue: "API Connection Failed"
**Symptom**: Can't fetch products/posts
**Solution**:
1. Check `.env.local` has correct WordPress URL
2. Check WooCommerce API keys are valid
3. Check CORS is configured in WordPress
4. Check WordPress site is accessible

### Issue: "Images Not Loading"
**Symptom**: Broken image icons
**Solution**:
1. Check `next.config.js` has WordPress domain in `remotePatterns`
2. Check image URLs in browser console
3. Check WordPress media library has images

### Issue: "Cart Not Persisting"
**Symptom**: Cart empties on refresh
**Solution**:
1. Check localStorage is enabled in browser
2. Check cart-context is properly wrapped
3. Check browser console for errors

### Issue: "Payment Failed"
**Symptom**: Stripe/PayPal payment doesn't work
**Solution**:
1. Check API keys are for correct mode (test/live)
2. Check WordPress plugin is activated
3. Check webhook URLs are correct
4. Check browser console for errors

### Issue: "Elementor Page Not Styled"
**Symptom**: Page looks broken, no styling
**Solution**:
1. Check `/api/elementor-css?pageId=X` returns CSS URLs
2. Check CSS files are accessible
3. Check browser console for 404 errors
4. Clear cache and try again

---

## 🔧 Configuration Files

### `next.config.js`
```javascript
// Configure:
- Image domains (WordPress, CDN)
- Environment variables
- Redirects
- Rewrites
- Headers
```

### `tailwind.config.js`
```javascript
// Configure:
- Theme colors
- Fonts
- Spacing
- Breakpoints
- Plugins
```

### `tsconfig.json`
```json
// TypeScript configuration
// Usually don't need to change
```

### `.env.local` (Create this!)
```bash
# Environment variables
# NEVER commit this file!
# See .env.example for template
```

---

## 📊 Project Statistics

- **Total Files**: 200+
- **Lines of Code**: ~15,000+
- **React Components**: 50+
- **API Routes**: 30+
- **WordPress Plugins**: 5
- **TypeScript Types**: 800+ lines
- **Cache System**: 870 lines
- **WooCommerce API**: 1849 lines

---

## 🎯 What's Done vs What's Pending

### ✅ Fully Complete (80%)
- eCommerce flow (Shop → Cart → Checkout → Order)
- Authentication (Login, Register, My Account)
- Payment gateways (Stripe, PayPal)
- Product pages with variations
- Shopping cart with persistence
- Wishlist
- Blog
- Home page with dynamic sections
- WoodMart-style design
- Caching system
- Image optimization
- 5 custom WordPress plugins

### ⚠️ Partially Complete (15%)
- Elementor support (60% - static works, JS widgets need work)
- SEO integration (30% - basic meta, needs Yoast/RankMath)
- CDN (40% - CloudFront working, Cloudflare pending)

### ❌ Not Started (5%)
- Email marketing integration (0%)
- Review platform integration (0%)
- Advanced search (0%)
- Multi-language (0%)
- Admin dashboard (0%)

**See** `/docs/IMPLEMENTATION_TODO.md` **for detailed TODO list**

---

## 🚨 CRITICAL: Before Making Changes

### 1. Understand the Architecture
- Read `/docs/EXECUTIVE_SUMMARY.md` (10 min)
- Skim `/docs/COMPREHENSIVE_PROJECT_REPORT.md` (30 min)

### 2. Check Current Status
- Review `/docs/IMPLEMENTATION_TODO.md`
- See what's already done vs pending

### 3. Test Locally First
```bash
npm run dev        # Start dev server
npm run build      # Test production build
npm run type-check # Check TypeScript
```

### 4. Don't Break These
- ❌ Don't modify `woocommerce-api.ts` unless necessary (1849 lines, very complex)
- ❌ Don't modify `cache-service.ts` unless necessary (870 lines, critical)
- ❌ Don't change API endpoints without testing all consumers
- ❌ Don't update context logic without testing all components

### 5. When Adding Features
- ✅ Use existing patterns (look at similar components)
- ✅ Add TypeScript types
- ✅ Handle loading states
- ✅ Handle errors
- ✅ Add try-catch blocks
- ✅ Test on mobile

---

## 📚 Documentation Priority

**Read in this order**:

1. **This file** (5 min) - Overview
2. `/docs/EXECUTIVE_SUMMARY.md` (10 min) - Quick facts
3. `/docs/IMPLEMENTATION_TODO.md` (15 min) - What needs work
4. `/docs/COMPREHENSIVE_PROJECT_REPORT.md` (1-2 hours) - Deep dive
5. `/docs/WOOCOMMERCE_SETUP.md` (15 min) - If touching eCommerce
6. `/docs/wordpress-setup.md` (15 min) - If touching WordPress

---

## 💡 Pro Tips

### For Frontend Work
- Use existing components from `/src/components/themes/`
- Follow WoodMart design patterns
- All components should be responsive
- Use TypeScript strictly
- Handle loading & error states

### For Backend Work
- Use existing API clients (`woocommerceApi`, `wordpressAPI`)
- Don't make direct fetch() calls (use clients)
- Cache expensive operations
- Handle API errors gracefully

### For Styling
- Use Tailwind CSS (avoid custom CSS)
- Follow existing color scheme
- Use shadcn/ui components when possible
- Test dark mode

### For Performance
- Use React.lazy() for large components
- Implement loading skeletons
- Optimize images (use Next.js Image)
- Check cache before API calls

---

## 🔗 Important URLs

### Development
- Frontend: http://localhost:3000
- WordPress: https://manila.esdemo.in/wp-admin
- WooCommerce: https://manila.esdemo.in/wp-admin/admin.php?page=wc-admin

### API Endpoints
- Products: `/api/products`
- Cart: `/api/cart`
- Orders: `/api/orders`
- Pages: `/api/pages`
- Debug: `/api/debug-pages`
- Cache Admin: `/admin/cache`

### Documentation
- Main: `/docs/`
- README: `/README.md`
- Setup: `/docs/wordpress-setup.md`

---

## 🆘 Need Help?

### Common Questions

**Q: Where do I start?**
A: Read the Executive Summary, then check the TODO list for priority items.

**Q: How do I add a new page?**
A: Create a file in `/src/app/new-page/page.tsx`, wrap content in `<ClientLayout>`

**Q: How do I fetch products?**
A: Use `woocommerceApi.getProducts()` from `/src/lib/woocommerce-api.ts`

**Q: Where is the cart logic?**
A: `/src/contexts/cart-context.tsx` (state) and `/src/components/themes/cart-page.tsx` (UI)

**Q: How do I add a new API route?**
A: Create `/src/app/api/my-route/route.ts` with GET/POST handlers

**Q: How do payment gateways work?**
A: Stripe: `/src/components/StripePaymentForm.tsx` + WordPress plugin
   PayPal: `/src/components/PayPalPaymentForm.tsx` + WordPress plugin

**Q: Why isn't Elementor working fully?**
A: JavaScript widgets need server-side rendering. See TODO for solution.

**Q: How do I deploy?**
A: Build (`npm run build`), deploy to Vercel/Netlify, set environment variables

**Q: What's the most critical thing to fix?**
A: Elementor JavaScript support (40 hours) - see `/docs/IMPLEMENTATION_TODO.md`

---

## ✅ Quick Checklist Before Launch

- [ ] All environment variables set
- [ ] WordPress plugins installed & configured
- [ ] Payment gateways tested (test mode)
- [ ] Products added to WooCommerce
- [ ] All pages working (Home, Shop, Cart, Checkout, etc.)
- [ ] Mobile responsive tested
- [ ] Performance tested (Lighthouse)
- [ ] Forms tested (Contact, Login, Register)
- [ ] Elementor pages working (About, Contact)
- [ ] SEO meta tags present
- [ ] Analytics tracking setup
- [ ] Security headers configured
- [ ] SSL certificate active
- [ ] Backup system in place

---

## 🎓 Learning Resources

### Next.js
- [Next.js Docs](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### WooCommerce
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React + TypeScript](https://react-typescript-cheatsheet.netlify.app/)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 🚀 Ready to Code!

You now know:
- ✅ Where everything is
- ✅ How to run the project
- ✅ Where to find documentation
- ✅ How to add features
- ✅ How to troubleshoot
- ✅ What's done vs pending

**Next Step**: Read `/docs/EXECUTIVE_SUMMARY.md` then start coding! 💪

**Got stuck?** Check `/docs/COMPREHENSIVE_PROJECT_REPORT.md` for detailed explanations.

**Need a task?** Check `/docs/IMPLEMENTATION_TODO.md` for prioritized work.

---

**Good luck! You've got this! 🎉**


