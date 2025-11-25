'use client'

/**
 * SEO Debug Panel
 * Shows SEO metadata on the page for testing (only in development)
 */

import { useEffect, useState } from 'react'

interface SEODebugPanelProps {
  slug: string
  type?: 'post' | 'page' | 'product'
}

export function SEODebugPanel({ slug, type = 'post' }: SEODebugPanelProps) {
  const [seoData, setSeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [health, setHealth] = useState<any>(null)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // First, check SEOPress health
        const healthResponse = await fetch('/api/seopress-health')
        const healthData = await healthResponse.json()
        setHealth(healthData.health)

        if (!healthData.health.active) {
          setError('SEOPress plugin is not active or not providing data')
          setSeoData(null)
          setLoading(false)
          return
        }

        // Try custom endpoint first
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://manila.esdemo.in/wp-json/wp/v2'
        const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')
        const seopressEndpoint = `${baseUrl}/wp-json/seopress/v1`
        
        try {
          const response = await fetch(`${seopressEndpoint}/seo/${type}/${slug}`)
          
          if (response.ok) {
            const data = await response.json()
            setSeoData(data)
            setError(null)
          } else {
            // Fallback to REST API
            await fetchFromRestAPI()
          }
        } catch (err) {
          // Fallback to REST API
          await fetchFromRestAPI()
        }
      } catch (err: any) {
        setError(err.message)
        setSeoData(null)
      } finally {
        setLoading(false)
      }
    }

    const fetchFromRestAPI = async () => {
      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://manila.esdemo.in/wp-json/wp/v2'
      const response = await fetch(`${wpUrl}/${type}s?slug=${slug}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0 && data[0].seopress_meta) {
          setSeoData(data[0].seopress_meta)
          setError(null)
        } else {
          throw new Error('SEOPress data not found in REST API response')
        }
      } else {
        throw new Error(`REST API returned ${response.status}`)
      }
    }

    fetchData()
  }, [slug, type])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        {isOpen ? '✕ Close' : '🔍 SEO Debug'}
      </button>

      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 max-h-[600px] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
            SEO Debug Panel
          </h3>
          
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            <div><strong>Type:</strong> {type}</div>
            <div><strong>Slug:</strong> {slug}</div>
          </div>

          {loading && (
            <div className="text-sm text-gray-600 dark:text-gray-400">Loading SEO data...</div>
          )}

          {/* Health Status */}
          {health && (
            <div className={`p-3 rounded text-sm mb-3 ${
              health.active 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
            }`}>
              <strong>{health.message}</strong>
              <div className="mt-1 text-xs">
                <div>REST API: {health.restAPI ? '✅' : '❌'}</div>
                <div>Custom Endpoints: {health.customEndpoints ? '✅' : '❌'}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded text-sm">
              <strong>❌ Error:</strong> {error}
              <div className="mt-2 text-xs">
                {health && !health.active 
                  ? 'SEOPress plugin is deactivated or not installed in WordPress.'
                  : 'Unable to fetch SEO data for this content.'}
              </div>
            </div>
          )}

          {seoData && (
            <div className="space-y-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded">
                <div className="text-green-800 dark:text-green-200 font-semibold text-sm">
                  ✅ SEOPress is working!
                </div>
              </div>

              <div className="space-y-2">
                {seoData.title && (
                  <div className="text-sm">
                    <strong className="text-gray-900 dark:text-white">Title:</strong>
                    <div className="text-gray-700 dark:text-gray-300">{seoData.title}</div>
                  </div>
                )}

                {seoData.description && (
                  <div className="text-sm">
                    <strong className="text-gray-900 dark:text-white">Description:</strong>
                    <div className="text-gray-700 dark:text-gray-300">{seoData.description}</div>
                  </div>
                )}

                {seoData.canonical && (
                  <div className="text-sm">
                    <strong className="text-gray-900 dark:text-white">Canonical:</strong>
                    <div className="text-gray-700 dark:text-gray-300 truncate">{seoData.canonical}</div>
                  </div>
                )}

                {seoData.og_image && (
                  <div className="text-sm">
                    <strong className="text-gray-900 dark:text-white">OG Image:</strong>
                    <img src={seoData.og_image} alt="OG" className="mt-1 rounded max-w-full h-auto" />
                  </div>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white">
                    Full SEO Data (JSON)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(seoData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            This panel only appears in development mode
          </div>
        </div>
      )}
    </div>
  )
}

