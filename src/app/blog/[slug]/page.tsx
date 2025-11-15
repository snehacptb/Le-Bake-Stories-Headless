'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
// Use local API routes to avoid browser CORS with WordPress
import { WordPressPost } from '@/types'
import { Calendar, User, ArrowLeft, Share2, Tag, Clock, ChevronRight, MessageCircle, Facebook, Twitter, Linkedin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ClientLayout } from '@/components/themes/client-layout'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [post, setPost] = useState<WordPressPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<WordPressPost[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchPost()
      fetchCategories()
    }
  }, [slug])

  useEffect(() => {
    if (post && categories.length > 0) {
      fetchRelatedPosts()
    }
  }, [post, categories])

  const fetchPost = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.data) {
        setPost(json.data)
      } else {
        setError('Post not found')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      const json = await res.json()
      setCategories(json.success ? json.data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchRelatedPosts = async () => {
    if (!post || !post.categories.length) return

    try {
      const params = new URLSearchParams({ categories: post.categories[0].toString(), per_page: '4' }).toString()
      const res = await fetch(`/api/posts?${params}`, { cache: 'no-store' })
      const json = await res.json()
      const data = json.success ? (json.data || []) : []
      const filtered = data.filter((p: any) => p.id !== post.id).slice(0, 3)
      setRelatedPosts(filtered)
    } catch (error) {
      console.error('Error fetching related posts:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} min read`
  }

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title.rendered,
          text: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('URL copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="animate-pulse">
                  <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
                    <div className="h-12 bg-gray-200 rounded mb-6"></div>
                    <div className="h-6 bg-gray-200 rounded mb-8 w-1/3"></div>
                  </div>
                  <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
                  <div className="bg-white p-8 rounded-lg shadow-sm">
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
              <aside className="lg:w-80">
                <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error || !post) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {error || 'Post not found'}
            </h1>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </ClientLayout>
    )
  }

  const getCategoryName = () => {
    if (post.categories && post.categories.length > 0) {
      const category = categories.find(cat => cat.id === post.categories[0])
      return category ? category.name : 'Uncategorized'
    }
    return 'Uncategorized'
  }

  const handleSocialShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(post?.title.rendered || '')

    const shareUrls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
      telegram: `https://t.me/share/url?url=${url}&text=${title}`
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center text-sm text-gray-600">
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
                  <span className="font-medium">tbmahesh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.date)}</span>
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

            {/* Social Share Section */}
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm mb-8">
              <h3 className="text-lg font-semibold mb-4">Share this post</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleSocialShare('facebook')}
                  className="bg-[#3b5998] hover:bg-[#2d4373] text-white"
                  size="sm"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  onClick={() => handleSocialShare('twitter')}
                  className="bg-[#1da1f2] hover:bg-[#1a8cd8] text-white"
                  size="sm"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  onClick={() => handleSocialShare('pinterest')}
                  className="bg-[#bd081c] hover:bg-[#8c0615] text-white"
                  size="sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Pinterest
                </Button>
                <Button
                  onClick={() => handleSocialShare('linkedin')}
                  className="bg-[#0077b5] hover:bg-[#005582] text-white"
                  size="sm"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  onClick={() => handleSocialShare('telegram')}
                  className="bg-[#0088cc] hover:bg-[#006699] text-white"
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Telegram
                </Button>
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
                    categories.map((category) => (
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
            <Card>
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold uppercase tracking-wide">Recent Posts</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {relatedPosts.slice(0, 3).map((relatedPost) => {
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
                            {postDate.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            <span className="mx-1">•</span>
                            No Comments
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

      </div>
    </div>
    </ClientLayout>
  )
}
