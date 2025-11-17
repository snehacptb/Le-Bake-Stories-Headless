import { NextRequest, NextResponse } from 'next/server'
import { wordpressAPI } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')
    const path = searchParams.get('path')

    console.log('🔍 Fetching WordPress page:', { slug, id, path })

    let page = null

    if (id) {
      // Fetch by ID
      page = await wordpressAPI.getPageById(parseInt(id))
    } else if (path) {
      // Fetch by path
      page = await wordpressAPI.getPageByPath(path)
    } else if (slug) {
      // Fetch by slug - try multiple variations
      const slugVariations = [
        slug,
        slug.toLowerCase(),
        slug.replace(/-/g, ' '),
        slug.replace(/\s+/g, '-'),
        slug.replace(/-/g, '_')
      ]
      
      // Remove duplicates
      const uniqueSlugs = [...new Set(slugVariations)]
      
      console.log(`🔍 Trying ${uniqueSlugs.length} slug variations:`, uniqueSlugs)
      
      for (const slugVar of uniqueSlugs) {
        try {
          console.log(`  Attempting to fetch page with slug: "${slugVar}"`)
          page = await wordpressAPI.getPage(slugVar)
          if (page) {
            console.log(`✅ Found page with slug variation: ${slugVar}`)
            break
          } else {
            console.log(`  ⚠️ No page returned for slug: "${slugVar}"`)
          }
        } catch (err: any) {
          console.log(`  ❌ Error fetching slug "${slugVar}":`, err.message || err)
        }
      }
      
      // If still not found, try fetching all pages and searching
      if (!page) {
        console.log('🔍 Page not found by slug, trying to fetch all pages and search...')
        try {
          const allPages = await wordpressAPI.getPages({ per_page: 100, status: 'publish' })
          console.log(`📋 Found ${allPages.data.length} published pages`)
          
          // Extract base slug (remove any trailing numbers like "-2", "-3", etc.)
          const baseSlug = slug.toLowerCase().replace(/-\d+$/, '')
          
          // Search for pages with similar slugs
          const matchingPages = allPages.data.filter((p: any) => {
            const pageSlug = p.slug?.toLowerCase() || ''
            const pageBaseSlug = pageSlug.replace(/-\d+$/, '')
            const searchSlug = slug.toLowerCase()
            const pageTitle = p.title?.rendered?.toLowerCase() || ''
            
            // Match exact slug
            if (pageSlug === searchSlug) return true
            // Match base slug (handles "about-us" vs "about-us-2")
            if (pageBaseSlug === baseSlug || pageBaseSlug === searchSlug) return true
            // Match if slug contains search term
            if (pageSlug.includes(searchSlug) || searchSlug.includes(pageSlug)) return true
            // Match if title contains search term (for "about us" vs "about-us")
            if (pageTitle.includes(searchSlug) || pageTitle.includes(baseSlug)) return true
            
            return false
          })
          
          if (matchingPages.length > 0) {
            console.log(`✅ Found ${matchingPages.length} matching page(s):`, 
              matchingPages.map((p: any) => ({ slug: p.slug, title: p.title?.rendered })))
            // Prefer exact slug match, then numbered suffix, then title match
            const exactMatch = matchingPages.find((p: any) => 
              p.slug?.toLowerCase() === slug.toLowerCase()
            )
            const numberedMatch = matchingPages.find((p: any) => 
              p.slug?.toLowerCase().replace(/-\d+$/, '') === baseSlug
            )
            page = exactMatch || numberedMatch || matchingPages[0]
          } else {
            console.log('❌ No matching pages found in all pages list')
          }
        } catch (err: any) {
          console.error('❌ Error fetching all pages:', err.message || err)
        }
      }
    } else {
      // Fetch all pages
      const pages = await wordpressAPI.getPages({ per_page: 100 })
      return NextResponse.json({
        success: true,
        data: pages.data,
        total: pages.total,
        message: 'Pages fetched successfully'
      })
    }

    if (!page) {
      console.log('❌ Page not found:', { slug, id, path })
      return NextResponse.json(
        { 
          success: false, 
          data: null, 
          message: `Page not found. Please ensure the page exists in WordPress and is published. Searched for: ${slug || id || path}` 
        },
        { status: 404 }
      )
    }

    // Check if page has Elementor content
    const hasElementor = page.content?.rendered?.includes('elementor') || 
                         page.content?.rendered?.includes('data-elementor-type') ||
                         page.content?.rendered?.includes('elementor-section')

    console.log('✅ Page found:', page.title?.rendered || 'Untitled')
    console.log('📄 Page content length:', page.content?.rendered?.length || 0)
    console.log('🎨 Has Elementor content:', hasElementor)

    // Process content to fix image URLs
    let processedContent = page.content?.rendered || ''
    if (processedContent) {
      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://manila.esdemo.in'
      
      // Fix relative image URLs
      processedContent = processedContent.replace(
        /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
        (match: string, before: string, src: string, after: string) => {
          let imageUrl = src

          // Handle relative URLs
          if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
            imageUrl = `${wpUrl.replace(/\/$/, '')}${imageUrl}`
          } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
            imageUrl = `${wpUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
          }

          return `<img${before}src="${imageUrl}"${after}>`
        }
      )

      // Fix background-image URLs
      processedContent = processedContent.replace(
        /style=["']([^"']*background-image:\s*url\(["']?)([^"')]+)(["']?\)[^"']*)["']/gi,
        (match: string, prefix: string, url: string, suffix: string) => {
          let imageUrl = url
          if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
            imageUrl = `${wpUrl.replace(/\/$/, '')}${imageUrl}`
          } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//') && !imageUrl.startsWith('data:')) {
            imageUrl = `${wpUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
          }
          return `style="${prefix}${imageUrl}${suffix}"`
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...page,
        content: {
          ...page.content,
          rendered: processedContent
        },
        hasElementor
      },
      message: 'Page fetched successfully'
    })

  } catch (error) {
    console.error('❌ Error fetching WordPress page:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        data: null, 
        message: error instanceof Error ? error.message : 'Failed to fetch page' 
      },
      { status: 500 }
    )
  }
}
