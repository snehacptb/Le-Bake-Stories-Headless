import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClientLayout } from '@/components/themes/client-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { wordpressAPI } from '@/lib/api'
import { WordPressPage } from '@/types'
import Image from 'next/image'
import { 
  Users,
  Target,
  Award,
  Heart,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Globe
} from 'lucide-react'

// Use WordPress API instance
const wpApi = wordpressAPI

// Helper functions for processing WordPress content
function processWordPressContent(content: string): string {
  if (!content) return ''
  
  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://headless-wp.local'
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
  
  let processedContent = content.replace(
    new RegExp(wpUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    frontendUrl
  )
  
  processedContent = processedContent.replace(
    /href="\/([^"]*?)"/g,
    `href="${frontendUrl}/$1"`
  )
  
  return processedContent
}

function parseContentIntoSections(content: string, pageType: 'about' | 'services' | 'default' = 'default') {
  if (!content) return []
  
  const firstHeadingMatch = content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/)
  const firstParagraphMatch = content.match(/<p[^>]*>([^<]+)<\/p>/)
  
  const h2Sections = content.split(/<h2[^>]*>/)
  const parsedSections = []
  
  for (let i = 1; i < h2Sections.length; i++) {
    const section = h2Sections[i]
    const titleMatch = section.match(/^([^<]+)/)
    const title = titleMatch ? titleMatch[1].trim() : `Section ${i}`
    
    if (firstHeadingMatch && title === firstHeadingMatch[1].trim()) {
      continue
    }
    
    const contentMatch = section.match(/<\/h2>\s*([\s\S]+?)(?=<h2|$)/)
    const sectionContent = contentMatch ? contentMatch[1] : section.replace(/^[^<]*<\/h2>\s*/, '')
    
    // Extract image from section content
    const imageMatch = sectionContent.match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/)
    const imageSrc = imageMatch ? imageMatch[1] : undefined
    const imageAlt = imageMatch ? imageMatch[2] : ''
    
    const cleanContent = sectionContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (title && cleanContent) {
      // Process image URL to use correct domain
      const processedImageSrc = imageSrc ? (() => {
        const processed = processWordPressContent(`<img src="${imageSrc}">`)
        const match = processed.match(/src="([^"]*)"/)
        return match ? match[1] : imageSrc
      })() : undefined
      
      parsedSections.push({
        title,
        content: cleanContent.substring(0, 200) + (cleanContent.length > 200 ? '...' : ''),
        image: processedImageSrc,
        imageAlt: imageAlt || title,
        icon: getIconForSection(title, i - 1, pageType)
      })
    }
  }
  
  if (parsedSections.length === 0) {
    const h3Sections = content.split(/<h3[^>]*>/)
    
    for (let i = 1; i < h3Sections.length; i++) {
      const section = h3Sections[i]
      const titleMatch = section.match(/^([^<]+)/)
      const title = titleMatch ? titleMatch[1].trim() : `Section ${i}`
      
      if (firstHeadingMatch && title === firstHeadingMatch[1].trim()) {
        continue
      }
      
      const contentMatch = section.match(/<\/h3>\s*([\s\S]+?)(?=<h3|$)/)
      const sectionContent = contentMatch ? contentMatch[1] : section.replace(/^[^<]*<\/h3>\s*/, '')
      
      // Extract image from section content
      const imageMatch = sectionContent.match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/)
      const imageSrc = imageMatch ? imageMatch[1] : undefined
      const imageAlt = imageMatch ? imageMatch[2] : ''
      
      const cleanContent = sectionContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      if (title && cleanContent) {
        // Process image URL to use correct domain
        const processedImageSrc = imageSrc ? (() => {
          const processed = processWordPressContent(`<img src="${imageSrc}">`)
          const match = processed.match(/src="([^"]*)"/)
          return match ? match[1] : imageSrc
        })() : undefined
        
        parsedSections.push({
          title,
          content: cleanContent.substring(0, 200) + (cleanContent.length > 200 ? '...' : ''),
          image: processedImageSrc,
          imageAlt: imageAlt || title,
          icon: getIconForSection(title, i - 1, pageType)
        })
      }
    }
  }
  
  return parsedSections.length > 0 ? parsedSections : []
}

function getIconForSection(title: string, index: number, pageType: 'about' | 'services' | 'default' = 'default') {
  const titleLower = title.toLowerCase()
  
  // About page and general icons
  if (titleLower.includes('mission') || titleLower.includes('goal') || titleLower.includes('purpose')) {
    return Target
  } else if (titleLower.includes('value') || titleLower.includes('principle') || titleLower.includes('belief')) {
    return Heart
  } else if (titleLower.includes('innovation') || titleLower.includes('idea') || titleLower.includes('creative')) {
    return Lightbulb
  } else if (titleLower.includes('team') || titleLower.includes('people') || titleLower.includes('community')) {
    return Users
  } else if (titleLower.includes('service') || titleLower.includes('offer') || titleLower.includes('provide')) {
    return Globe
  } else if (titleLower.includes('achievement') || titleLower.includes('success') || titleLower.includes('award')) {
    return Award
  } else {
    const icons = [Target, Heart, Lightbulb, Users, Globe, Award]
    return icons[index % icons.length]
  }
}

async function getAboutPage(): Promise<WordPressPage | null> {
  try {
    console.log('🔍 Fetching About page from WordPress API...')
    
    // Try to fetch via API route first
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/pages?slug=about`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        console.log('✅ About page fetched successfully via API route')
        console.log('📄 Page title:', result.data.title?.rendered)
        console.log('📄 Content length:', result.data.content?.rendered?.length || 0)
        return result.data
      }
    }
    
    console.log('⚠️ API route failed, trying direct API call...')
    // Fallback to direct API call
    const page = await wpApi.getPage('about')
    if (page) {
      console.log('✅ About page fetched via direct API call')
      console.log('📄 Page title:', page.title?.rendered)
      console.log('📄 Content length:', page.content?.rendered?.length || 0)
    } else {
      console.log('❌ No About page found in WordPress')
    }
    return page
  } catch (error) {
    console.error('❌ Error fetching About page:', error)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage()
  
  return {
    title: page?.title?.rendered || 'About Us',
    description: page?.excerpt?.rendered?.replace(/<[^>]*>/g, '') || 'Learn more about our company, mission, and values.',
    openGraph: {
      title: page?.title?.rendered || 'About Us',
      description: page?.excerpt?.rendered?.replace(/<[^>]*>/g, '') || 'Learn more about our company, mission, and values.',
      type: 'website',
    },
  }
}

export default async function AboutPage() {
  const page = await getAboutPage()

  // Extract content from WordPress page or use fallback content
  const pageTitle = page?.title?.rendered || 'About Us'
  const pageContent = page?.content?.rendered || ''
  const pageExcerpt = page?.excerpt?.rendered?.replace(/<[^>]*>/g, '') || 'Learn more about our company, mission, and values.'
  
  // Get featured image if available
  const featuredImage = page?._embedded?.['wp:featuredmedia']?.[0]?.source_url

  return (
    <ClientLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 md:mb-6 bg-white/20 text-white border-white/30">
            About Us
          </Badge>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            {pageTitle}
          </h1>
          
          <p className="text-base md:text-xl lg:text-2xl text-blue-100 mb-6 md:mb-8 max-w-3xl mx-auto px-4">
            {pageExcerpt}
          </p>
        </div>
      </section>

      {/* Featured Image Section */}
      {featuredImage && (
        <section className="py-8 md:py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <img
                src={featuredImage}
                alt={pageTitle}
                className="w-full h-48 md:h-64 lg:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>
      )}

      {/* WordPress Content - Primary Content */}
      {pageContent ? (() => {
        // Process About Us content if available
        const processedAboutContent = processWordPressContent(pageContent)
        const aboutSections = parseContentIntoSections(processedAboutContent, 'about')
        
        return aboutSections.length > 0 ? (
          <section className="py-12 md:py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8 md:mb-12">
                <Badge variant="info" className="mb-3 md:mb-4">About Us</Badge>
                {(() => {
                  const headingMatch = processedAboutContent.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/)
                  return headingMatch ? (
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                      {headingMatch[1].trim()}
                    </h2>
                  ) : (
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                      Learn About Us
                    </h2>
                  )
                })()}
                
                {(() => {
                  const paragraphMatch = processedAboutContent.match(/<p[^>]*>([^<]+)<\/p>/)
                  return paragraphMatch ? (
                    <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                      {paragraphMatch[1].trim()}
                    </p>
                  ) : (
                    <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                      Learn more about our mission, values, and the services we provide to our community.
                    </p>
                  )
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {aboutSections.map((section: any, index: number) => {
                  const IconComponent = section.icon
                  const colors = [
                    { bg: 'bg-blue-100', text: 'text-blue-600' },
                    { bg: 'bg-green-100', text: 'text-green-600' },
                    { bg: 'bg-purple-100', text: 'text-purple-600' },
                    { bg: 'bg-orange-100', text: 'text-orange-600' },
                    { bg: 'bg-red-100', text: 'text-red-600' },
                    { bg: 'bg-indigo-100', text: 'text-indigo-600' }
                  ]
                  const colorSet = colors[index % colors.length]
                  
                  return (
                    <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="p-6 md:p-8">
                        {section.image ? (
                          <div className="relative w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Image
                              src={section.image}
                              alt={section.imageAlt || section.title}
                              fill
                              sizes="(max-width: 768px) 56px, 64px"
                              className="object-cover rounded-full"
                            />
                          </div>
                        ) : (
                          <div className={`${colorSet.bg} w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className={`h-6 w-6 md:h-8 md:w-8 ${colorSet.text}`} />
                          </div>
                        )}
                        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{section.title}</h3>
                        <p className="text-sm md:text-base text-gray-600">
                          {section.content}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </section>
        ) : (
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div 
                  dangerouslySetInnerHTML={{ __html: processedAboutContent }}
                  className="wordpress-content"
                />
              </div>
            </div>
          </section>
        )
      })() : (
        /* Fallback Content - Only show when no WordPress content */
        <>
          {/* Our Mission & Values - Fallback */}
          <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Our Mission & Values
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              We're driven by a clear mission and guided by strong values that shape everything we do.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <CardTitle className="text-xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  To deliver exceptional solutions that drive success and create lasting value for our clients.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Award className="h-8 w-8 text-green-600 mx-auto" />
                </div>
                <CardTitle className="text-xl">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We strive for excellence in everything we do, setting high standards and exceeding expectations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600 mx-auto" />
                </div>
                <CardTitle className="text-xl">Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We believe in the power of teamwork and building strong partnerships with our clients.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Heart className="h-8 w-8 text-orange-600 mx-auto" />
                </div>
                <CardTitle className="text-xl">Integrity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We operate with honesty, transparency, and ethical practices in all our business dealings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
          </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Why Choose Us?
              </h2>
              <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8">
                We combine expertise, innovation, and dedication to deliver results that matter.
              </p>

              <div className="space-y-4">
                {[
                  'Proven track record of success',
                  'Expert team with years of experience',
                  'Customer-focused approach',
                  'Innovative solutions tailored to your needs',
                  'Reliable support and maintenance',
                  'Competitive pricing and transparent costs'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-600 mb-6">
                  Let's discuss how we can help you achieve your goals.
                </p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Contact Us Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

   

   
        </>
      )}
    </ClientLayout>
  )
}
