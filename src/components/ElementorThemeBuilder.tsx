'use client'

import React, { useEffect, useState } from 'react'

interface ElementorThemeBuilderProps {
  pageId?: number
  type: 'header' | 'footer' | 'single' | 'archive'
  fallback?: React.ReactNode
}

/**
 * Elementor Theme Builder Component
 * Handles custom headers, footers, and other theme builder templates
 */
export default function ElementorThemeBuilder({ 
  pageId, 
  type, 
  fallback 
}: ElementorThemeBuilderProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchThemeBuilderContent = async () => {
      try {
        setLoading(true)
        setError(null)

        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'
        
        // Try to fetch theme builder content
        let templateUrl = ''
        
        if (pageId) {
          // Fetch specific page
          templateUrl = `${wpUrl}/?p=${pageId}`
        } else {
          // Try to fetch by type using Elementor API
          const response = await fetch(`${wpUrl}/wp-json/elementor/v1/templates?type=${type}`)
          const templates = await response.json()
          
          if (templates && templates.length > 0) {
            // Get the first active template
            const activeTemplate = templates.find((t: any) => t.status === 'publish')
            if (activeTemplate) {
              templateUrl = `${wpUrl}/?p=${activeTemplate.id}`
            }
          }
        }

        if (templateUrl) {
          const htmlResponse = await fetch(templateUrl, {
            cache: 'no-store',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Next.js)'
            }
          })

          if (!htmlResponse.ok) {
            throw new Error(`Failed to fetch theme builder template: ${htmlResponse.status}`)
          }

          const html = await htmlResponse.text()
          
          // Extract the specific section based on type
          let extractedContent = ''
          
          if (type === 'header') {
            const headerRegex = /<header[^>]*class="[^"]*elementor[^"]*"[^>]*>([\s\S]*?)<\/header>/i
            const match = html.match(headerRegex)
            if (match) {
              extractedContent = match[0]
            } else {
              // Try to find elementor header by data attribute
              const altRegex = /<div[^>]*data-elementor-type="header"[^>]*>([\s\S]*?)<\/div>/i
              const altMatch = html.match(altRegex)
              if (altMatch) {
                extractedContent = altMatch[0]
              }
            }
          } else if (type === 'footer') {
            const footerRegex = /<footer[^>]*class="[^"]*elementor[^"]*"[^>]*>([\s\S]*?)<\/footer>/i
            const match = html.match(footerRegex)
            if (match) {
              extractedContent = match[0]
            } else {
              // Try to find elementor footer by data attribute
              const altRegex = /<div[^>]*data-elementor-type="footer"[^>]*>([\s\S]*?)<\/div>/i
              const altMatch = html.match(altRegex)
              if (altMatch) {
                extractedContent = altMatch[0]
              }
            }
          } else {
            // For other types (single, archive), get the main content
            const contentRegex = /<div[^>]*data-elementor-type="[^"]*"[^>]*>([\s\S]*?)<\/div>/i
            const match = html.match(contentRegex)
            if (match) {
              extractedContent = match[0]
            }
          }

          if (extractedContent) {
            setContent(extractedContent)
          } else {
            console.warn(`No ${type} content found in Elementor template`)
          }
        }
      } catch (err: any) {
        console.error('Error fetching theme builder content:', err)
        setError(err.message || 'Failed to load theme builder content')
      } finally {
        setLoading(false)
      }
    }

    fetchThemeBuilderContent()
  }, [pageId, type])

  if (loading) {
    return (
      <div className="elementor-theme-builder-loading">
        <div className="animate-pulse">
          {type === 'header' && (
            <div className="h-20 bg-gray-200 w-full"></div>
          )}
          {type === 'footer' && (
            <div className="h-40 bg-gray-200 w-full"></div>
          )}
        </div>
      </div>
    )
  }

  if (error || !content) {
    return <>{fallback || null}</>
  }

  return (
    <div 
      className={`elementor-theme-builder elementor-theme-builder-${type}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

