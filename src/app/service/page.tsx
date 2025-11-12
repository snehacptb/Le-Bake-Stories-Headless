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
  Code,
  Smartphone,
  Globe,
  Search,
  ShoppingCart,
  Palette,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Lightbulb,
  Headphones,
  Shield,
  Zap,
  Rocket,
  Settings
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
  
  // For services page, handle WordPress columns/blocks structure first
  if (pageType === 'services') {
    // Look for WordPress column blocks that contain images and content
    const columnMatches = content.match(/<div class="wp-block-column[^>]*>[\s\S]*?<\/div>/g)
    
    if (columnMatches && columnMatches.length > 0) {
      const parsedSections: any[] = []
      
      columnMatches.forEach((column, index) => {
        // Extract image from the column
        const imageMatch = column.match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/)
        const imageSrc = imageMatch ? imageMatch[1] : undefined
        const imageAlt = imageMatch ? imageMatch[2] : ''
        
        // Extract heading (h3 in this case)
        const headingMatch = column.match(/<h3[^>]*>([^<]+)<\/h3>/)
        const title = headingMatch ? headingMatch[1].trim() : `Service ${index + 1}`
        
        // Extract paragraph content
        const paragraphMatch = column.match(/<p[^>]*>([\s\S]*?)<\/p>/)
        const paragraphContent = paragraphMatch ? paragraphMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''
        
        if (title && paragraphContent) {
          // Process image URL to use correct domain
          const processedImageSrc = imageSrc ? (() => {
            const processed = processWordPressContent(`<img src="${imageSrc}">`)
            const match = processed.match(/src="([^"]*)"/)
            return match ? match[1] : imageSrc
          })() : undefined
          
          parsedSections.push({
            title,
            content: paragraphContent,
            image: processedImageSrc,
            imageAlt: imageAlt || title,
            icon: getIconForSection(title, index, pageType)
          })
        }
      })
      
      if (parsedSections.length > 0) {
        return parsedSections
      }
    }
  }
  
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
  
  // Service-specific icons
  if (pageType === 'services') {
    if (titleLower.includes('web') || titleLower.includes('development') || titleLower.includes('coding')) {
      return Code
    } else if (titleLower.includes('design') || titleLower.includes('creative') || titleLower.includes('ui')) {
      return Lightbulb
    } else if (titleLower.includes('support') || titleLower.includes('help') || titleLower.includes('assistance')) {
      return Headphones
    } else if (titleLower.includes('security') || titleLower.includes('protection') || titleLower.includes('safe')) {
      return Shield
    } else if (titleLower.includes('performance') || titleLower.includes('speed') || titleLower.includes('optimization')) {
      return Zap
    } else if (titleLower.includes('launch') || titleLower.includes('startup') || titleLower.includes('growth')) {
      return Rocket
    } else if (titleLower.includes('maintenance') || titleLower.includes('manage') || titleLower.includes('update')) {
      return Settings
    } else {
      // Service-specific icon cycle
      const serviceIcons = [Code, Lightbulb, Headphones, Shield, Zap, Rocket, Settings, Globe]
      return serviceIcons[index % serviceIcons.length]
    }
  }
  
  // Default icons
  const icons = [Code, Lightbulb, Headphones, Shield, Zap, Rocket]
  return icons[index % icons.length]
}

async function getServicesPage(): Promise<WordPressPage | null> {
  try {
    console.log('🔍 Fetching Services page from WordPress API...')
    
    // Try to fetch via API route first
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/pages?slug=services`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        console.log('✅ Services page fetched successfully via API route')
        console.log('📄 Page title:', result.data.title?.rendered)
        console.log('📄 Content length:', result.data.content?.rendered?.length || 0)
        return result.data
      }
    }
    
    // Try alternative slug
    const responseAlt = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/pages?slug=service`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (responseAlt.ok) {
      const result = await responseAlt.json()
      if (result.success && result.data) {
        console.log('✅ Service page fetched successfully via API route')
        return result.data
      }
    }
    
    console.log('⚠️ API route failed, trying direct API call...')
    // Fallback to direct API call
    const page = await wpApi.getPage('services') || await wpApi.getPage('service')
    if (page) {
      console.log('✅ Services page fetched via direct API call')
      console.log('📄 Page title:', page.title?.rendered)
      console.log('📄 Content length:', page.content?.rendered?.length || 0)
    } else {
      console.log('❌ No Services page found in WordPress')
    }
    return page
  } catch (error) {
    console.error('❌ Error fetching Services page:', error)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getServicesPage()
  
  return {
    title: page?.title?.rendered || 'Our Services',
    description: page?.excerpt?.rendered?.replace(/<[^>]*>/g, '') || 'Discover our comprehensive range of professional services designed to help your business grow.',
    openGraph: {
      title: page?.title?.rendered || 'Our Services',
      description: page?.excerpt?.rendered?.replace(/<[^>]*>/g, '') || 'Discover our comprehensive range of professional services designed to help your business grow.',
      type: 'website',
    },
  }
}

export default async function ServicesPage() {
  const page = await getServicesPage()

  // Extract content from WordPress page or use fallback content
  const pageTitle = page?.title?.rendered || 'Our Services'
  const pageContent = page?.content?.rendered || ''
  const pageExcerpt = page?.excerpt?.rendered?.replace(/<[^>]*>/g, '') || 'Discover our comprehensive range of professional services designed to help your business grow.'
  
  // Get featured image if available
  const featuredImage = page?._embedded?.['wp:featuredmedia']?.[0]?.source_url

  // Service offerings
  const services = [
    {
      icon: Globe,
      title: 'Web Development',
      description: 'Custom websites and web applications built with modern technologies and best practices.',
      features: ['Responsive Design', 'SEO Optimized', 'Fast Loading', 'Mobile-First'],
      color: 'blue'
    },
    {
      icon: Smartphone,
      title: 'Mobile Development',
      description: 'Native and cross-platform mobile applications for iOS and Android devices.',
      features: ['Native Performance', 'Cross-Platform', 'App Store Ready', 'Push Notifications'],
      color: 'green'
    },
    {
      icon: ShoppingCart,
      title: 'E-commerce Solutions',
      description: 'Complete online store solutions with payment processing and inventory management.',
      features: ['Payment Gateway', 'Inventory Management', 'Order Tracking', 'Analytics'],
      color: 'purple'
    }
    
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200',
      pink: 'bg-pink-100 text-pink-600 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <ClientLayout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
            Our Services
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {pageTitle}
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            {pageExcerpt}
          </p>
        </div>
      </section>

      {/* Featured Image Section */}
      {featuredImage && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <img
                src={featuredImage}
                alt={pageTitle}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>
      )}

      {/* WordPress Content */}
      {pageContent ? (() => {
        // Process Services content if available
        const processedServicesContent = processWordPressContent(pageContent)
        const servicesSections = parseContentIntoSections(processedServicesContent, 'services')
        
        return servicesSections.length > 0 ? (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <Badge variant="featured" className="mb-4 bg-green-100 text-green-800 border-green-200">Our Services</Badge>
                {(() => {
                  const headingMatch = processedServicesContent.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/)
                  return headingMatch ? (
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      {headingMatch[1].trim()}
                    </h2>
                  ) : (
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      What We Offer
                    </h2>
                  )
                })()}
                
                {(() => {
                  const paragraphMatch = processedServicesContent.match(/<p[^>]*>([^<]+)<\/p>/)
                  return paragraphMatch ? (
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {paragraphMatch[1].trim()}
                    </p>
                  ) : (
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Discover the comprehensive range of services we provide to help you achieve your goals.
                    </p>
                  )
                })()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {servicesSections.map((section: any, index: number) => {
                  const IconComponent = section.icon
                  const colors = [
                    { bg: 'bg-green-100', text: 'text-green-600' },
                    { bg: 'bg-blue-100', text: 'text-blue-600' },
                    { bg: 'bg-purple-100', text: 'text-purple-600' },
                    { bg: 'bg-orange-100', text: 'text-orange-600' },
                    { bg: 'bg-red-100', text: 'text-red-600' },
                    { bg: 'bg-indigo-100', text: 'text-indigo-600' },
                    { bg: 'bg-teal-100', text: 'text-teal-600' },
                    { bg: 'bg-pink-100', text: 'text-pink-600' }
                  ]
                  const colorSet = colors[index % colors.length]
                  
                  return (
                    <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="p-8">
                        {section.image ? (
                          <div className="relative w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Image
                              src={section.image}
                              alt={section.imageAlt || section.title}
                              fill
                              sizes="64px"
                              className="object-cover rounded-full"
                            />
                          </div>
                        ) : (
                          <div className={`${colorSet.bg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className={`h-8 w-8 ${colorSet.text}`} />
                          </div>
                        )}
                        <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                        <p className="text-gray-600">
                          {section.content}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="text-center mt-12">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    Get In Touch
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    Learn More About Our Services
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div 
                  dangerouslySetInnerHTML={{ __html: processedServicesContent }}
                  className="wordpress-content"
                />
              </div>
            </div>
          </section>
        )
      })() : null}


      {/* Process Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Process
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A proven methodology that ensures successful project delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Discovery',
                description: 'We understand your needs, goals, and challenges to create the perfect solution.'
              },
              {
                step: '02',
                title: 'Planning',
                description: 'Detailed project planning with timelines, milestones, and resource allocation.'
              },
              {
                step: '03',
                title: 'Development',
                description: 'Expert development using best practices and cutting-edge technologies.'
              },
              {
                step: '04',
                title: 'Delivery',
                description: 'Thorough testing, deployment, and ongoing support for your success.'
              }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {process.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{process.title}</h3>
                <p className="text-gray-600">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '500+', label: 'Projects Completed' },
              { number: '200+', label: 'Happy Clients' },
              { number: '5+', label: 'Years Experience' },
              { number: '24/7', label: 'Support Available' }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <Users className="h-16 w-16 mx-auto mb-6 text-blue-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's discuss your requirements and create something amazing together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Get Free Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              View Portfolio
            </Button>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
