import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { cacheService } from '@/lib/cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const slug = searchParams.get('slug')
    const withItems = searchParams.get('withItems') === 'true'

    console.log(`🔍 Menu API request - location: ${location}, slug: ${slug}, withItems: ${withItems}`)

    // Read local cache only
    const filePath = path.join(process.cwd(), '.next', 'cache', 'wordpress', 'menus.json')
    let menus: any[] = []
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      menus = Array.isArray(parsed?.data) ? parsed.data : []
    } catch (e) {
      console.warn('⚠️ Could not read cached menus file:', e)
      menus = []
    }

    // If cache is empty or missing, fetch and cache from WordPress (like site-info)
    if (!Array.isArray(menus) || menus.length === 0) {
      try {
        console.log('🔄 Menus cache missing/empty. Fetching from WordPress...')
        menus = await cacheService.cacheMenus()
      } catch (err) {
        console.error('❌ Failed to fetch menus from WordPress:', err)
        menus = []
      }
    }

    // Helper: build fallback menu from cached pages (wp_page_menu behavior)
    const buildFallbackMenu = async (label: string) => {
      try {
        const pagesPath = path.join(process.cwd(), '.next', 'cache', 'wordpress', 'pages.json')
        const raw = await fs.readFile(pagesPath, 'utf-8')
        const parsed = JSON.parse(raw)
        const pages: any[] = Array.isArray(parsed?.data) ? parsed.data : []

        // Top-level pages only
        const topLevel = pages.filter(p => !p.parent || p.parent === 0)
        // Order by menu_order then title
        topLevel.sort((a, b) => {
          const orderDiff = (a.menu_order || 0) - (b.menu_order || 0)
          if (orderDiff !== 0) return orderDiff
          const at = (a.title || '').toString().toLowerCase()
          const bt = (b.title || '').toString().toLowerCase()
          return at.localeCompare(bt)
        })

        const items = topLevel.map(p => ({
          id: p.id,
          title: p.title,
          url: p.slug ? `/${p.slug}` : '/',
          target: '_self',
          parent: 0,
          order: p.menu_order || 0
        }))

        return {
          id: 0,
          name: label,
          slug: 'pages-fallback',
          location: label,
          items,
          lastUpdated: new Date().toISOString()
        }
      } catch (e) {
        console.warn('⚠️ Could not build fallback menu from pages cache:', e)
        return null
      }
    }

    // Helper: normalize menu item URLs against WP base URL
    const normalizeMenuUrls = (menu: any) => {
      if (!menu || !Array.isArray(menu.items)) return menu
      const wpBase = (process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://headless-wp.local').replace(/\/$/, '')
      menu.items = menu.items.map((item: any) => {
        let url = item.url || '/'
        if (typeof url === 'string' && url.startsWith('http')) {
          url = url.replace(new RegExp('^' + wpBase), '') || '/'
        }
        if (!url.startsWith('/')) {
          url = '/' + url
        }
        return { ...item, url }
      })
      return menu
    }

    // Handle specific menu by slug request
    if (slug) {
      // Try cached first
      let menu = menus.find(m => m.slug === slug) || null
      // If not found in cache, fetch specific menu and update cache
      if (!menu) {
        try {
          const fetched = await cacheService.cacheSpecificMenu(slug)
          if (fetched) {
            menu = fetched
          }
        } catch (err) {
          console.warn(`⚠️ Could not fetch specific menu '${slug}':`, err)
        }
      }
      // If still not found, refresh all menus from WP and retry by exact slug (case-insensitive)
      if (!menu) {
        try {
          const freshMenus = await cacheService.cacheMenus()
          const s = (slug || '').toLowerCase()
          menu = freshMenus.find(m => (m.slug || '').toLowerCase() === s) || null
        } catch (e) {
          console.warn('⚠️ Could not refresh menus while resolving slug:', e)
        }
      }
      // As a last resort, synthesize from pages
      if (!menu) {
        menu = await buildFallbackMenu(slug)
      }

      menu = normalizeMenuUrls(menu)
      console.log(`📋 Returning menu by slug '${slug}':`, menu ? `${menu.items?.length || 0} items` : 'not found')
      return NextResponse.json({ success: true, data: menu })
    }

    // Handle location-based menu request
    if (location) {
      console.log(`🔍 Looking for menu by location: '${location}'`)
      
      // Try cached first - exact match
      let menu = menus.find(m => m.location === location) || null
      
      // If not found by exact location, try case-insensitive location match
      if (!menu) {
        const loc = (location || '').toLowerCase()
        menu = menus.find(m => (m.location || '').toLowerCase() === loc) || null
      }
      
      // If still not found by location, try matching against slug (common case)
      if (!menu) {
        const loc = (location || '').toLowerCase()
        menu = menus.find(m => (m.slug || '').toLowerCase() === loc) || null
        if (menu) {
          console.log(`📋 Found menu by slug instead of location: '${menu.slug}' for location '${location}'`)
        }
      }
      
      // If not found in cache, refresh and try again
      if (!menu) {
        try {
          console.log(`🔄 Refreshing menus to find location '${location}'`)
          const freshMenus = await cacheService.cacheMenus()
          const loc = (location || '').toLowerCase()
          
          // Try location first
          menu = freshMenus.find(m => (m.location || '').toLowerCase() === loc) || null
          
          // If not found by location, try slug
          if (!menu) {
            menu = freshMenus.find(m => (m.slug || '').toLowerCase() === loc) || null
            if (menu) {
              console.log(`📋 Found menu by slug after refresh: '${menu.slug}' for location '${location}'`)
            }
          }
        } catch (err) {
          console.warn(`⚠️ Could not refresh menus while looking for location '${location}':`, err)
        }
      }
      
      // Fallback: synthesize from pages if still not found
      if (!menu) {
        console.log(`🔄 Creating fallback menu for location '${location}'`)
        menu = await buildFallbackMenu(location)
      }
      
      menu = normalizeMenuUrls(menu)
      console.log(`📋 Returning menu by location '${location}':`, menu ? `${menu.name} with ${menu.items?.length || 0} items` : 'not found')
      return NextResponse.json({ success: true, data: menu })
    }

    // Handle request for all menus
    if (!withItems) {
      let basicMenus = menus.map(menu => ({
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        location: menu.location,
        count: menu.items?.length || 0,
        description: menu.description || '',
        lastUpdated: menu.lastUpdated
      }))
      // If there are no menus at all, provide a synthetic basic fallback entry
      if (basicMenus.length === 0) {
        const fallback = await buildFallbackMenu('primary')
        if (fallback) {
          basicMenus = [{
            id: fallback.id,
            name: fallback.name,
            slug: fallback.slug,
            location: fallback.location,
            count: fallback.items?.length || 0,
            description: '',
            lastUpdated: fallback.lastUpdated
          }]
        }
      }
      console.log(`📋 Returning ${basicMenus.length} basic menu info (without items) from cache`)
      return NextResponse.json({ success: true, data: basicMenus })
    }

    // With items: normalize URLs and if none exist, provide synthesized pages menu as only entry
    if (Array.isArray(menus) && menus.length > 0) {
      menus = menus.map(m => normalizeMenuUrls(m))
    } else {
      const fallback = await buildFallbackMenu('primary')
      if (fallback) {
        console.log(`📋 Returning 1 synthesized fallback menu with ${fallback.items?.length || 0} items`)
        return NextResponse.json({ success: true, data: [fallback] })
      }
    }

    console.log(`📋 Returning ${menus.length} menus with items from cache:`, menus.map(m => `${m.name} (${m.items?.length || 0} items)`))
    return NextResponse.json({ success: true, data: menus })
  } catch (error: any) {
    console.error('❌ Menu API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
