import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { MyAccountPage } from '@/components/themes/my-account-page'

export const metadata: Metadata = {
  title: 'My Account - Manage Your Profile',
  description: 'Manage your account details, view order history, and update your preferences.',
  robots: 'noindex, nofollow',
}

export default function MyAccount() {
  return (
    <ClientLayout>
      <MyAccountPage />
    </ClientLayout>
  )
}
