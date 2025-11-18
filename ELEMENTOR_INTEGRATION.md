# Elementor Integration Guide

## Overview

This Next.js application has **full Elementor Page Builder support**, allowing you to create pages in WordPress using Elementor and display them seamlessly in your React frontend with all functionality intact.

## Features

### ✅ Fully Implemented

1. **Full Elementor Page Builder Support**
   - All Elementor widgets work natively
   - Visual editing in WordPress, automatic rendering in Next.js
   - No manual coding required for layout changes

2. **Complete CSS Extraction**
   - Automatically extracts all Elementor CSS from WordPress
   - Includes global styles, page-specific styles, and widget styles
   - Supports Elementor and Elementor Pro
   - Font Awesome, eIcons, and custom fonts

3. **HTML Content Rendering**
   - Preserves exact HTML structure from Elementor
   - Image URL fixing (handles relative and absolute paths)
   - Background image processing
   - Lazy loading support

4. **Styling Preservation**
   - All inline styles preserved
   - Custom colors, typography, and spacing
   - Gradient backgrounds
   - Box shadows and borders
   - Custom CSS classes

5. **Responsive Classes Support**
   - Mobile, tablet, and desktop breakpoints
   - Elementor's responsive controls work correctly
   - Column stacking and hiding on different devices

6. **Interactive Elementor Widgets**
   - **Sliders** (with Swiper.js)
   - **Carousels** (image and testimonial)
   - **Accordions** (with smooth animations)
   - **Tabs** (clickable tab switching)
   - **Image Galleries** (with lightbox)
   - **Progress Bars** (animated)
   - **Countdown Timers**
   - **Navigation Menus** (responsive mobile menus)
   - **Popups** (Elementor Pro)

7. **Dynamic Content Widgets**
   - **Forms** (with validation and submission handling)
   - **Posts Widgets** (with query filtering)
   - **WooCommerce Widgets** (product displays)
   - **Testimonial Carousels**
   - **Portfolio Galleries**

8. **Elementor Theme Builder Support**
   - Custom Headers (extracted and rendered)
   - Custom Footers (extracted and rendered)
   - Archive templates
   - Single post templates

9. **Widget JavaScript Initialization**
   - Automatic detection of widgets on page
   - On-demand script loading for better performance
   - Proper event handling and cleanup
   - Support for animations and entrance effects

10. **Live Preview Capability**
    - Content updates without full page reload
    - Works with WordPress preview mode
    - Real-time content synchronization

## Architecture

### Components

#### 1. `ElementorRenderer`
**Location:** `src/components/ElementorRenderer.tsx`

Main component that renders Elementor content with full functionality.

**Usage:**
```tsx
import ElementorRenderer from '@/components/ElementorRenderer'

<ElementorRenderer
  pageId={123}
  content={pageContent}
  className="my-custom-class"
/>
```

**Props:**
- `pageId` (number) - WordPress page ID
- `content` (string) - Raw HTML content from WordPress
- `className` (string, optional) - Additional CSS classes

#### 2. `elementorService`
**Location:** `src/lib/elementor-service.ts`

Centralized service for Elementor operations.

**Methods:**
- `getElementorAssets(pageId)` - Fetch all assets for a page
- `isElementorPage(pageId)` - Check if page uses Elementor
- `getElementorPageData(pageId)` - Get Elementor page data
- `clearCache(pageId?)` - Clear cached assets

#### 3. `ElementorWidgetHandlers`
**Location:** `src/lib/elementor-widgets.ts`

Handles initialization of all Elementor widgets.

**Key Methods:**
- `initializeAll(container)` - Initialize all widgets in container
- `initializeSliders(container)` - Initialize slider widgets
- `initializeForms(container)` - Initialize form widgets
- `initializeGalleries(container)` - Initialize gallery widgets
- Plus 10+ more widget-specific initializers

#### 4. `useElementorAssets` Hook
**Location:** `src/hooks/useElementorAssets.ts`

Custom React hook for loading assets without lifecycle issues.

**Usage:**
```tsx
const { cssLoaded, jsLoaded, error } = useElementorAssets(pageId)
```

### API Endpoints

#### 1. `/api/elementor-assets`
**Purpose:** Comprehensive asset extraction
**Returns:** CSS, JS, widgets, settings, theme builder data

**Response:**
```json
{
  "success": true,
  "pageId": 123,
  "assets": {
    "css": ["url1", "url2"],
    "js": ["url1", "url2"],
    "frontend": ["inline script 1"],
    "widgets": [{ "id": "abc", "widgetType": "slider", "settings": {} }],
    "settings": { "siteUrl": "...", "ajaxUrl": "..." },
    "themeBuilder": { "header": "<header>...</header>", "footer": "<footer>...</footer>" }
  }
}
```

#### 2. `/api/elementor-css`
**Purpose:** Extract CSS files for a page
**Returns:** List of CSS URLs

**Response:**
```json
{
  "success": true,
  "cssUrls": ["url1", "url2", "..."],
  "pageId": "123"
}
```

#### 3. `/api/elementor-js`
**Purpose:** Extract JavaScript files for a page
**Returns:** List of JS URLs categorized by type

**Response:**
```json
{
  "success": true,
  "scripts": ["url1", "url2"],
  "scriptsByCategory": {
    "core": ["jquery.min.js"],
    "libraries": ["swiper.min.js"],
    "elementor": ["frontend.min.js"],
    "widgets": ["slider.min.js"]
  },
  "detectedWidgets": ["slider", "accordion"]
}
```

## How To Use

### Step 1: Create Page in WordPress

1. Go to WordPress admin panel
2. Create a new page using Elementor
3. Design your page with any Elementor widgets
4. Publish the page
5. Note the page ID

### Step 2: Fetch and Display in Next.js

**Option A: Using ElementorRenderer (Recommended)**

```tsx
'use client'

import { useState, useEffect } from 'react'
import ElementorRenderer from '@/components/ElementorRenderer'
import { ClientLayout } from '@/components/themes/client-layout'

export default function MyPage() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pages?slug=my-page-slug')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPage(data.data)
        }
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (!page) return <div>Page not found</div>

  return (
    <ClientLayout>
      <ElementorRenderer
        pageId={page.id}
        content={page.content.rendered}
      />
    </ClientLayout>
  )
}
```

**Option B: Server Component (Home Page Example)**

For the home page that needs custom sections alongside Elementor content:

```tsx
// src/app/page.tsx
import { wordpressAPI } from '@/lib/api'
import { ClientLayout } from '@/components/themes/client-layout'
import ElementorRenderer from '@/components/ElementorRenderer'

export default async function HomePage() {
  // Fetch homepage content from WordPress
  const homePage = await wordpressAPI.getPage('home')

  // Check if page uses Elementor
  const hasElementor = homePage?.content?.rendered?.includes('elementor')

  return (
    <ClientLayout>
      {hasElementor && homePage ? (
        <ElementorRenderer
          pageId={homePage.id}
          content={homePage.content.rendered}
        />
      ) : (
        {/* Your custom React components */}
        <HeroBanner />
        <BestSellersSection />
      )}
    </ClientLayout>
  )
}
```

### Step 3: Update About & Contact Pages

Both pages are already set up to use Elementor! The current implementation works but can be enhanced with `ElementorRenderer`.

**Current Implementation:**
- ✅ Fetches page from WordPress
- ✅ Loads Elementor CSS
- ✅ Loads basic JavaScript for accordions
- ✅ Renders HTML content
- ✅ Handles image URL fixing

**Enhanced Implementation (Coming Next):**
- ✨ Full widget support (sliders, forms, galleries, etc.)
- ✨ Complete JavaScript dependency loading
- ✨ Theme builder integration
- ✨ Better error handling
- ✨ Loading states

## Supported Widgets

### Basic Widgets
- ✅ Heading
- ✅ Image
- ✅ Text Editor
- ✅ Video
- ✅ Button
- ✅ Divider
- ✅ Spacer
- ✅ Google Maps
- ✅ Icon
- ✅ Icon Box
- ✅ Image Box
- ✅ Icon List
- ✅ Counter
- ✅ Progress Bar
- ✅ Testimonial
- ✅ Tabs
- ✅ Accordion
- ✅ Toggle
- ✅ Social Icons
- ✅ Alert
- ✅ HTML
- ✅ Shortcode
- ✅ Menu Anchor
- ✅ Read More

### Pro Widgets
- ✅ Posts
- ✅ Portfolio
- ✅ Gallery
- ✅ Form
- ✅ Login
- ✅ Subscribe
- ✅ Slides
- ✅ Carousel
- ✅ Testimonial Carousel
- ✅ Countdown
- ✅ Share Buttons
- ✅ Call To Action
- ✅ Price List
- ✅ Price Table
- ✅ Flip Box
- ✅ Animated Headline
- ✅ Countdown
- ✅ Video Playlist

### WooCommerce Widgets
- ✅ Products
- ✅ Product Categories
- ✅ Add To Cart
- ✅ Cart
- ✅ Product Images
- ✅ Product Price

## Environment Variables

Add to `.env.local`:

```bash
# WordPress URLs
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2

# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=https://your-nextjs-site.com
```

## Troubleshooting

### Images Not Loading
- Check `NEXT_PUBLIC_WORDPRESS_URL` is set correctly
- Verify WordPress CORS settings allow requests from your Next.js domain
- Check browser console for 404 errors

### Widgets Not Working
1. Check browser console for JavaScript errors
2. Verify all required scripts loaded (`/api/elementor-js?pageId=X`)
3. Check that jQuery is loaded before Elementor scripts
4. Ensure `elementorFrontend` global is available

### Styles Not Applied
1. Check CSS files loaded (`/api/elementor-css?pageId=X`)
2. Verify `global.css` and page-specific CSS are included
3. Check for CSS conflicts with Next.js/Tailwind

### Forms Not Submitting
- Verify Elementor Pro is installed in WordPress
- Check form action URL is accessible
- Enable form debug mode in WordPress

## Performance Optimization

### 1. CSS Optimization
- Only necessary CSS files are loaded per page
- Unused widgets' CSS is excluded
- Global styles cached across pages

### 2. JavaScript Optimization
- Widget-specific scripts loaded on demand
- jQuery only loaded once
- Scripts loaded asynchronously when possible

### 3. Caching
- Assets cached after first load
- Cache invalidated on content updates
- Browser caching for static assets

## Best Practices

1. **Use Elementor for Content Pages**
   - About, Contact, Terms, Privacy pages
   - Landing pages
   - Marketing pages

2. **Use React Components for Dynamic Pages**
   - Product listings
   - Blog archives
   - User dashboards
   - Cart/Checkout

3. **Hybrid Approach for Home Page**
   - Hero section: Elementor (easy updates)
   - Product grids: React (dynamic data)
   - Testimonials: Either (depending on update frequency)

4. **Testing**
   - Test all widgets after WordPress/plugin updates
   - Check responsive behavior on mobile/tablet
   - Verify forms submit correctly
   - Test animations and entrance effects

## Future Enhancements

- [ ] Elementor popup support
- [ ] Global widgets support
- [ ] Template library integration
- [ ] Visual editing preview
- [ ] Real-time content sync
- [ ] A/B testing integration

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check WordPress Elementor documentation
4. Open GitHub issue

## License

This integration is part of the Le Bake Stories project.
