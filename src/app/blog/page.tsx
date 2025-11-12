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
        {/* Search and Filter Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
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

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 md:gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('')}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.id.toString())}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                {posts.data.map((post) => (
                  <Card key={post.id} className="group hover:shadow-lg transition-shadow duration-300">
                    {/* Featured Image */}
                    {post.featured_media && (
                      <div className="relative h-40 md:h-48 overflow-hidden rounded-t-lg">
                        <Image
                          src={`/api/media/${post.featured_media}`}
                          alt={post.title.rendered}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <CardContent className="p-4 md:p-6">
                      {/* Category Tags */}
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
                          {post.categories.slice(0, 2).map((categoryId) => {
                            const category = categories.find(cat => cat.id === categoryId)
                            return category ? (
                              <Badge key={categoryId} variant="secondary" className="text-xs">
                                {category.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title.rendered}
                        </Link>
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 line-clamp-3">
                        {truncateText(stripHtml(post.excerpt.rendered))}
                      </p>

                      {/* Meta Information */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(post.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Author</span>
                          </div>
                        </div>
                      </div>

                      {/* Read More Link */}
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Read More
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
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
    </div>
    </ClientLayout>
  )
}
