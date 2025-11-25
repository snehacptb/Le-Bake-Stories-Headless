'use client'

/**
 * Admin Panel Wrapper
 * Wraps the FloatingSEOPanel and shows it only for admin/editor users
 * This component is added to the root layout for site-wide availability
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

  // Ensure component only renders on client to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
    // Try to extract post information from the current page
    // This is a best-effort approach - you may need to customize this based on your routing
    
    const extractPostInfo = () => {
      // Example patterns:
      // /blog/post-slug -> blog post
      // /products/product-slug -> product
      // /page-slug -> page
      
      const pathParts = pathname.split('/').filter(Boolean)
      
      if (pathParts.length === 0) {
        // Homepage
        setPostInfo({})
        return
      }

      // Check if it's a blog post
      if (pathParts[0] === 'blog' && pathParts.length > 1) {
        setPostInfo({
          postSlug: pathParts[1],
          postType: 'post',
        })
        return
      }

      // Check if it's a product
      if (pathParts[0] === 'products' && pathParts.length > 1) {
        setPostInfo({
          postSlug: pathParts[1],
          postType: 'product',
        })
        return
      }

      // Check if it's a shop page (might have product details)
      if (pathParts[0] === 'shop' && pathParts.length > 1) {
        setPostInfo({
          postSlug: pathParts[1],
          postType: 'product',
        })
        return
      }

      // Otherwise, assume it's a page
      if (pathParts.length === 1) {
        setPostInfo({
          postSlug: pathParts[0],
          postType: 'page',
        })
      }
    }

    extractPostInfo()
  }, [pathname, isMounted])

  // Don't render anything on server or before mount
  if (!isMounted) {
    return null
  }

  return (
    <FloatingSEOPanel
      postSlug={postInfo.postSlug}
      postType={postInfo.postType}
    />
  )
}

