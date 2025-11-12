import { NextRequest, NextResponse } from 'next/server'
import { wordpressAPI } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = parseInt(params.id)
    
    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'Invalid media ID' },
        { status: 400 }
      )
    }

    const media = await wordpressAPI.getMedia(mediaId)
    
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    // Return the media URL for the frontend to use
    if (media.source_url) {
      return NextResponse.redirect(media.source_url)
    }

    return NextResponse.json(
      { error: 'Media URL not available' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
