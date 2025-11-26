'use client'

/**
 * Admin Panel Wrapper
 * Shows FloatingSEOPanel on ALL pages for admin/editor users
 * Works on homepage, blog posts, pages, products - everywhere!
 */

import { usePathname } from 'next/navigation'
import { FloatingSEOPanel } from './floating-seo-panel'
import { useEffect, useState } from 'react'

export function AdminPanelWrapper() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [postInfo, setPostInfo] = useState<{
    postId?: number
    postSlug?: string
    postType?: 'post' | 'page' | 'product'
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Ensure component only renders on client to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const extractAndFetchPostInfo = async () => {
      // Extract post information from URL
      const pathParts = pathname.split('/').filter(Boolean)

      // Homepage - fetch the page set as homepage
      if (pathParts.length === 0) {
        try {
          const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
          const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')

          // Try to get homepage page ID from WordPress settings
          const settingsResponse = await fetch(`${baseUrl}/wp-json/`, { cache: 'no-store' })

          if (settingsResponse.ok) {
            const siteData = await settingsResponse.json()
            const homepageId = siteData.home // WordPress stores homepage ID here

            if (homepageId) {
              setPostInfo({
                postId: homepageId,
                postSlug: 'home',
                postType: 'page',
              })
              return
            }
          }
        } catch (error) {
          console.error('Error fetching homepage ID:', error)
        }

        // Fallback: no post ID for homepage
        setPostInfo({
          postId: undefined,
          postSlug: 'home',
          postType: 'page',
        })
        return
      }

      let postSlug: string | undefined
      let postType: 'post' | 'page' | 'product' = 'page'

      // Check if it's a blog post: /blog/[slug]
      if (pathParts[0] === 'blog' && pathParts.length > 1) {
        postSlug = pathParts[1]
        postType = 'post'
      }
      // Check if it's a product: /product/[slug] or /shop/[slug]
      else if (pathParts[0] === 'product' && pathParts.length > 1) {
        postSlug = pathParts[1]
        postType = 'product'
      }
      else if (pathParts[0] === 'shop' && pathParts.length > 1) {
        postSlug = pathParts[1]
        postType = 'product'
      }
      // Otherwise, assume it's a page: /about, /contact, etc.
      else if (pathParts.length === 1) {
        postSlug = pathParts[0]
        postType = 'page'
      }
      // Nested pages: /about/team
      else if (pathParts.length > 1) {
        postSlug = pathParts[pathParts.length - 1]
        postType = 'page'
      }

      if (!postSlug) {
        setPostInfo({})
        return
      }

      // Fetch post ID from WordPress
      setIsLoading(true)
      try {
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
        const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')

        // Determine endpoint based on post type
        let endpoint = ''
        if (postType === 'post') {
          endpoint = `${wpUrl}/posts?slug=${postSlug}&_fields=id`
        } else if (postType === 'product') {
          endpoint = `${baseUrl}/wp-json/wc/v3/products?slug=${postSlug}&_fields=id`
        } else {
          endpoint = `${wpUrl}/pages?slug=${postSlug}&_fields=id`
        }

        const response = await fetch(endpoint, {
          cache: 'no-store'
        })

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0 && data[0].id) {
            setPostInfo({
              postId: data[0].id,
              postSlug,
              postType,
            })
          } else {
            setPostInfo({ postSlug, postType })
          }
        } else {
          // If fetch fails, still set slug and type
          setPostInfo({ postSlug, postType })
        }
      } catch (error) {
        console.error('Error fetching post ID:', error)
        // Set basic info even if fetch fails
        setPostInfo({ postSlug, postType })
      } finally {
        setIsLoading(false)
      }
    }

    extractAndFetchPostInfo()
  }, [pathname, isMounted])

  // Don't render anything on server or before mount
  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* Actual SEO Panel */}
      <FloatingSEOPanel
        postId={postInfo.postId}
        postSlug={postInfo.postSlug}
        postType={postInfo.postType}
      />
    </>
  )
}
