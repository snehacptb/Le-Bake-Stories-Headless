'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface DynamicPageContentProps {
  page: any
}

export default function DynamicPageContent({ page }: DynamicPageContentProps) {
  const [processedContent, setProcessedContent] = useState('')

  useEffect(() => {
    if (page?.content?.rendered) {
      // Process WordPress content to handle relative URLs
      let content = page.content.rendered
      
      // Convert WordPress URLs to frontend URLs
      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://headless-wp.local'
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
      
      // Replace WordPress domain links with frontend domain
      content = content.replace(
        new RegExp(wpUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        frontendUrl
      )
      
      // Handle relative links
      content = content.replace(
        /href="\/([^"]*?)"/g,
        `href="${frontendUrl}/$1"`
      )
      
      setProcessedContent(content)
    }
  }, [page])

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600">The requested page could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {page.title?.rendered || page.title}
        </h1>
        
        {page.excerpt?.rendered && (
          <div 
            className="text-xl text-gray-600 mb-6"
            dangerouslySetInnerHTML={{ __html: page.excerpt.rendered }}
          />
        )}
        
        {/* Featured Image */}
        {page.featured_media && page._embedded?.['wp:featuredmedia']?.[0] && (
          <div className="mb-8">
            <Image
              src={page._embedded['wp:featuredmedia'][0].source_url}
              alt={page._embedded['wp:featuredmedia'][0].alt_text || page.title?.rendered || ''}
              width={800}
              height={400}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </header>

      {/* Page Content */}
      <div className="prose prose-lg max-w-none">
        {processedContent ? (
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: page.content?.rendered || '' }} />
        )}
      </div>

      {/* Page Meta Information */}
      {(page.date || page.modified) && (
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-sm text-gray-500 space-y-1">
            {page.date && (
              <p>Published: {new Date(page.date).toLocaleDateString()}</p>
            )}
            {page.modified && page.modified !== page.date && (
              <p>Last updated: {new Date(page.modified).toLocaleDateString()}</p>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
