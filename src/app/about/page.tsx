'use client'

import React, { useState, useEffect } from 'react'
import { ClientLayout } from '@/components/themes/client-layout'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

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

// Component to load Elementor CSS from WordPress - OPTIMIZED VERSION
function ElementorStylesLoader({ pageId }: { pageId?: number }) {
  const [loadedCount, setLoadedCount] = useState(0)
  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'

  useEffect(() => {
    if (!pageId) return

    const linkElements: HTMLLinkElement[] = []
    let loadCount = 0

    // Add preconnect hint for faster loading
    const preconnectId = 'wp-preconnect'
    if (!document.getElementById(preconnectId)) {
      const preconnect = document.createElement('link')
      preconnect.id = preconnectId
      preconnect.rel = 'preconnect'
      preconnect.href = wpUrl
      document.head.appendChild(preconnect)
      linkElements.push(preconnect)

      const dnsPrefetch = document.createElement('link')
      dnsPrefetch.id = 'wp-dns-prefetch'
      dnsPrefetch.rel = 'dns-prefetch'
      dnsPrefetch.href = wpUrl
      document.head.appendChild(dnsPrefetch)
      linkElements.push(dnsPrefetch)
    }

    // IMMEDIATE: Load essential Elementor CSS without waiting for API
    const essentialCssUrls = [
      // Core Elementor CSS - load these first for basic styling
      `${wpUrl}/wp-content/plugins/elementor/assets/css/frontend.min.css`,
      `${wpUrl}/wp-content/uploads/elementor/css/post-${pageId}.css`,
      // Essential libraries for common widgets
      `${wpUrl}/wp-content/plugins/elementor/assets/lib/eicons/css/elementor-icons.min.css`,
      `${wpUrl}/wp-content/plugins/elementor/assets/lib/animations/animations.min.css`,
    ]

    console.log(`🎨 Loading essential Elementor CSS for page ${pageId}...`)

    // Inject essential CSS immediately
    essentialCssUrls.forEach((url, index) => {
      const linkId = `elementor-css-essential-${pageId}-${index}`

      // Skip if already exists
      if (document.getElementById(linkId)) {
        return
      }

      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = url

      link.onload = () => {
        loadCount++
        setLoadedCount(loadCount)
        console.log(`✅ Loaded: ${url.split('/').pop()}`)
      }

      link.onerror = () => {
        console.warn(`⚠️ Failed: ${url.split('/').pop()} (may not exist, continuing...)`)
      }

      document.head.appendChild(link)
      linkElements.push(link)
    })

    console.log(`✅ Injected ${essentialCssUrls.length} Elementor CSS files into <head>`)

    // Cleanup function
    return () => {
      linkElements.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [pageId, wpUrl])

  return null
}

// Component to load minimal Elementor JS for accordion functionality
function ElementorAccordionScript() {
  const [scriptsLoaded, setScriptsLoaded] = useState(false)

  useEffect(() => {
    if (scriptsLoaded) return

    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'
    let mounted = true

    const loadScripts = async () => {
      try {
        // Load only essential scripts for accordions
        const scripts = [
          `${wpUrl}/wp-includes/js/jquery/jquery.min.js`,
          `${wpUrl}/wp-content/plugins/elementor/assets/js/frontend.min.js`
        ]

        for (const src of scripts) {
          await new Promise<void>((resolve, reject) => {
            const scriptId = `elementor-${src.split('/').pop()?.replace('.', '-')}`

            // Check if already loaded
            if (document.getElementById(scriptId)) {
              resolve()
              return
            }

            // Skip jQuery if already loaded
            if (src.includes('jquery') && (window as any).jQuery) {
              resolve()
              return
            }

            const script = document.createElement('script')
            script.src = src
            script.id = scriptId
            script.async = false
            script.onload = () => resolve()
            script.onerror = () => reject(new Error(`Failed to load ${src}`))
            document.body.appendChild(script)
          })
        }

        if (!mounted) return

        // Initialize accordions after scripts load
        setTimeout(() => {
          if (typeof window !== 'undefined' && (window as any).jQuery) {
            const $ = (window as any).jQuery

            // Initialize Elementor accordions
            $('.elementor-accordion').each(function(this: HTMLElement) {
              const $accordion = $(this)

              $accordion.find('.elementor-tab-title').off('click').on('click', function(this: HTMLElement) {
                const $title = $(this)
                const $content = $title.next('.elementor-tab-content')
                const $item = $title.parent('.elementor-accordion-item')

                if ($item.hasClass('elementor-active')) {
                  $item.removeClass('elementor-active')
                  $content.slideUp(300)
                } else {
                  // Close other items if single mode
                  $accordion.find('.elementor-accordion-item').removeClass('elementor-active')
                  $accordion.find('.elementor-tab-content').slideUp(300)

                  // Open clicked item
                  $item.addClass('elementor-active')
                  $content.slideDown(300)
                }
              })
            })

            console.log('✅ Elementor accordion functionality initialized')
          }
        }, 500)

        setScriptsLoaded(true)
      } catch (error) {
        console.error('Error loading accordion scripts:', error)
        setScriptsLoaded(true)
      }
    }

    loadScripts()

    return () => {
      mounted = false
    }
  }, [scriptsLoaded])

  return null
}

// Component to safely render HTML content with error handling (for non-Elementor pages)
function ContentRenderer({ content }: { content: string }) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [safeContent, setSafeContent] = useState<string>('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sanitize content before rendering to avoid any DOM manipulation issues
  useEffect(() => {
    if (content) {
      try {
        // Additional sanitization pass - remove any remaining dangerous elements
        let sanitized = content
        
        // Remove script tags and their content (comprehensive regex)
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        
        // Remove noscript, iframe, embed, object tags
        sanitized = sanitized.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
        sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '')
        sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        
        setSafeContent(sanitized)
      } catch (error) {
        console.error('Error sanitizing content:', error)
        setSafeContent(content)
      }
    } else {
      setSafeContent('')
    }
  }, [content])

  // Render content using innerHTML - content is already sanitized
  // This avoids any DOM manipulation that could cause removeChild errors
  useEffect(() => {
    if (!isMounted || !safeContent) return

    let isMountedRef = true
    let rafId: number | null = null

    // Use requestAnimationFrame to ensure DOM is ready
    rafId = requestAnimationFrame(() => {
      if (!isMountedRef || !contentRef.current) return

      try {
        // Set content directly - no post-processing needed since it's pre-sanitized
        contentRef.current.innerHTML = safeContent
      } catch (error) {
        console.error('Error rendering content:', error)
        if (contentRef.current && isMountedRef) {
          try {
            contentRef.current.innerHTML = '<p>Error loading content. Please refresh the page.</p>'
          } catch (innerError) {
            console.error('Error setting error message:', innerError)
          }
        }
      }
    })

    // Cleanup function - safely clear content on unmount
    return () => {
      isMountedRef = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      // Safely clear content on unmount to prevent React cleanup issues
      if (contentRef.current) {
        try {
          // Clear content without triggering removeChild errors
          const container = contentRef.current
          if (container && container.parentNode) {
            // Use textContent instead of innerHTML to avoid DOM manipulation issues
            container.textContent = ''
          }
        } catch (cleanupError) {
          // Silently ignore cleanup errors
          console.warn('Cleanup warning (safe to ignore):', cleanupError)
        }
      }
    }
  }, [safeContent, isMounted])

  // Don't render on server to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="wordpress-content elementor-content">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={contentRef}
      className="wordpress-content elementor-content"
      suppressHydrationWarning
    />
  )
}

export default function AboutPage() {
  const [page, setPage] = useState<WordPressPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processedContent, setProcessedContent] = useState<string>('')

  // Sanitize HTML content to prevent script execution and DOM manipulation errors
  // BUT preserve Elementor inline styles and classes
  const sanitizeHtmlContent = (html: string): string => {
    if (!html || typeof html !== 'string') return ''
    
    try {
      let sanitized = html
      
      // Remove script tags and their content (more comprehensive)
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      
      // Remove noscript tags that might contain scripts
      sanitized = sanitized.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      
      // Remove iframe tags (can execute scripts)
      sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      
      // Remove embed and object tags
      sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '')
      sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      
      // Remove event handlers from elements (onclick, onerror, onload, etc.)
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
      
      // Remove javascript: protocol from links and other attributes
      sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
      sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src="#"')
      sanitized = sanitized.replace(/action\s*=\s*["']javascript:[^"']*["']/gi, 'action="#"')
      
      // Remove data attributes that might trigger scripts (but preserve Elementor data attributes)
      // Elementor uses data-settings, data-id, data-element-type, etc. which are safe
      sanitized = sanitized.replace(/\s*data-[^=]*\s*=\s*["']javascript:[^"']*["']/gi, '')
      
      // Remove style attributes with expression() (IE-specific but can cause issues)
      // BUT preserve other inline styles that Elementor uses
      sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '')
      
      // Remove any remaining script-like content in attributes
      sanitized = sanitized.replace(/<[^>]*\s+(?:on\w+|javascript:)[^>]*>/gi, (match) => {
        return match.replace(/\s+(?:on\w+|javascript:)[^=]*=["'][^"']*["']/gi, '')
      })
      
      // Note: We're preserving:
      // - All Elementor classes (elementor-*)
      // - Inline styles (style="...") - Elementor uses these for custom styling
      // - Data attributes (data-elementor-*, data-settings, etc.)
      // - All HTML structure
      
      return sanitized
    } catch (error) {
      console.error('Error sanitizing HTML content:', error)
      return ''
    }
  }

  useEffect(() => {
    fetchAboutPage()
  }, [])

  // Process content when page is loaded - MUST be before any conditional returns
  useEffect(() => {
    if (page?.content?.rendered) {
      try {
        let content = page.content.rendered
        
        // Get WordPress URL - try both env vars
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'
        
        // Fix image src attributes - handle both absolute and relative URLs
        content = content.replace(
          /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
          (match, before, src, after) => {
            try {
              let imageUrl = src
              
              // Handle relative URLs
              if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                // Relative URL - prepend WordPress URL
                imageUrl = `${wpUrl.replace(/\/$/, '')}${imageUrl}`
              } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
                // Relative URL without leading slash
                imageUrl = `${wpUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
              }
              
              // Ensure image has proper attributes
              const hasLoading = before.includes('loading=') || after.includes('loading=')
              const loadingAttr = hasLoading ? '' : ' loading="lazy"'
              
              return `<img${before}src="${imageUrl}"${after}${loadingAttr}>`
            } catch (err) {
              console.warn('Error processing image URL:', err)
              return match
            }
          }
        )
        
        // Fix background-image URLs in style attributes (common in Elementor)
        content = content.replace(
          /style=["']([^"']*background-image:\s*url\(["']?)([^"')]+)(["']?\)[^"']*)["']/gi,
          (match, prefix, url, suffix) => {
            try {
              let imageUrl = url
              
              // Handle relative URLs
              if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                imageUrl = `${wpUrl.replace(/\/$/, '')}${imageUrl}`
              } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
                imageUrl = `${wpUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
              }
              
              return `style="${prefix}${imageUrl}${suffix}"`
            } catch (err) {
              console.warn('Error processing background image URL:', err)
              return match
            }
          }
        )
        
        // Fix data-src attributes (lazy loading)
        content = content.replace(
          /data-src=["']([^"']+)["']/gi,
          (match, src) => {
            try {
              let imageUrl = src
              if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                imageUrl = `${wpUrl.replace(/\/$/, '')}${imageUrl}`
              } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
                imageUrl = `${wpUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
              }
              return `data-src="${imageUrl}"`
            } catch (err) {
              console.warn('Error processing data-src URL:', err)
              return match
            }
          }
        )
        
        setProcessedContent(content)
      } catch (error) {
        console.error('Error processing page content:', error)
        setProcessedContent(page.content.rendered || '')
      }
    } else {
      setProcessedContent('')
    }
  }, [page])

  const fetchAboutPage = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, try to get all pages to see what's available (for debugging)
      let availablePages: any[] = []
      try {
        const allPagesRes = await fetch('/api/pages', { cache: 'no-store' })
        const allPagesJson = await allPagesRes.json()
        if (allPagesJson.success && allPagesJson.data) {
          availablePages = allPagesJson.data
          console.log('📋 Available pages in WordPress:', availablePages.map((p: any) => ({
            id: p.id,
            title: p.title?.rendered,
            slug: p.slug,
            status: p.status
          })))
        }
      } catch (err) {
        console.warn('Could not fetch all pages list:', err)
      }

      // Try multiple slug variations for About page
      // Note: WordPress may add numbers to slugs if duplicates exist (e.g., "about-us-2")
      const slugs = ['about-us-2', 'about-us', 'about', 'aboutus']
      let foundPage = null
      const errors: string[] = []

      for (const slug of slugs) {
        try {
          const res = await fetch(`/api/pages?slug=${slug}`, { cache: 'no-store' })
          
          if (!res.ok) {
            const errorJson = await res.json().catch(() => ({}))
            errors.push(`Slug "${slug}": ${res.status} ${res.statusText} - ${errorJson.message || 'Not found'}`)
            console.log(`❌ Failed to fetch page with slug "${slug}":`, res.status, errorJson.message || res.statusText)
            continue
          }

      const json = await res.json()

      if (json.success && json.data) {
            foundPage = json.data
            console.log(`✅ Found page with slug: ${slug}`)
            break
          } else {
            errors.push(`Slug "${slug}": Page not found`)
          }
        } catch (err: any) {
          errors.push(`Slug "${slug}": ${err.message || 'Network error'}`)
          console.error(`Failed to fetch page with slug: ${slug}`, err)
        }
      }

      if (foundPage) {
        setPage(foundPage)
      } else {
        // Create a helpful error message
        let errorMsg = 'About page not found in WordPress.\n\n'
        errorMsg += 'Tried slugs: ' + slugs.join(', ') + '\n\n'
        
        if (availablePages.length > 0) {
          const aboutRelated = availablePages.filter((p: any) => 
            p.slug?.toLowerCase().includes('about') || 
            p.title?.rendered?.toLowerCase().includes('about')
          )
          
          if (aboutRelated.length > 0) {
            errorMsg += 'Found similar pages:\n'
            aboutRelated.forEach((p: any) => {
              errorMsg += `- "${p.title?.rendered}" (slug: "${p.slug}", status: ${p.status})\n`
            })
            errorMsg += '\nPlease check the page slug in WordPress and ensure it\'s published.'
          } else {
            errorMsg += `Found ${availablePages.length} pages in WordPress, but none match "about".\n`
            errorMsg += 'Available page slugs: ' + availablePages.slice(0, 5).map((p: any) => p.slug).join(', ')
            if (availablePages.length > 5) errorMsg += '...'
          }
        } else {
          errorMsg += 'Could not fetch pages list from WordPress.\n'
          errorMsg += 'Please check:\n'
          errorMsg += '1. WordPress API is accessible\n'
          errorMsg += '2. NEXT_PUBLIC_WORDPRESS_API_URL is configured correctly\n'
          errorMsg += '3. The About page exists and is published in WordPress'
        }
        
        errorMsg += '\n\nErrors:\n' + errors.join('\n')
        setError(errorMsg)
      }
    } catch (error: any) {
      console.error('Error fetching about page:', error)
      setError(`Failed to load about page: ${error.message || 'Unknown error'}`)
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
                About Page Not Found
            </h1>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700 whitespace-pre-line text-sm">
                  {error || 'About page not found in WordPress'}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-800 mb-2">Troubleshooting Steps:</h2>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Go to your WordPress admin panel</li>
                    <li>Check if the &quot;About Us&quot; page exists and is published</li>
                    <li>Verify the page slug (it should be &quot;about-us&quot; or &quot;about&quot;)</li>
                    <li>Visit <code className="bg-gray-100 px-2 py-1 rounded">/api/debug-pages</code> to see all available pages</li>
                    <li>Check your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file for <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_WORDPRESS_API_URL</code></li>
                  </ol>
                </div>
                <div className="flex gap-4 pt-4">
            <Link
              href="/"
                    className="text-purple-700 hover:text-purple-900 font-medium underline"
            >
              Go to Homepage
            </Link>
                  <Link
                    href="/api/debug-pages"
                    className="text-blue-700 hover:text-blue-900 font-medium underline"
                    target="_blank"
                  >
                    View Available Pages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ClientLayout>
    )
  }

  const pageTitle = page?.title?.rendered || ''
  const pageContent = processedContent || page?.content?.rendered || ''

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

      {/* Simplified Elementor rendering - CSS and minimal JS for accordions */}
      {page?.id && <ElementorStylesLoader pageId={page.id} />}
      <ElementorAccordionScript />

      <div className="elementor-wrapper">
        <ContentRenderer content={sanitizeHtmlContent(pageContent)} />
      </div>

      {/* Add style tag for Elementor structure fixes */}
      <style jsx global>{`
            /* Remove wrapper constraints for Elementor content */
            .elementor-wrapper {
              width: 100%;
              margin: 0;
              padding: 0;
            }

            /* Accordion specific styles */
            .elementor-accordion .elementor-tab-content {
              display: none;
              overflow: hidden;
            }

            .elementor-accordion .elementor-accordion-item.elementor-active .elementor-tab-content {
              display: block;
            }

            .elementor-accordion .elementor-tab-title {
              cursor: pointer;
              user-select: none;
              transition: all 0.3s ease;
            }

            .elementor-accordion .elementor-tab-title:hover {
              opacity: 0.8;
            }

            .elementor-accordion .elementor-tab-title .elementor-accordion-icon {
              transition: transform 0.3s ease;
            }

            .elementor-accordion .elementor-accordion-item.elementor-active .elementor-tab-title .elementor-accordion-icon {
              transform: rotate(180deg);
            }
            
            /* Let Elementor handle its own layout completely */
            .elementor-wrapper .wordpress-content,
            .elementor-wrapper .elementor-content {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
            }
            
            /* Ensure Elementor sections are full width and properly positioned */
            .elementor-wrapper .elementor-section {
              width: 100%;
              position: relative;
              margin: 0;
              padding: 0;
            }
            
            /* Reset any conflicting Tailwind or container styles */
            .elementor-wrapper .elementor-container {
              max-width: 100%;
              margin: 0 auto;
              padding-left: 0;
              padding-right: 0;
            }
            
            .elementor-wrapper .elementor-row {
              display: flex;
              flex-wrap: wrap;
              margin-left: 0;
              margin-right: 0;
            }
            
            .elementor-wrapper .elementor-column {
              position: relative;
              min-height: 1px;
              padding-left: 0;
              padding-right: 0;
            }
            
            /* Image fixes - let Elementor handle image styling */
            .elementor-wrapper .elementor-content img,
            .elementor-wrapper .wordpress-content img {
              max-width: 100%;
              height: auto;
              display: block;
            }
            
            .elementor-wrapper .elementor-content img[src=""],
            .elementor-wrapper .elementor-content img:not([src]),
            .elementor-wrapper .wordpress-content img[src=""],
            .elementor-wrapper .wordpress-content img:not([src]) {
              display: none;
            }
            
            /* Ensure all Elementor elements use border-box */
            .elementor-wrapper *,
            .elementor-wrapper *::before,
            .elementor-wrapper *::after {
              box-sizing: border-box;
            }
            
            /* Prevent any global styles from interfering */
            .elementor-wrapper {
              isolation: isolate;
            }
            
            /* Ensure Elementor widgets are not constrained */
            .elementor-wrapper .elementor-widget {
              width: 100%;
            }
            
            /* Remove any prose or typography overrides */
            .elementor-wrapper .prose,
            .elementor-wrapper .prose * {
              max-width: none;
              color: inherit;
              font-size: inherit;
              line-height: inherit;
            }
          `}</style>
    </ClientLayout>
  )
}
