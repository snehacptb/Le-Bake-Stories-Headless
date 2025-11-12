import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { ShopPage } from '@/components/themes/shop-page'

export const metadata: Metadata = {
  title: 'Shop - Premium Products',
  description: 'Browse our collection of premium products with fast shipping and excellent customer service.',
  keywords: 'shop, products, ecommerce, online store',
}

// Force static generation for the shop page
export const dynamic = 'force-static'

export default async function Shop() {
  return (
    <ClientLayout>
      <ShopPage />
    </ClientLayout>
  )
}
