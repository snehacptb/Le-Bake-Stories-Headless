'use client'

import { useEffect } from 'react'

interface DynamicFaviconProps {
  siteIconUrl?: string
  fallbackFaviconUrl?: string
}

export function DynamicFavicon({ 
  siteIconUrl, 
  fallbackFaviconUrl = '/favicon.svg' 
}: DynamicFaviconProps) {
  useEffect(() => {
    const updateFavicon = (iconUrl: string) => {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]')
      existingLinks.forEach(link => link.remove())

      // Create new favicon link
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
      link.href = iconUrl
      
      // Add to head
      document.head.appendChild(link)

      // Also update apple-touch-icon for better mobile support
      const appleTouchIcon = document.createElement('link')
      appleTouchIcon.rel = 'apple-touch-icon'
      appleTouchIcon.href = iconUrl
      document.head.appendChild(appleTouchIcon)
    }

    // Use site icon if available, otherwise fallback
    const iconUrl = siteIconUrl || fallbackFaviconUrl
    updateFavicon(iconUrl)

    // Cleanup function
    return () => {
      // Restore default favicon on unmount if needed
      if (!siteIconUrl) {
        updateFavicon(fallbackFaviconUrl)
      }
    }
  }, [siteIconUrl, fallbackFaviconUrl])

  return null // This component doesn't render anything visible
}
