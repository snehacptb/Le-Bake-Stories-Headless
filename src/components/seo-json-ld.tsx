/**
 * SEO JSON-LD Component
 * Client component for rendering structured data
 */

'use client'

import { useEffect } from 'react'

interface JsonLdProps {
  data: any
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * Organization Schema - Add to homepage
 */
export function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: 'Le Bake Stories',
    description: 'Artisan bakery specializing in bespoke cakes, handcrafted pastries, and artisan desserts baked fresh daily in Kochi.',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/og-image.jpg`,
    telephone: '+91-XXXX-XXXXXX', // Replace with actual phone
    email: 'info@lebakestories.com', // Replace with actual email
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Your Street Address', // Replace
      addressLocality: 'Kochi',
      addressRegion: 'Kerala',
      postalCode: '682XXX', // Replace
      addressCountry: 'IN',
    },
    priceRange: '₹₹',
    sameAs: [
      'https://www.facebook.com/lebakestories', // Update with real URLs
      'https://www.instagram.com/lebakestories',
      'https://twitter.com/lebakestories',
    ],
  }

  return <JsonLd data={data} />
}

/**
 * Website Schema
 */
export function WebsiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Le Bake Stories',
    description: 'Celebrate life\'s sweetest moments with bespoke cakes, handcrafted pastries, and artisan desserts.',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLd data={data} />
}

