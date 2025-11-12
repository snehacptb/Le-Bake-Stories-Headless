'use client'

import { useEffect, useState } from 'react'
import { DynamicFavicon } from './dynamic-favicon'
import { SiteInfo } from '@/types'

export function SiteMetadata() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const response = await fetch('/api/cache/site-info', { 
          cache: 'no-store',
          next: { revalidate: 300 } // Revalidate every 5 minutes
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        if (data?.success && data?.data) {
          setSiteInfo(data.data)
          
          // Update document title if site title is available
          if (data.data.title && data.data.title.trim()) {
            document.title = data.data.title
          }
        }
      } catch (error) {
        console.error('Error fetching site info for metadata:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSiteInfo()
  }, [])

  // Don't render favicon component until we have site info or confirmed it's not available
  if (loading) {
    return null
  }

  return (
    <DynamicFavicon 
      siteIconUrl={siteInfo?.siteIcon?.url}
      fallbackFaviconUrl="/favicon.svg"
    />
  )
}
