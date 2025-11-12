import type { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { WishlistPage } from '@/components/themes/wishlist-page'

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'View and manage your saved favorite products',
  keywords: 'wishlist, favorites, saved products, ecommerce',
  openGraph: {
    title: 'My Wishlist',
    description: 'View and manage your saved favorite products',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'My Wishlist',
    description: 'View and manage your saved favorite products',
  },
}

export default function Wishlist() {
  return (
    <ClientLayout>
      <WishlistPage />
    </ClientLayout>
  )
}
