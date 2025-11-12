import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { RegisterPage } from '@/components/themes/register-page'

export const metadata: Metadata = {
  title: 'Register - Create Your Account',
  description: 'Create a new account to access exclusive features, track orders, and enjoy personalized shopping.',
  robots: 'noindex, nofollow',
}

export default function Register() {
  return (
    <ClientLayout>
      <RegisterPage />
    </ClientLayout>
  )
}
