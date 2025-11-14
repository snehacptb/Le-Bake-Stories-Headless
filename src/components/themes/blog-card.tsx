'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, User, MessageCircle, ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDate, truncateText } from '@/lib/utils'
import { WordPressPost } from '@/types'

interface BlogCardProps {
  post: WordPressPost
  variant?: 'default' | 'featured' | 'compact' | 'horizontal'
  showExcerpt?: boolean
  showAuthor?: boolean
  showDate?: boolean
  showComments?: boolean
  showReadMore?: boolean
  className?: string
}

export function BlogCard({
  post,
  variant = 'default',
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showComments = true,
  showReadMore = true,
  className
}: BlogCardProps) {
  const [imageLoading, setImageLoading] = React.useState(true)
  const [featuredImage, setFeaturedImage] = React.useState<string | null>(null)

  // Extract featured image (you'll need to fetch this from WordPress media API)
  React.useEffect(() => {
    if (post.featured_media) {
      // TODO: fetch and set actual media URL from WordPress media API
      setFeaturedImage(null)
    } else {
      setFeaturedImage(null)
    }
  }, [post.featured_media])

  const cleanExcerpt = post.excerpt.rendered
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\[&hellip;\]/, '...') // Replace WordPress ellipsis

  if (variant === 'compact') {
    return (
      <Link href={`/blog/${post.slug}`}>
        <Card className={cn("group cursor-pointer hover:shadow-lg transition-shadow", className)}>
          <CardContent className="p-4">
            <div className="flex space-x-4">
              {featuredImage && (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={featuredImage}
                    alt={post.title.rendered}
                    fill
                    sizes="80px"
                    className="object-cover rounded-md"
                    onLoad={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-themes-pink-600 transition-colors mb-2">
                  {post.title.rendered}
                </h3>
                {showDate && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(post.date)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <motion.div
        className={cn("group", className)}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="flex">
            {featuredImage && (
              <div className="relative w-1/3 aspect-[4/3]">
                <Link href={`/blog/${post.slug}`}>
                  <Image
                    src={featuredImage}
                    alt={post.title.rendered}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onLoad={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  )}
                </Link>
              </div>
            )}
            
            <CardContent className="flex-1 p-6">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                {showDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(post.date)}
                  </div>
                )}
                {showAuthor && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Author
                  </div>
                )}
                {showComments && (
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    0 Comments
                  </div>
                )}
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-themes-pink-600 transition-colors line-clamp-2">
                  {post.title.rendered}
                </h3>
              </Link>

              {showExcerpt && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {truncateText(cleanExcerpt, 150)}
                </p>
              )}

              {showReadMore && (
                <Link href={`/blog/${post.slug}`}>
                  <Button variant="themes-ghost" className="p-0 h-auto">
                    Read More <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn("group", className)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {featuredImage && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Link href={`/blog/${post.slug}`}>
              <Image
                src={featuredImage}
                alt={post.title.rendered}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onLoad={() => setImageLoading(false)}
              />
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
            </Link>
            
            {variant === 'featured' && (
              <div className="absolute top-4 left-4">
                <Badge variant="featured" className="text-xs">
                  Featured
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardContent className="p-6">
          {/* Meta Information */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            {showDate && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(post.date)}
              </div>
            )}
            {showAuthor && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Author
              </div>
            )}
            {showComments && (
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                0 Comments
              </div>
            )}
          </div>

          {/* Title */}
          <Link href={`/blog/${post.slug}`}>
            <h3 className={cn(
              "font-semibold mb-3 group-hover:text-themes-pink-600 transition-colors line-clamp-2",
              variant === 'featured' ? "text-2xl" : "text-xl"
            )}>
              {post.title.rendered}
            </h3>
          </Link>

          {/* Excerpt */}
          {showExcerpt && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {truncateText(cleanExcerpt, variant === 'featured' ? 200 : 150)}
            </p>
          )}

          {/* Read More */}
          {showReadMore && (
            <div className="flex items-center justify-between">
              <Link href={`/blog/${post.slug}`}>
                <Button variant="themes-ghost" className="p-0 h-auto">
                  Read More <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                5 min read
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
