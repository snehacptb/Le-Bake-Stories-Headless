/**
 * Custom hook to load Elementor assets without React cleanup issues
 * This moves asset loading outside React's lifecycle management
 */

import { useEffect, useState } from 'react'

interface UseElementorAssetsResult {
  cssLoaded: boolean
  jsLoaded: boolean
  error: string | null
}

export function useElementorAssets(pageId: number | undefined): UseElementorAssetsResult {
  const [cssLoaded, setCssLoaded] = useState(false)
  const [jsLoaded, setJsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pageId) return

    let mounted = true

    // Use a separate script tag that React won't track
    const loadAssets = async () => {
      try {
        // Fetch assets info
        const response = await fetch(`/api/elementor-assets?pageId=${pageId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch assets')
        }

        const { assets } = await response.json()

        // Load CSS via native method (not React)
        if (assets.css && assets.css.length > 0) {
          const cssPromises = assets.css.map((url: string, index: number) => {
            return new Promise<void>((resolve) => {
              const id = `elementor-css-${pageId}-${index}`
              if (document.querySelector(`#${id}`)) {
                resolve()
                return
              }

              // Create link element outside React's control
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = url
              link.id = id
              // Mark as manually managed to prevent React interference
              link.setAttribute('data-rh', 'true')
              link.setAttribute('data-manual-load', 'true')

              link.onload = () => resolve()
              link.onerror = () => resolve()

              // Append directly to head without React tracking
              if (document.head) {
                document.head.appendChild(link)
              }
            })
          })

          await Promise.all(cssPromises)
          if (mounted) setCssLoaded(true)
        } else {
          if (mounted) setCssLoaded(true)
        }

        // Load JS via native method
        if (assets.js && assets.js.length > 0) {
          for (const url of assets.js) {
            await new Promise<void>((resolve) => {
              const fileName = url.split('/').pop()
              const id = `elementor-js-${fileName}`
              
              if (document.querySelector(`#${id}`)) {
                resolve()
                return
              }

              // Skip if jQuery already loaded
              if (url.includes('jquery') && (window as any).jQuery) {
                resolve()
                return
              }

              const script = document.createElement('script')
              script.src = url
              script.id = id
              script.async = false
              // Mark as manually managed to prevent React interference
              script.setAttribute('data-manual-load', 'true')

              script.onload = () => resolve()
              script.onerror = () => resolve()

              // Append directly to body without React tracking
              if (document.body) {
                document.body.appendChild(script)
              }
            })
          }
          if (mounted) setJsLoaded(true)
        } else {
          if (mounted) setJsLoaded(true)
        }
      } catch (err: any) {
        console.error('Error loading Elementor assets:', err)
        if (mounted) {
          setError(err.message)
          setCssLoaded(true)
          setJsLoaded(true)
        }
      }
    }

    loadAssets()

    return () => {
      mounted = false
      // Don't try to remove elements - let them stay
      // They're harmless and removing them causes the error
    }
  }, [pageId])

  return { cssLoaded, jsLoaded, error }
}

