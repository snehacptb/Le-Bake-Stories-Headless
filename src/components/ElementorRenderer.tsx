'use client'

import React, { useEffect, useState, useRef } from 'react'
import { elementorService, ElementorAssets } from '@/lib/elementor-service'
import { useElementorAssets } from '@/hooks/useElementorAssets'

interface ElementorRendererProps {
  pageId: number
  content: string
  className?: string
}

/**
 * Comprehensive Elementor Renderer Component
 * Handles:
 * - CSS loading
 * - JavaScript initialization
 * - Widget activation
 * - Dynamic content (forms, sliders, etc.)
 * - Theme builder support
 */
export default function ElementorRenderer({ pageId, content, className = '' }: ElementorRendererProps) {
  // Use the custom hook that handles assets without React lifecycle issues
  const { cssLoaded, jsLoaded, error: assetsError } = useElementorAssets(pageId)
  
  const [widgetsInitialized, setWidgetsInitialized] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [assets, setAssets] = useState<ElementorAssets | null>(null)

  // Step 1: Load Elementor assets
  useEffect(() => {
    let mounted = true

    const loadAssets = async () => {
      try {
        console.log('📦 Loading Elementor assets for page:', pageId)
        const elementorAssets = await elementorService.getElementorAssets(pageId)
        
        if (!mounted) return

        setAssets(elementorAssets)
        console.log('✅ Elementor assets loaded:', elementorAssets)
      } catch (error) {
        console.error('❌ Error loading Elementor assets:', error)
      }
    }

    loadAssets()

    return () => {
      mounted = false
    }
  }, [pageId])

  // Assets are now loaded by the custom hook - no useEffect needed here
  // This prevents React cleanup issues

  // Step 4: Initialize Elementor widgets
  useEffect(() => {
    if (!jsLoaded || !containerRef.current || widgetsInitialized) return

    const initializeWidgets = async () => {
      console.log('🎯 Initializing Elementor widgets...')

      let checkInterval: NodeJS.Timeout | null = null
      let timeoutId: NodeJS.Timeout | null = null

      try {
        // Wait for Elementor frontend to be available
        checkInterval = setInterval(() => {
          if (typeof window !== 'undefined' && (window as any).elementorFrontend) {
            if (checkInterval) clearInterval(checkInterval)
            
            const elementorFrontend = (window as any).elementorFrontend

            try {
              // Initialize Elementor frontend
              if (typeof elementorFrontend.init === 'function') {
                console.log('🚀 Initializing Elementor Frontend...')
                elementorFrontend.init()
              }

              // Initialize Elementor Pro widgets if available
              if ((window as any).elementorProFrontend) {
                console.log('🚀 Initializing Elementor Pro Frontend...')
                const elementorProFrontend = (window as any).elementorProFrontend
                if (typeof elementorProFrontend.init === 'function') {
                  elementorProFrontend.init()
                }
              }

              // Trigger Elementor frontend hooks
              if (elementorFrontend.hooks && containerRef.current) {
                elementorFrontend.hooks.doAction('frontend/element_ready/global', containerRef.current)
              }

              // Import and use widget handlers
              import('@/lib/elementor-widgets').then(({ ElementorWidgetHandlers }) => {
                if (containerRef.current) {
                  try {
                    ElementorWidgetHandlers.initializeAll(containerRef.current)
                  } catch (widgetError) {
                    console.error('Error initializing widget handlers:', widgetError)
                  }
                }
              }).catch((importError) => {
                console.error('Error importing widget handlers:', importError)
              })

              setWidgetsInitialized(true)
              console.log('✅ Elementor widgets initialized')
            } catch (error) {
              console.error('Error initializing Elementor:', error)
              setWidgetsInitialized(true) // Set to true anyway to prevent infinite loop
            }
          }
        }, 100)

        // Timeout after 10 seconds
        timeoutId = setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval)
          if (!widgetsInitialized) {
            console.warn('⚠️ Elementor frontend not available after 10 seconds')
            setWidgetsInitialized(true)
          }
        }, 10000)
      } catch (error) {
        console.error('Error in widget initialization setup:', error)
        setWidgetsInitialized(true)
      }

      // Cleanup function
      return () => {
        if (checkInterval) clearInterval(checkInterval)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(initializeWidgets, 500)

    return () => {
      clearTimeout(initTimeout)
    }
  }, [jsLoaded, widgetsInitialized, assets])

  return (
    <div 
      ref={containerRef}
      className={`elementor-wrapper ${className}`}
      data-elementor-page-id={pageId}
    >
      {/* Loading indicator */}
      {(!cssLoaded || !jsLoaded) && (
        <div className="elementor-loading">
          <div className="elementor-loading-spinner">
            <div className="elementor-loading-spinner-inner">
              <div className="elementor-loading-spinner-circle"></div>
            </div>
          </div>
        </div>
      )}

      {/* Render theme builder header if exists */}
      {assets?.themeBuilder?.header && (
        <div 
          className="elementor-theme-builder-header"
          dangerouslySetInnerHTML={{ __html: assets.themeBuilder.header }}
        />
      )}

      {/* Main content */}
      <div 
        className="elementor-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Render theme builder footer if exists */}
      {assets?.themeBuilder?.footer && (
        <div 
          className="elementor-theme-builder-footer"
          dangerouslySetInnerHTML={{ __html: assets.themeBuilder.footer }}
        />
      )}

      {/* Loading styles */}
      <style jsx>{`
        .elementor-loading {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .elementor-loading-spinner {
          width: 50px;
          height: 50px;
        }

        .elementor-loading-spinner-inner {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .elementor-loading-spinner-circle {
          width: 100%;
          height: 100%;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #9333ea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .elementor-wrapper {
          width: 100%;
          margin: 0;
          padding: 0;
          isolation: isolate;
        }

        .elementor-wrapper :global(.elementor-section) {
          width: 100%;
          position: relative;
        }

        .elementor-wrapper :global(.elementor-animation-active) {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  )
}

