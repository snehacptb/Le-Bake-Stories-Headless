import { NextRequest, NextResponse } from 'next/server'
import { wordpressAPI } from '@/lib/api'
import { ContactFormData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()
    
    // Validate required fields
    const { firstName, lastName, email, subject, message } = body
    
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please fill in all required fields.' 
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please enter a valid email address.' 
        },
        { status: 400 }
      )
    }

    // Submit the form via WordPress API
    const result = await wordpressAPI.submitContactForm(body)
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Contact form API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while sending your message. Please try again later.' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Contact form endpoint. Use POST to submit a contact form.' },
    { status: 200 }
  )
}
