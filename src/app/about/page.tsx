'use client'

import { useState, useEffect } from 'react'
import { ClientLayout } from '@/components/themes/client-layout'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronRight,
  Truck,
  Headphones,
  CreditCard,
  Zap,
  Star,
  Award,
  Shield,
  Heart
} from 'lucide-react'

interface WordPressPage {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  featured_media?: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
  }
}

export default function AboutPage() {
  const [page, setPage] = useState<WordPressPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAboutPage()
  }, [])

  const fetchAboutPage = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the about page from WordPress
      const res = await fetch('/api/pages?slug=about-us', { cache: 'no-store' })
      const json = await res.json()

      if (json.success && json.data) {
        setPage(json.data)
      } else {
        // Try alternate slug
        const res2 = await fetch('/api/pages?slug=about', { cache: 'no-store' })
        const json2 = await res2.json()

        if (json2.success && json2.data) {
          setPage(json2.data)
        } else {
          setError('About page not found')
        }
      }
    } catch (error) {
      console.error('Error fetching about page:', error)
      setError('Failed to load about page')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-12">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-8 w-1/3 mx-auto"></div>
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
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
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {error || 'About page not found'}
            </h1>
            <p className="text-gray-600 mb-4">
              Please create an &quot;About Us&quot; page in your WordPress backend.
            </p>
            <Link
              href="/"
              className="text-purple-700 hover:text-purple-900 font-medium"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </ClientLayout>
    )
  }

  const pageTitle = page.title.rendered
  const pageContent = page.content.rendered

  // Extract first paragraph for intro
  const introMatch = pageContent.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  const introText = introMatch
    ? introMatch[1].replace(/<[^>]*>/g, '').trim()
    : page.excerpt.rendered.replace(/<[^>]*>/g, '').trim()

  // Extract images from content
  const imageMatches = Array.from(
    pageContent.matchAll(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/g)
  )
  const contentImages = imageMatches.map((match) => ({
    src: match[1],
    alt: match[2] || 'About us image',
  }))

  // Get featured image
  const featuredImage = page._embedded?.['wp:featuredmedia']?.[0]?.source_url

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
            <span className="text-gray-900 font-medium">{pageTitle}</span>
          </nav>
        </div>
      </div>

      {/* Title Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {pageTitle}
            </h1>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {featuredImage && (
        <section className="py-8 md:py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative h-64 md:h-96 overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={featuredImage}
                  alt={pageTitle}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Introduction Section */}
      {introText && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed text-center">
                {introText}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div
              className="wordpress-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: pageContent }}
            />
          </div>
        </div>
      </section>

      {/* Content Images Section */}
      {contentImages.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {contentImages.slice(0, 2).map((image, index) => (
                <div
                  key={index}
                  className="relative h-64 md:h-96 overflow-hidden rounded-lg shadow-lg"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We curate an exclusive collection of the finest luxury goods from around the globe
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Star,
                title: 'Exclusive Selection',
                description:
                  'Curated collection of coveted luxury brands from around the world',
              },
              {
                icon: Award,
                title: 'Exceptional Quality',
                description:
                  'Impeccable craftsmanship and attention to detail in every product',
              },
              {
                icon: Shield,
                title: 'Trust and Integrity',
                description:
                  'Built on principles of transparency and customer satisfaction',
              },
              {
                icon: Heart,
                title: 'Experience Luxury',
                description: 'Redefining luxury shopping with personalized service',
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-xl transition-all duration-300 group border-0"
              >
                <CardContent className="p-8">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-700 transition-colors duration-300">
                    <item.icon className="h-8 w-8 text-purple-700 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      
    </ClientLayout>
  )
}
