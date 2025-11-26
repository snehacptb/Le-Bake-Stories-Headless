/**
 * Blog Post Page - Server-Side Rendered with Full SEO
 * This is a SERVER COMPONENT for better SEO
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User, MessageCircle, ChevronRight, Facebook, Twitter, Linkedin, Send, Share2 } from 'lucide-react'
import { ClientLayout } from '@/components/themes/client-layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { seopressService } from '@/lib/seopress-service'
import { convertToNextMetadata, generateArticleJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo-utils'
import { WordPressPost } from '@/types'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

/**
 * Fetch post data
 */
async function getPost(slug: string): Promise<WordPressPost | null> {
  try {
    const apiUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL
    const response = await fetch(`${apiUrl}/posts?slug=${slug}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) return null

    const posts = await response.json()
    return posts.length > 0 ? posts[0] : null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

/**
 * Fetch categories
 */
async function getCategories() {
  try {
    const apiUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL
    const response = await fetch(`${apiUrl}/categories`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) return []

    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Fetch related posts
 */
async function getRelatedPosts(categoryId: number, excludeId: number) {
  try {
    const apiUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL
    const response = await fetch(
      `${apiUrl}/posts?categories=${categoryId}&per_page=4&exclude=${excludeId}`,
      { next: { revalidate: 300 } }
    )

    if (!response.ok) return []

    const posts = await response.json()
    return posts.slice(0, 3)
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPost(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  // Fetch SEOPress metadata
  const seopressMeta = await seopressService.getMetadataBySlug(params.slug, 'post')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const postUrl = `${siteUrl}/blog/${params.slug}`

  // Get featured image
  let featuredImage = ''
  if (post.featured_media) {
    const mediaUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL
    featuredImage = `${siteUrl}/api/media/${post.featured_media}`
  }

  // Convert SEOPress metadata to Next.js metadata
  const metadata = convertToNextMetadata(seopressMeta, {
    title: post.title.rendered,
    description: post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160),
    url: postUrl,
    image: featuredImage,
  })

  return metadata
}

/**
 * Blog Post Page Component
 */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, categories] = await Promise.all([
    getPost(params.slug),
    getCategories(),
  ])

  if (!post) {
    notFound()
  }

  // Fetch related posts if post has categories
  const relatedPosts = post.categories && post.categories.length > 0
    ? await getRelatedPosts(post.categories[0], post.id)
    : []

  // Fetch SEOPress metadata for breadcrumbs and schema
  const seopressMeta = await seopressService.getMetadataBySlug(params.slug, 'post')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const postUrl = `${siteUrl}/blog/${params.slug}`

  // Generate JSON-LD structured data
  const articleJsonLd = generateArticleJsonLd({
    headline: post.title.rendered,
    description: post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160),
    author: 'Le Bake Stories',
    datePublished: post.date,
    dateModified: post.modified,
    image: post.featured_media ? `${siteUrl}/api/media/${post.featured_media}` : undefined,
    url: postUrl,
  })

  // Generate breadcrumb JSON-LD
  const breadcrumbs = seopressMeta?.breadcrumbs || [
    { name: 'Home', url: siteUrl },
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: post.title.rendered, url: postUrl },
  ]
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryName = () => {
    if (post.categories && post.categories.length > 0) {
      const category = categories.find((cat: any) => cat.id === post.categories[0])
      return category ? category.name : 'Uncategorized'
    }
    return 'Uncategorized'
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ClientLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumb */}
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center text-sm text-gray-600" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-purple-700 transition-colors">
                  Home
                </Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <Link href="/blog" className="hover:text-purple-700 transition-colors">
                  Blog
                </Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="text-gray-400">{getCategoryName()}</span>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="text-gray-900 font-medium truncate">{post.title.rendered}</span>
              </nav>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Content */}
              <article className="flex-1">
                {/* Article Header */}
                <header className="mb-8 bg-white p-6 md:p-8 rounded-lg shadow-sm">
                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    {post.title.rendered}
                  </h1>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="font-medium">Le Bake Stories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>0 Comments</span>
                    </div>
                  </div>
                </header>

                {/* Featured Image */}
                {post.featured_media && (
                  <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={`/api/media/${post.featured_media}`}
                      alt={post.title.rendered}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm mb-8">
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content.rendered }}
                  />
                </div>

                {/* Social Share Section - This needs to be a client component */}
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm mb-8">
                  <h3 className="text-lg font-semibold mb-4">Share this post</h3>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-md text-sm"
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title.rendered)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#1da1f2] hover:bg-[#1a8cd8] text-white rounded-md text-sm"
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                    <a
                      href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title.rendered)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#0077b5] hover:bg-[#005582] text-white rounded-md text-sm"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="lg:w-80 space-y-8">
                {/* Categories */}
                <Card>
                  <CardHeader className="pb-4">
                    <h3 className="text-xl font-bold uppercase tracking-wide">Categories</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {categories.length > 0 ? (
                        categories.map((category: any) => (
                          <li key={category.id}>
                            <Link
                              href={`/blog?category=${category.id}`}
                              className="text-gray-600 hover:text-purple-700 transition-colors text-sm"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 text-sm">Uncategorized</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                {/* Recent Posts */}
                {relatedPosts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-4">
                      <h3 className="text-xl font-bold uppercase tracking-wide">Related Posts</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {relatedPosts.map((relatedPost: any) => {
                          const postDate = new Date(relatedPost.date)
                          return (
                            <Link
                              key={relatedPost.id}
                              href={`/blog/${relatedPost.slug}`}
                              className="flex gap-3 group"
                            >
                              {relatedPost.featured_media && (
                                <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded">
                                  <Image
                                    src={`/api/media/${relatedPost.featured_media}`}
                                    alt={relatedPost.title.rendered}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-purple-700 transition-colors mb-1">
                                  {relatedPost.title.rendered}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  <time dateTime={relatedPost.date}>
                                    {postDate.toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </time>
                                </p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </aside>
            </div>
          </div>
        </div>
      </ClientLayout>
    </>
  )
}
