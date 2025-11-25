/**
 * Robots.txt Generation API Route
 * Controls search engine crawling
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const robots = `# Robots.txt for Le Bake Stories
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/
Disallow: /order-confirmation/
Disallow: /login/
Disallow: /register/
Disallow: /wishlist/

# Block AI crawlers
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml
`

  return new NextResponse(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  })
}

