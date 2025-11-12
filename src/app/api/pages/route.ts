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
      // Fetch by slug
      page = await wordpressAPI.getPage(slug)
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
          message: 'Page not found' 
        },
        { status: 404 }
      )
    }

    console.log('✅ Page found:', page.title?.rendered || 'Untitled')
    console.log('📄 Page content length:', page.content?.rendered?.length || 0)

    return NextResponse.json({
      success: true,
      data: page,
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
