import { NextRequest, NextResponse } from 'next/server'
import { wordpressAPI } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const categories = searchParams.get('categories') || undefined
    const tags = searchParams.get('tags') || undefined
    const search = searchParams.get('search') || undefined
    const orderby = searchParams.get('orderby') || undefined
    const order = (searchParams.get('order') as 'asc' | 'desc') || undefined
    const slug = searchParams.get('slug') || undefined

    // Fetch by slug when provided
    if (slug) {
      const post = await wordpressAPI.getPost(slug)
      if (!post) {
        return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: post })
    }

    const result = await wordpressAPI.getPosts({
      page,
      per_page,
      categories,
      tags,
      search,
      orderby,
      order,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to fetch posts',
      },
      { status: 500 }
    )
  }
}


