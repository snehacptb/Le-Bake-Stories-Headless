/**
 * Dynamic Sitemap Generation API Route
 * Generates sitemap.xml for better SEO
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const apiUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL

  const staticUrls = [
    { loc: siteUrl, lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1.0 },
    { loc: `${siteUrl}/about`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.8 },
    { loc: `${siteUrl}/shop`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: 0.9 },
    { loc: `${siteUrl}/blog`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: 0.8 },
    { loc: `${siteUrl}/contact`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.7 },
  ]

  let allUrls = [...staticUrls]

  if (apiUrl) {
    // Fetch blog posts
    try {
      const postsResponse = await fetch(`${apiUrl}/posts?per_page=100`, { cache: 'no-store' })
      if (postsResponse.ok) {
        const posts = await postsResponse.json()
        const postUrls = Array.isArray(posts) ? posts.map((post: any) => ({
          loc: `${siteUrl}/blog/${post.slug}`,
          lastmod: new Date(post.modified || post.date).toISOString(),
          changefreq: 'weekly',
          priority: 0.7,
        })) : []
        allUrls = [...allUrls, ...postUrls]
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }

    // Fetch products
    try {
      const wooKey = process.env.WOOCOMMERCE_CONSUMER_KEY
      const wooSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET

      if (wooKey && wooSecret) {
        const productsResponse = await fetch(
          `${apiUrl.replace('/wp/v2', '/wc/v3')}/products?per_page=100`,
          {
            cache: 'no-store',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${wooKey}:${wooSecret}`).toString('base64')}`
            }
          }
        )

        if (productsResponse.ok) {
          const products = await productsResponse.json()
          const productUrls = Array.isArray(products) ? products.map((product: any) => ({
            loc: `${siteUrl}/product/${product.slug}`,
            lastmod: new Date(product.date_modified || product.date_created).toISOString(),
            changefreq: 'weekly',
            priority: 0.8,
          })) : []
          allUrls = [...allUrls, ...productUrls]
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }

    // Fetch pages
    try {
      const pagesResponse = await fetch(`${apiUrl}/pages?per_page=100`, { cache: 'no-store' })
      if (pagesResponse.ok) {
        const pages = await pagesResponse.json()
        const pageUrls = Array.isArray(pages) ? pages.map((page: any) => ({
          loc: `${siteUrl}/${page.slug}`,
          lastmod: new Date(page.modified || page.date).toISOString(),
          changefreq: 'monthly',
          priority: 0.6,
        })) : []
        allUrls = [...allUrls, ...pageUrls]
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    }
  }

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  })
}

