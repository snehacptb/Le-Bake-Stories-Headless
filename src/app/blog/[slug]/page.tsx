'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
// Use local API routes to avoid browser CORS with WordPress
import { WordPressPost } from '@/types'
import { Calendar, User, ArrowLeft, Share2, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
              <div className="h-12 bg-gray-200 rounded mb-6"></div>
              <div className="h-6 bg-gray-200 rounded mb-8 w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
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
    )
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Blog Link */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>

        <article className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-8">
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((categoryId) => {
                  const category = categories.find(cat => cat.id === categoryId)
                  return category ? (
                    <Badge key={categoryId} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {category.name}
                    </Badge>
                  ) : null
                })}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title.rendered}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Author</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{getReadingTime(post.content.rendered)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-600 hover:text-gray-800"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            <Separator className="mb-8" />
          </header>

          {/* Featured Image */}
          {post.featured_media && (
            <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
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
          <div 
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          />

          {/* Article Footer */}
          <footer className="border-t pt-8">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tagId) => (
                    <Badge key={tagId} variant="outline">
                      #{tagId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Share Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Share this article</h3>
                <p className="text-gray-600">Help others discover this content</p>
              </div>
              <Button onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </footer>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.id} className="group hover:shadow-lg transition-shadow">
                  {relatedPost.featured_media && (
                    <div className="relative h-40 overflow-hidden rounded-t-lg">
                      <Image
                        src={`/api/media/${relatedPost.featured_media}`}
                        alt={relatedPost.title.rendered}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      <Link href={`/blog/${relatedPost.slug}`}>
                        {relatedPost.title.rendered}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {relatedPost.excerpt.rendered.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="text-xs text-gray-500">
                      {formatDate(relatedPost.date)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </ClientLayout>
  )
}
