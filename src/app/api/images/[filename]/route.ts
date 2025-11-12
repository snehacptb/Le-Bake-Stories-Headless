import { NextRequest, NextResponse } from 'next/server'
import { imageCacheService } from '@/lib/image-cache-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    if (!filename) {
      return new NextResponse('Filename required', { status: 400 })
    }

    // Get the cached image file
    const imageData = await imageCacheService.getImageFile(filename)

    if (!imageData) {
      return new NextResponse('Image not found', { status: 404 })
    }

    // Return the image with appropriate headers
    return new NextResponse(imageData.buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': imageData.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Length': imageData.buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error serving cached image:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
