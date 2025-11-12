import { Metadata } from 'next'
import { ClientLayout } from '@/components/themes/client-layout'
import { LoginPage } from '@/components/themes/login-page'

export const metadata: Metadata = {
  title: 'Login - Access Your Account',
  description: 'Sign in to your account to access your orders, wishlist, and account settings.',
  robots: 'noindex, nofollow',
}

export default function Login() {
  return (
    <ClientLayout>
      <LoginPage />
    </ClientLayout>
  )
}
