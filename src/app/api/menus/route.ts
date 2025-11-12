import { NextRequest, NextResponse } from 'next/server'
import { wordpressAPI } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const withItems = searchParams.get('withItems') !== 'false' // Default to true

    console.log(`🔍 Direct WordPress menu API - slug: ${slug}, withItems: ${withItems}`)

    if (slug) {
      // Fetch specific menu with items
      console.log(`🔍 Fetching specific menu: ${slug}`)
      const menu = await wordpressAPI.getMenuWithItems(slug)
      
      if (!menu) {
        return NextResponse.json({ 
          success: false, 
          error: `Menu '${slug}' not found`,
          data: null 
        }, { status: 404 })
      }

      console.log(`📋 Found menu '${menu.name}' with ${menu.items?.length || 0} items`)
      return NextResponse.json({ 
        success: true, 
        data: menu,
        message: `Menu '${menu.name}' retrieved successfully`
      })
    } else {
      // Fetch all registered menus (basic info without items by default)
      console.log('🔍 Fetching all registered menus')
      const menus = await wordpressAPI.getMenus()
      
      if (withItems) {
        // If items are requested, fetch each menu with items
        console.log('🔄 Fetching items for all menus...')
        const menusWithItems = []
        
        for (const menu of menus) {
          try {
            const menuWithItems = await wordpressAPI.getMenuWithItems(menu.slug)
            if (menuWithItems) {
              menusWithItems.push(menuWithItems)
            } else {
              // Fallback to basic menu info if items can't be fetched
              menusWithItems.push(menu)
            }
          } catch (error) {
            console.log(`⚠️ Could not fetch items for menu ${menu.slug}:`, error)
            menusWithItems.push(menu)
          }
        }
        
        console.log(`📋 Returning ${menusWithItems.length} menus with items`)
        return NextResponse.json({ 
          success: true, 
          data: menusWithItems,
          message: `${menusWithItems.length} menus retrieved with items`
        })
      } else {
        console.log(`📋 Returning ${menus.length} basic menu info (without items)`)
        return NextResponse.json({ 
          success: true, 
          data: menus,
          message: `${menus.length} menus retrieved (basic info only)`
        })
      }
    }
  } catch (error: any) {
    console.error('❌ Menu API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      data: null
    }, { status: 500 })
  }
}
