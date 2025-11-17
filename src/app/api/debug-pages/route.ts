import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://manila.esdemo.in/wp-json/wp/v2'

    console.log('🔍 Fetching all pages from:', WORDPRESS_API_URL)

    const response = await fetch(`${WORDPRESS_API_URL}/pages?per_page=100&_embed`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`WordPress API returned ${response.status}: ${response.statusText}`)
    }

    const pages = await response.json()

    const pageList = pages.map((page: any) => ({
      id: page.id,
      title: page.title.rendered,
      slug: page.slug,
      status: page.status,
      link: page.link,
      contentLength: page.content.rendered.length,
      hasElementor: page.content.rendered.includes('elementor') ||
                    page.content.rendered.includes('data-elementor-type'),
      excerpt: page.excerpt.rendered.substring(0, 100),
      featuredMedia: page.featured_media || null
    }))

    const aboutPages = pageList.filter((page: any) =>
      page.slug.toLowerCase().includes('about') ||
      page.title.toLowerCase().includes('about')
    )

    return NextResponse.json({
      success: true,
      totalPages: pages.length,
      pages: pageList,
      aboutPages: aboutPages,
      message: `Found ${pages.length} pages in WordPress`
    })

  } catch (error) {
    console.error('❌ Error fetching pages:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch pages from WordPress'
    }, { status: 500 })
  }
}
