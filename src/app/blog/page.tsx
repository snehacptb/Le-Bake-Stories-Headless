'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
// Use local API routes to avoid browser CORS with WordPress
import { WordPressPost, PaginatedResponse } from '@/types'
import { Calendar, User, ArrowRight, Search, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ClientLayout } from '@/components/themes/client-layout'

export default function BlogPage() {
  const [posts, setPosts] = useState<PaginatedResponse<WordPressPost> | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [currentPage, searchTerm, selectedCategory])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        per_page: 9,
        orderby: 'date',
        order: 'desc'
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      if (selectedCategory) {
        params.categories = selectedCategory
      }
      const query = new URLSearchParams(params).toString()
      const res = await fetch(`/api/posts?${query}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setPosts({
          data: json.data,
          total: json.total,
          totalPages: json.totalPages,
          currentPage: json.currentPage,
          hasNextPage: json.hasNextPage,
          hasPrevPage: json.hasPrevPage,
        })
      } else {
        setPosts({ data: [], total: 0, totalPages: 0, currentPage: 1, hasNextPage: false, hasPrevPage: false })
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPosts()
  }

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '')
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">Our Blog</h1>
            <p className="text-base md:text-lg lg:text-xl opacity-90 max-w-2xl mx-auto px-4">
              Discover insights, tips, and stories from our team
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search Section */}
            <div className="mb-6 md:mb-8">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm md:text-base"
                  />
                </div>
                <Button type="submit" onClick={handleSearch} className="whitespace-nowrap">
                  Search
                </Button>
              </form>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Blog Posts Grid */}
            {!loading && posts && (
              <>
                {posts.data.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                    {posts.data.map((post) => {
                      const postDate = new Date(post.date)
                      const day = postDate.getDate().toString().padStart(2, '0')
                      const month = postDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                      const category = post.categories && post.categories.length > 0
                        ? categories.find(cat => cat.id === post.categories[0])
                        : null

                      return (
                        <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                          {/* Featured Image with Overlays */}
                          {post.featured_media && (
                            <div className="relative h-56 overflow-hidden">
                              <Image
                                src={`/api/media/${post.featured_media}`}
                                alt={post.title.rendered}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Date Badge - Top Left */}
                              <div className="absolute top-4 left-4 bg-white text-center py-2 px-3 shadow-md">
                                <div className="text-2xl font-bold text-gray-800">{day}</div>
                                <div className="text-xs font-semibold text-gray-600">{month}</div>
                              </div>

                              {/* Category Badge - Bottom Center */}
                              {category && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                  <Badge className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-4 py-1 uppercase">
                                    {category.name}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          <CardContent className="p-6">
                            {/* Title */}
                            <Link href={`/blog/${post.slug}`}>
                              <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors">
                                {post.title.rendered}
                              </h3>
                            </Link>

                            {/* Posted by */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                              <span>Posted by</span>
                              <span className="font-medium">tbmahesh</span>
                              <User className="h-3 w-3" />
                              <span className="flex items-center gap-1">
                                <span className="bg-purple-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">0</span>
                              </span>
                            </div>

                            {/* Excerpt */}
                            <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                              {truncateText(stripHtml(post.excerpt.rendered), 120)}
                            </p>

                            {/* Continue Reading Link */}
                            <Link
                              href={`/blog/${post.slug}`}
                              className="inline-block text-purple-700 hover:text-purple-900 font-semibold text-sm uppercase tracking-wide"
                            >
                              CONTINUE READING
                            </Link>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* Pagination */}
                {posts.totalPages > 1 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!posts.hasPrevPage}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-2">
                      {[...Array(Math.min(5, posts.totalPages))].map((_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, posts.totalPages))}
                      disabled={!posts.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

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
                        <button
                          onClick={() => handleCategoryFilter(category.id.toString())}
                          className={`text-gray-600 hover:text-purple-700 transition-colors text-sm ${selectedCategory === category.id.toString() ? 'text-purple-700 font-semibold' : ''
                            }`}
                        >
                          {category.name}
                        </button>
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
                  {posts && posts.data.slice(0, 3).map((post) => {
                    const postDate = new Date(post.date)
                    return (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="flex gap-3 group"
                      >
                        {post.featured_media && (
                          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
                            <Image
                              src={`/api/media/${post.featured_media}`}
                              alt={post.title.rendered}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-purple-700 transition-colors mb-1">
                            {post.title.rendered}
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
