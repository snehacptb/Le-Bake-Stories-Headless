import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { ShopPage } from '@/components/themes/shop-page'

export const metadata: Metadata = {
  title: 'Shop - Premium Products',
  description: 'Browse our collection of premium products with fast shipping and excellent customer service.',
  keywords: 'shop, products, ecommerce, online store',
}

// Make it dynamic to fetch banner from WordPress
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

interface WordPressPage {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  slug: string
  status: string
}

// Fetch shop page banner from WordPress
async function getShopBanner(): Promise<WordPressPage | null> {
  try {
    console.log('🔍 Fetching shop page banner from WordPress...')
    
    const wpApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://manila.esdemo.in/wp-json/wp/v2'
    
    // Try multiple slug variations for shop page
    const slugs = ['shop', 'shop-page', 'shop-banner']
    
    for (const slug of slugs) {
      try {
        const response = await fetch(`${wpApiUrl}/pages?slug=${slug}&_embed`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!response.ok) {
          console.log(`⚠️ Failed to fetch shop page with slug "${slug}": ${response.status}`)
          continue
        }
        
        const pages = await response.json()
        
        if (pages && pages.length > 0 && pages[0].status === 'publish') {
          console.log(`✅ Found shop banner page with slug: ${slug}`)
          return pages[0]
        }
      } catch (err) {
        console.log(`⚠️ Error fetching slug "${slug}":`, err)
        continue
      }
    }
    
    console.log('⚠️ No shop banner page found in WordPress')
    return null
  } catch (error) {
    console.error('❌ Error fetching shop banner:', error)
    return null
  }
}

export default async function Shop() {
  // Fetch shop banner from WordPress
  const shopBanner = await getShopBanner()
  
  return (
    <ClientLayout>
      <ShopPage shopBanner={shopBanner} />
    </ClientLayout>
  )
}
