/**
 * SEO Utilities
 * Helper functions for managing SEO metadata in Next.js
 */

import { Metadata } from 'next'
import { SEOPressMetadata } from './seopress-service'

/**
 * Convert SEOPress metadata to Next.js Metadata object
 * NO FALLBACKS - Returns empty metadata if SEOPress data is not available
 */
export function convertToNextMetadata(
  seopressMeta: SEOPressMetadata | null
): Metadata {
  // If no SEOPress data, return minimal metadata (let Next.js use defaults)
  if (!seopressMeta) {
    console.warn('⚠️ SEOPress metadata not available - SEOPress plugin may be deactivated')
    return {}
  }

  // Build robots directives only if specified
  const robots: any = {}
  if (seopressMeta.robots.noindex) robots.index = false
  if (seopressMeta.robots.nofollow) robots.follow = false
  if (seopressMeta.robots.noarchive) robots.noarchive = true
  if (seopressMeta.robots.nosnippet) robots.nosnippet = true
  if (seopressMeta.robots.noimageindex) robots.noimageindex = true

  // Build metadata object - only include fields that have values
  const metadata: Metadata = {}

  // Title (required by SEOPress)
  if (seopressMeta.title) {
    metadata.title = seopressMeta.title
  }

  // Description (required by SEOPress)
  if (seopressMeta.description) {
    metadata.description = seopressMeta.description
  }

  // Canonical URL
  if (seopressMeta.canonical) {
    metadata.alternates = {
      canonical: seopressMeta.canonical,
    }
  }

  // Robots directives
  if (Object.keys(robots).length > 0) {
    metadata.robots = robots
  }

  // Open Graph (only if at least title is present)
  if (seopressMeta.og_title || seopressMeta.title) {
    metadata.openGraph = {
      title: seopressMeta.og_title || seopressMeta.title,
      description: seopressMeta.og_description || seopressMeta.description,
      url: seopressMeta.canonical,
      type: 'website',
      siteName: 'Le Bake Stories',
    }

    // Add OG image if available
    if (seopressMeta.og_image) {
      metadata.openGraph.images = [
        {
          url: seopressMeta.og_image,
          width: 1200,
          height: 630,
          alt: seopressMeta.og_title || seopressMeta.title,
        },
      ]
    }
  }

  // Twitter Card (only if at least title is present)
  if (seopressMeta.twitter_title || seopressMeta.og_title || seopressMeta.title) {
    metadata.twitter = {
      card: 'summary_large_image',
      title: seopressMeta.twitter_title || seopressMeta.og_title || seopressMeta.title,
      description: seopressMeta.twitter_description || seopressMeta.og_description || seopressMeta.description,
    }

    // Add Twitter image if available
    if (seopressMeta.twitter_image || seopressMeta.og_image) {
      metadata.twitter.images = [seopressMeta.twitter_image || seopressMeta.og_image]
    }
  }

  return metadata
}

/**
 * Generate JSON-LD structured data for Article
 */
export function generateArticleJsonLd(data: {
  headline: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  image?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    author: {
      '@type': 'Person',
      name: data.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Le Bake Stories',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    image: data.image,
    url: data.url,
  }
}

/**
 * Generate JSON-LD structured data for Product
 */
export function generateProductJsonLd(data: {
  name: string
  description: string
  image?: string[]
  sku?: string
  brand?: string
  offers: {
    price: string
    priceCurrency: string
    availability: string
    url: string
  }
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
}) {
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: data.image || [],
    sku: data.sku,
    brand: {
      '@type': 'Brand',
      name: data.brand || 'Le Bake Stories',
    },
    offers: {
      '@type': 'Offer',
      price: data.offers.price,
      priceCurrency: data.offers.priceCurrency,
      availability: data.offers.availability,
      url: data.offers.url,
    },
  }

  if (data.aggregateRating && data.aggregateRating.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.aggregateRating.ratingValue,
      reviewCount: data.aggregateRating.reviewCount,
    }
  }

  return jsonLd
}

/**
 * Generate JSON-LD structured data for BreadcrumbList
 */
export function generateBreadcrumbJsonLd(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate JSON-LD structured data for Organization
 */
export function generateOrganizationJsonLd(data: {
  name: string
  url: string
  logo: string
  description?: string
  sameAs?: string[]
  contactPoint?: {
    telephone: string
    contactType: string
    email?: string
  }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs || [],
    contactPoint: data.contactPoint ? {
      '@type': 'ContactPoint',
      telephone: data.contactPoint.telephone,
      contactType: data.contactPoint.contactType,
      email: data.contactPoint.email,
    } : undefined,
  }
}

/**
 * Generate JSON-LD structured data for LocalBusiness
 */
export function generateLocalBusinessJsonLd(data: {
  name: string
  description: string
  url: string
  telephone: string
  address: {
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  geo?: {
    latitude: number
    longitude: number
  }
  openingHours?: string[]
  priceRange?: string
}) {
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: data.name,
    description: data.description,
    url: data.url,
    telephone: data.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      addressRegion: data.address.addressRegion,
      postalCode: data.address.postalCode,
      addressCountry: data.address.addressCountry,
    },
  }

  if (data.geo) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    }
  }

  if (data.openingHours) {
    jsonLd.openingHoursSpecification = data.openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(' ')[0],
      opens: hours.split(' ')[1],
      closes: hours.split(' ')[2],
    }))
  }

  if (data.priceRange) {
    jsonLd.priceRange = data.priceRange
  }

  return jsonLd
}

/**
 * Strip HTML tags from string
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number = 160): string {
  const stripped = stripHtmlTags(text)
  if (stripped.length <= maxLength) return stripped
  return stripped.substring(0, maxLength).trim() + '...'
}

/**
 * Clean and format URL
 */
export function cleanUrl(url: string): string {
  return url.replace(/([^:]\/)\/+/g, '$1').trim()
}

