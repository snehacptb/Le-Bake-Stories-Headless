import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { OrderConfirmationPage } from '@/components/themes/order-confirmation-page'

export const metadata: Metadata = {
  title: 'Order Confirmation - Thank You for Your Purchase',
  description: 'Your order has been successfully placed. Thank you for your purchase!',
  robots: 'noindex, nofollow',
}

interface OrderConfirmationProps {
  params: {
    id: string
  }
}

export default function OrderConfirmation({ params }: OrderConfirmationProps) {
  return (
    <ClientLayout>
      <OrderConfirmationPage orderId={params.id} />
    </ClientLayout>
  )
}
