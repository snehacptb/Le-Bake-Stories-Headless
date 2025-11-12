import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { CartPage } from '@/components/themes/cart-page'

export const metadata: Metadata = {
  title: 'Shopping Cart - Review Your Items',
  description: 'Review and manage items in your shopping cart before proceeding to checkout.',
  robots: 'noindex, nofollow',
}

export default function Cart() {
  return (
    <ClientLayout>
      <CartPage />
    </ClientLayout>
  )
}
