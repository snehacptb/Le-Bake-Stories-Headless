import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { ShopPage } from '@/components/themes/shop-page'
import { wordpressAPI } from '@/lib/api'
import { Banner } from '@/types'

export const metadata: Metadata = {
  title: 'Shop - Premium Products',
  description: 'Browse our collection of premium products with fast shipping and excellent customer service.',
  keywords: 'shop, products, ecommerce, online store',
}

// Make it dynamic to fetch banner from WordPress
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

// Fetch shop page banners from hero-banners plugin
async function getShopBanners(): Promise<Banner[]> {
  try {
    console.log('🔍 Fetching shop page banners from hero-banners plugin...')

    // Fetch banners for the shop page using the hero-banners API
    const banners = await wordpressAPI.getBannersByPage('shop')

    console.log(`✅ Successfully fetched ${banners.length} banners for shop page`)

    return banners
  } catch (error) {
    console.error('❌ Error fetching shop banners:', error)
    return []
  }
}

export default async function Shop() {
  // Fetch shop banners from hero-banners plugin
  const shopBanners = await getShopBanners()

  return (
    <ClientLayout>
      <ShopPage shopBanners={shopBanners} />
    </ClientLayout>
  )
}
