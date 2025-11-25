# SEO Guide - Complete SEO Implementation

> **Complete guide for SEO implementation** in your headless WordPress + Next.js site using SEOPress

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Overview](#overview)
3. [WordPress Setup](#wordpress-setup)
4. [Next.js Integration](#nextjs-integration)
5. [File Structure](#file-structure)
6. [Testing & Validation](#testing--validation)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Get SEO-Ready in 5 Minutes

**1. Backend (WordPress) - 2 minutes**

```bash
# 1. Install SEOPress plugin from WordPress admin
# 2. Upload seopress-headless-api plugin
# Location: wordpress-plugin/seopress-headless-api/
# 3. Activate both plugins
# 4. Configure basic SEOPress settings
```

**2. Test API Endpoint**

```bash
# Test that SEO data is available
curl https://your-wordpress.com/wp-json/wp/v2/posts?slug=test-post

# Check for 'seopress_meta' field in response
```

**3. Verify Frontend - 3 minutes**

```bash
# 1. Environment variables are already set
# 2. SEO utilities are already integrated
# 3. Test on a blog post:
npm run dev
# Visit http://localhost:3000/blog/[any-post]
# View page source - check <head> meta tags
```

**4. Test SEO - 1 minute**

```
✅ Visit: /api/test-seopress (test endpoint)
✅ Check meta tags in page source
✅ View: /sitemap.xml
✅ View: /robots.txt
```

---

## 📖 Overview

### What's Included

✅ **SEOPress Integration** - WordPress plugin exposing metadata  
✅ **REST API Endpoints** - Access SEO data via API  
✅ **Next.js Metadata API** - Server-side SEO  
✅ **Sitemaps** - Dynamic XML sitemaps  
✅ **Robots.txt** - SEO-friendly crawling rules  
✅ **Schema Markup** - JSON-LD structured data  
✅ **Social Media** - Open Graph & Twitter Cards  

### Architecture

```
WordPress (Backend)
├── SEOPress Plugin (SEO management)
├── SEOPress Headless API Plugin (REST API exposure)
└── REST API Endpoints (/wp-json/*)

Next.js (Frontend)
├── SEO Utils (src/lib/seo-utils.ts)
├── SEOPress Service (src/lib/seopress-service.ts)
├── Metadata API (generateMetadata functions)
└── Dynamic Routes (sitemap.xml, robots.txt)
```

---

## 🔧 WordPress Setup

### Step 1: Install Plugins

**SEOPress (Main Plugin)**

1. Go to WordPress Admin → Plugins → Add New
2. Search for "SEOPress"
3. Install and activate
4. Choose Free or Pro version

**SEOPress Headless API (Custom Plugin)**

1. Upload `wordpress-plugin/seopress-headless-api/` to `/wp-content/plugins/`
2. Activate via Plugins menu
3. Plugin exposes SEOPress data via REST API

### Step 2: Configure SEOPress

**General Settings:**

1. Go to SEOPress → Settings
2. **Title & Metas:**
   - Set site title format
   - Choose separator (-, |, •)
   - Configure homepage title/description
   
3. **Social Networks:**
   - Add Facebook App ID
   - Add Twitter username
   - Upload default OG image (1200x630px)
   
4. **Analytics:**
   - Add Google Analytics 4 ID
   - Add Google Tag Manager (optional)
   
5. **Advanced:**
   - Add verification codes (Google, Bing)
   - Configure image settings
   
6. **XML/HTML Sitemap:**
   - Enable XML sitemap
   - Select post types to include
   - Set update frequency

### Step 3: Configure Content

For each post, page, or product:

1. **SEOPress Meta Box** → Titles & Metas:
   - **Title**: Custom title or use template
   - **Description**: 150-160 characters
   - **Canonical URL**: Usually auto
   - **Robots**: index/noindex, follow/nofollow

2. **Social Tab**:
   - **OG Title**: Social media title
   - **OG Description**: Social description
   - **OG Image**: 1200x630px image
   - **Twitter Card**: summary_large_image
   - **Twitter Title/Description**: Custom or inherit

3. **Schema Tab** (Pro only):
   - Select schema type (Article, Product, etc.)
   - Fill required fields

### Step 4: Verify API

Test these endpoints:

```bash
# Post with SEO data
https://your-site.com/wp-json/wp/v2/posts?slug=post-slug

# SEO data directly
https://your-site.com/wp-json/seopress/v1/seo/post/post-slug

# Global settings
https://your-site.com/wp-json/seopress/v1/settings

# Test endpoint
https://your-site.com/wp-json/seopress/v1/test
```

Expected response should include `seopress_meta` field with:
- title
- description
- canonical
- robots
- og_title, og_description, og_image
- twitter_title, twitter_description, twitter_image

---

## 💻 Next.js Integration

### File Structure

```
src/
├── lib/
│   ├── seopress-service.ts      # SEOPress API client
│   └── seo-utils.ts              # SEO utility functions
├── app/
│   ├── layout.tsx                # Root layout with base metadata
│   ├── sitemap.ts                # Dynamic sitemap generation
│   ├── robots.ts                 # Robots.txt configuration
│   └── blog/
│       └── [slug]/
│           └── page.tsx          # Blog post with metadata
└── api/
    └── test-seopress/
        └── route.ts              # SEO testing endpoint
```

### Core Files

**1. SEOPress Service** (`src/lib/seopress-service.ts`)

Fetches SEO data from WordPress:

```typescript
// Get SEO metadata by slug
const seoData = await getSeoData('my-post-slug', 'post');

// Returns:
{
  title: "Post Title",
  description: "Meta description",
  canonical: "https://site.com/post",
  robots: { noindex: false, nofollow: false },
  og_title: "OG Title",
  og_description: "OG Description",
  og_image: "https://site.com/image.jpg",
  // ... more fields
}
```

**2. SEO Utils** (`src/lib/seo-utils.ts`)

Converts SEOPress data to Next.js Metadata:

```typescript
import { convertToNextMetadata } from '@/lib/seo-utils';

// Convert SEOPress data to Next.js format
const metadata = convertToNextMetadata(seopressData);

// Returns Next.js Metadata object ready to use
```

**3. Blog Post Page** (`src/app/blog/[slug]/page.tsx`)

Implements SEO metadata:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  const seoData = await getSeoData(params.slug, 'post');
  
  return convertToNextMetadata(seoData);
}

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug);
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateArticleJsonLd({
            headline: post.title,
            description: post.excerpt,
            author: post.author,
            datePublished: post.date,
            image: post.featuredImage,
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`
          }))
        }}
      />
      {/* Post content */}
    </>
  );
}
```

**4. Sitemap** (`src/app/sitemap.ts`)

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const products = await getAllProducts();
  
  return [
    {
      url: 'https://site.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...posts.map(post => ({
      url: `https://site.com/blog/${post.slug}`,
      lastModified: new Date(post.modified),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...products.map(product => ({
      url: `https://site.com/shop/${product.slug}`,
      lastModified: new Date(product.modified),
      changeFrequency: 'weekly',
      priority: 0.9,
    })),
  ];
}
```

**5. Robots.txt** (`src/app/robots.ts`)

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/checkout/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
```

### Implementation Patterns

**Pattern 1: Server Component with SEO**

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const seoData = await getSeoData(params.slug, 'post');
  return convertToNextMetadata(seoData);
}

export default async function Page({ params }) {
  const post = await getPostBySlug(params.slug);
  
  return (
    <>
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateArticleJsonLd(post))}
      </script>
      
      {/* Page Content */}
      <article>{post.content}</article>
    </>
  );
}
```

**Pattern 2: Product Page with SEO**

```typescript
// app/shop/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const seoData = await getSeoData(params.slug, 'product');
  return convertToNextMetadata(seoData);
}

export default async function ProductPage({ params }) {
  const product = await getProductBySlug(params.slug);
  
  return (
    <>
      {/* Product Schema */}
      <script type="application/ld+json">
        {JSON.stringify(generateProductJsonLd({
          name: product.name,
          description: product.description,
          image: [product.images[0]?.src],
          offers: {
            price: product.price,
            priceCurrency: 'USD',
            availability: product.in_stock ? 'InStock' : 'OutOfStock',
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop/${product.slug}`
          }
        }))}
      </script>
      
      {/* Product Content */}
      <ProductDetails product={product} />
    </>
  );
}
```

---

## 📁 File Structure Reference

### WordPress Plugin Files

```
wordpress-plugin/seopress-headless-api/
├── seopress-headless-api.php    # Main plugin file
└── README.md                     # Plugin documentation
```

**Plugin provides:**
- `seopress_meta` field in REST API
- Custom endpoints for SEO data
- Admin endpoints for updates
- Global SEO settings endpoint

### Frontend Files

```
src/
├── lib/
│   ├── seopress-service.ts      # API client (316 lines)
│   │   └── Functions:
│   │       ├── getSeoData()
│   │       ├── getAllSeoData()
│   │       └── getGlobalSeoSettings()
│   │
│   └── seo-utils.ts              # Utilities (316 lines)
│       └── Functions:
│           ├── convertToNextMetadata()
│           ├── generateArticleJsonLd()
│           ├── generateProductJsonLd()
│           ├── generateBreadcrumbJsonLd()
│           ├── generateOrganizationJsonLd()
│           └── generateLocalBusinessJsonLd()
│
├── app/
│   ├── layout.tsx                # Root metadata
│   ├── sitemap.ts                # Dynamic sitemap
│   ├── robots.ts                 # Robots.txt
│   └── api/
│       └── test-seopress/
│           └── route.ts          # Testing endpoint
│
└── [Feature pages with SEO integration]
    ├── blog/[slug]/page.tsx
    ├── shop/[slug]/page.tsx
    └── [category]/[slug]/page.tsx
```

---

## ✅ Testing & Validation

### 1. API Testing

**Test WordPress API:**

```bash
# Test general endpoint
curl https://your-wordpress.com/wp-json

# Test SEOPress plugin endpoint
curl https://your-wordpress.com/wp-json/seopress/v1/settings

# Test post with SEO data
curl https://your-wordpress.com/wp-json/wp/v2/posts?slug=test-post

# Look for 'seopress_meta' in response
```

**Test Next.js API:**

```bash
# Visit testing endpoint
https://your-nextjs-site.com/api/test-seopress

# Should show:
✅ SEOPress appears to be properly integrated!
```

### 2. Meta Tags Validation

**View Page Source:**

```html
<!-- Should see these tags in <head> -->
<title>Your SEO Title</title>
<meta name="description" content="Your meta description" />
<link rel="canonical" href="https://site.com/page" />

<!-- Open Graph -->
<meta property="og:title" content="Your OG Title" />
<meta property="og:description" content="Your OG Description" />
<meta property="og:image" content="https://site.com/image.jpg" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Your Twitter Title" />
```

**Use Tools:**
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

### 3. Sitemap & Robots Testing

```bash
# Check sitemap
curl https://your-site.com/sitemap.xml

# Should return XML with URLs
# Verify all important pages are listed

# Check robots.txt
curl https://your-site.com/robots.txt

# Should show crawling rules and sitemap location
```

### 4. Structured Data Testing

**Test JSON-LD:**

1. Visit a blog post
2. View page source
3. Find `<script type="application/ld+json">`
4. Copy JSON content
5. Paste into [Google Rich Results Test](https://search.google.com/test/rich-results)
6. Verify no errors

### 5. Lighthouse SEO Audit

```bash
# Run Lighthouse
npm install -g lighthouse
lighthouse https://your-site.com --only-categories=seo --view

# Check SEO score (aim for 90+)
```

---

## 🎯 Best Practices

### SEO Content

✅ **Titles:**
- 50-60 characters
- Include primary keyword
- Unique per page
- Front-load important words

✅ **Descriptions:**
- 150-160 characters
- Include call-to-action
- Match page content
- Include keywords naturally

✅ **Images:**
- Use descriptive alt text
- Optimize file sizes
- Use next/image for optimization
- Provide OG images (1200x630px)

### Technical SEO

✅ **URLs:**
- Use descriptive slugs
- Keep them short
- Use hyphens, not underscores
- Avoid unnecessary parameters

✅ **Canonical URLs:**
- Always set canonical
- Point to preferred version
- Avoid duplicate content
- Use absolute URLs

✅ **Structured Data:**
- Implement for all content types
- Use appropriate schema types
- Test with Google tools
- Keep data accurate

### Performance

✅ **Page Speed:**
- Use Server-Side Rendering
- Implement caching
- Optimize images
- Minimize JavaScript

✅ **Core Web Vitals:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

---

## 🔧 Troubleshooting

### SEOPress Data Not Showing

**Issue:** `seopress_meta` field missing in API

**Solutions:**
1. ✅ Verify SEOPress plugin is active
2. ✅ Check seopress-headless-api plugin is active
3. ✅ Test WordPress API endpoint directly
4. ✅ Check WordPress error logs
5. ✅ Re-save SEOPress settings

**Debug:**
```bash
# Check plugin status
curl https://your-wordpress.com/wp-json/wp/v2/plugins

# Test specific post
curl https://your-wordpress.com/wp-json/wp/v2/posts/123
```

### Meta Tags Not Appearing

**Issue:** SEO tags not in page `<head>`

**Solutions:**
1. ✅ Check generateMetadata function exists
2. ✅ Verify function is async
3. ✅ Check SEO data is being fetched
4. ✅ Verify convertToNextMetadata is called
5. ✅ Check for JavaScript errors

**Debug:**
```typescript
// Add logging to generateMetadata
export async function generateMetadata({ params }) {
  const seoData = await getSeoData(params.slug, 'post');
  console.log('SEO Data:', seoData);
  
  const metadata = convertToNextMetadata(seoData);
  console.log('Metadata:', metadata);
  
  return metadata;
}
```

### Sitemap Issues

**Issue:** Sitemap not generating or missing URLs

**Solutions:**
1. ✅ Check sitemap.ts file exists
2. ✅ Verify function returns proper format
3. ✅ Check API calls are working
4. ✅ Rebuild production build
5. ✅ Clear CDN cache

**Test:**
```bash
# Development
npm run dev
curl http://localhost:3000/sitemap.xml

# Production
npm run build
npm run start
curl http://localhost:3000/sitemap.xml
```

### Robots.txt Problems

**Issue:** Robots.txt not working or wrong rules

**Solutions:**
1. ✅ Check robots.ts file exists in app directory
2. ✅ Verify function returns MetadataRoute.Robots
3. ✅ Check sitemap URL is correct
4. ✅ Rebuild production build

**Verify:**
```bash
curl https://your-site.com/robots.txt

# Should return:
User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://your-site.com/sitemap.xml
```

### Schema Validation Errors

**Issue:** Google Rich Results showing errors

**Solutions:**
1. ✅ Verify JSON-LD syntax is valid
2. ✅ Check required fields are present
3. ✅ Use correct schema type
4. ✅ Test with Google tool
5. ✅ Follow schema.org guidelines

**Test:**
```bash
# Extract JSON-LD from page
curl https://your-site.com/blog/post | grep -o '<script type="application/ld\+json">.*</script>'

# Validate at:
https://search.google.com/test/rich-results
```

---

## 📚 Additional Resources

### Tools

- **SEOPress Plugin:** https://www.seopress.org/
- **Google Search Console:** https://search.google.com/search-console
- **Schema Markup Validator:** https://validator.schema.org/
- **Facebook OG Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator

### Documentation

- **Next.js Metadata API:** https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- **Schema.org:** https://schema.org/
- **Google SEO Guide:** https://developers.google.com/search/docs

---

## 🎉 Summary

You now have:
✅ SEOPress integrated with WordPress  
✅ REST API exposing SEO data  
✅ Next.js consuming and rendering SEO  
✅ Dynamic sitemaps  
✅ Robots.txt configuration  
✅ Structured data (JSON-LD)  
✅ Social media optimization  

**Your site is SEO-ready!** 🚀

---

**Last Updated:** November 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

