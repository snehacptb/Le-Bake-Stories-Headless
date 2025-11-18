# Elementor Usage Examples

## Quick Start: 3 Simple Steps

### 1. Create Page in WordPress
Go to WordPress → Pages → Add New with Elementor
Design your page, then publish and note the page ID or slug.

### 2. Update Your Next.js Page to Use ElementorRenderer

Here are working examples for your home, about, and contact pages:

---

## Example 1: About Page (Simplest Implementation)

Replace your current about page with this:

**File:** `src/app/about/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import ElementorRenderer from '@/components/ElementorRenderer'
import { ClientLayout } from '@/components/themes/client-layout'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function AboutPage() {
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch('/api/pages?slug=about-us-2', { cache: 'no-store' })
        const json = await res.json()

        if (json.success && json.data) {
          setPage(json.data)
        } else {
          setError('About page not found')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [])

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error || !page) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/" className="text-purple-700 hover:underline">
              Go to Homepage
            </Link>
          </div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-700 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">
              {page?.title?.rendered || 'About Us'}
            </span>
          </nav>
        </div>
      </div>

      {/* Elementor Content */}
      <ElementorRenderer
        pageId={page.id}
        content={page.content.rendered}
      />
    </ClientLayout>
  )
}
```

---

## Example 2: Contact Page (Same Pattern)

**File:** `src/app/contact/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import ElementorRenderer from '@/components/ElementorRenderer'
import { ClientLayout } from '@/components/themes/client-layout'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function ContactPage() {
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        // Try multiple slug variations
        const slugs = ['contact-us-2', 'contact-us', 'contact']
        let foundPage = null

        for (const slug of slugs) {
          const res = await fetch(`/api/pages?slug=${slug}`, { cache: 'no-store' })
          const json = await res.json()

          if (json.success && json.data) {
            foundPage = json.data
            break
          }
        }

        if (foundPage) {
          setPage(foundPage)
        } else {
          setError('Contact page not found')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [])

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error || !page) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/" className="text-purple-700 hover:underline">
              Go to Homepage
            </Link>
          </div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-700 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">
              {page?.title?.rendered || 'Contact Us'}
            </span>
          </nav>
        </div>
      </div>

      {/* Elementor Content */}
      <ElementorRenderer
        pageId={page.id}
        content={page.content.rendered}
      />
    </ClientLayout>
  )
}
```

---

## Example 3: Home Page (Hybrid Approach)

For the home page, you can choose between:

### Option A: Full Elementor Home Page

**File:** `src/app/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import ElementorRenderer from '@/components/ElementorRenderer'
import { ClientLayout } from '@/components/themes/client-layout'

export default function HomePage() {
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch('/api/pages?slug=home', { cache: 'no-store' })
        const json = await res.json()

        if (json.success && json.data) {
          setPage(json.data)
        }
      } catch (err) {
        console.error('Error fetching home page:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [])

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </ClientLayout>
    )
  }

  // If no Elementor page found, use existing React components
  if (!page) {
    return (
      <ClientLayout>
        {/* Your existing home page components */}
        <HeroBanner />
        <BestSellersSection />
        <CategoriesCarousel />
      </ClientLayout>
    )
  }

  // Use Elementor page
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

### Option B: Hybrid (Elementor Hero + React Sections)

```tsx
'use client'

import { useState, useEffect } from 'react'
import ElementorRenderer from '@/components/ElementorRenderer'
import { ClientLayout } from '@/components/themes/client-layout'
import { BestSellersSection } from '@/components/themes/best-sellers-section'
import { CategoriesCarousel } from '@/components/themes/categories-carousel'

export default function HomePage() {
  const [heroPage, setHeroPage] = useState<any>(null)

  useEffect(() => {
    // Fetch Elementor hero section
    fetch('/api/pages?slug=home-hero')
      .then(res => res.json())
      .then(json => {
        if (json.success) setHeroPage(json.data)
      })
  }, [])

  return (
    <ClientLayout>
      {/* Elementor Hero Section */}
      {heroPage && (
        <ElementorRenderer
          pageId={heroPage.id}
          content={heroPage.content.rendered}
        />
      )}

      {/* React Components for Dynamic Content */}
      <BestSellersSection />
      <CategoriesCarousel />
      <TestimonialsSection />
    </ClientLayout>
  )
}
```

---

## Example 4: Server Component (Recommended for Better Performance)

**File:** `src/app/about/page.tsx`

```tsx
import ElementorRenderer from '@/components/ElementorRenderer'
import { ClientLayout } from '@/components/themes/client-layout'
import { wordpressAPI } from '@/lib/api'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function AboutPage() {
  // Fetch page server-side
  const page = await wordpressAPI.getPage('about-us-2')

  if (!page) {
    notFound()
  }

  return (
    <ClientLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-700 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">
              {page.title?.rendered || 'About Us'}
            </span>
          </nav>
        </div>
      </div>

      {/* Elementor Content */}
      <ElementorRenderer
        pageId={page.id}
        content={page.content.rendered}
      />
    </ClientLayout>
  )
}

// Generate metadata
export async function generateMetadata() {
  const page = await wordpressAPI.getPage('about-us-2')

  return {
    title: page?.title?.rendered || 'About Us',
    description: page?.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
  }
}
```

---

## Example 5: Dynamic Route with Elementor

**File:** `src/app/[slug]/page.tsx`

```tsx
import ElementorRenderer from '@/components/ElementorRenderer'
import { ClientLayout } from '@/components/themes/client-layout'
import { wordpressAPI } from '@/lib/api'
import { notFound } from 'next/navigation'

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await wordpressAPI.getPage(params.slug)

  if (!page) {
    notFound()
  }

  return (
    <ClientLayout>
      <ElementorRenderer
        pageId={page.id}
        content={page.content.rendered}
      />
    </ClientLayout>
  )
}

// Generate static paths at build time
export async function generateStaticParams() {
  const pages = await wordpressAPI.getPages({ per_page: 100 })

  return pages.data.map((page: any) => ({
    slug: page.slug,
  }))
}
```

---

## Testing Your Implementation

### 1. Test Basic Rendering
```bash
npm run dev
# Visit http://localhost:3000/about
```

### 2. Check Browser Console
Look for these success messages:
```
🎯 Initializing all Elementor widgets...
✅ Slider initialized: abc123
✅ Elementor widgets initialized
```

### 3. Test Widgets
- Click accordions - they should expand/collapse
- Check sliders - they should auto-play
- Submit forms - they should validate and submit
- View galleries - lightbox should work

### 4. Test Responsiveness
Open DevTools and test on different screen sizes:
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

---

## Common Issues & Solutions

### Issue: "Page not found"
**Solution:** Check the slug in WordPress matches your code

### Issue: Styles not applying
**Solution:** Check browser Network tab for 404s on CSS files

### Issue: Widgets not interactive
**Solution:** Check console for JavaScript errors, verify scripts loaded

### Issue: Forms not submitting
**Solution:** Ensure Elementor Pro is installed in WordPress

---

## Next Steps

1. Replace your current About page with Example 1
2. Replace your current Contact page with Example 2
3. Decide on Home page approach (full Elementor or hybrid)
4. Test all widgets work correctly
5. Optimize performance if needed

---

## Need Help?

Refer to `ELEMENTOR_INTEGRATION.md` for detailed documentation.
