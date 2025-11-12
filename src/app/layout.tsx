import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Providers } from '@/components/providers'
import { SiteMetadata } from '@/components/site-metadata'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Le Bake Stories - Artisan Bakery & Desserts',
    template: '%s | Le Bake Stories'
  },
  description: 'Le Bake Stories - Celebrate life\'s sweetest moments with bespoke cakes, handcrafted pastries, and artisan desserts baked fresh daily in Kochi.',
  keywords: ['bakery', 'cakes', 'pastries', 'desserts', 'kochi', 'artisan bakery', 'custom cakes', 'celebration cakes', 'wedding cakes', 'birthday cakes'],
  authors: [{ name: 'Le Bake Stories' }],
  creator: 'Le Bake Stories',
  publisher: 'Le Bake Stories',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3000',
    title: 'Le Bake Stories - Artisan Bakery & Desserts',
    description: 'Le Bake Stories - Celebrate life\'s sweetest moments with bespoke cakes, handcrafted pastries, and artisan desserts baked fresh daily in Kochi.',
    siteName: 'Le Bake Stories',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Le Bake Stories - Artisan Bakery & Desserts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Le Bake Stories - Artisan Bakery & Desserts',
    description: 'Le Bake Stories - Celebrate life\'s sweetest moments with bespoke cakes, handcrafted pastries, and artisan desserts baked fresh daily in Kochi.',
    images: ['/og-image.jpg'],
    creator: '@LeBakeStories',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <SiteMetadata />
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
