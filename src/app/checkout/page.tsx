import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { CheckoutPage } from '@/components/themes/checkout-page'

export const metadata: Metadata = {
  title: 'Checkout - Complete Your Order',
  description: 'Securely complete your purchase with our encrypted checkout process.',
  robots: 'noindex, nofollow',
}

export default function Checkout() {
  return (
    <ClientLayout>
      <CheckoutPage />
    </ClientLayout>
  )
}
