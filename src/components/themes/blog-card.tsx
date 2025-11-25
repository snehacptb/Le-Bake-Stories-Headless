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
  // Extract featured image from embedded data
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null

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
                  />
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
                  />
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
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: '0', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {featuredImage && (
          <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <Link href={`/blog/${post.slug}`}>
              <Image
                src={featuredImage}
                alt={post.title.rendered}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>

            {/* Date Badge - Manila Style */}
            {showDate && (
              <div className="absolute top-4 left-4" style={{
                backgroundColor: 'rgba(9, 33, 67, 0.9)',
                color: '#ffffff',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '2px'
              }}>
                {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '30px 20px' }}>
          {/* Title */}
          <Link href={`/blog/${post.slug}`}>
            <h3 className="group-hover:opacity-70 transition-opacity line-clamp-2" style={{
              fontSize: '18px',
              fontWeight: '400',
              lineHeight: '1.4',
              marginBottom: '12px',
              color: '#000000'
            }}>
              {post.title.rendered}
            </h3>
          </Link>

          {/* Excerpt */}
          {showExcerpt && (
            <p className="line-clamp-3" style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#777777',
              marginBottom: '20px'
            }}>
              {truncateText(cleanExcerpt, 120)}
            </p>
          )}

          {/* Read More */}
          {showReadMore && (
            <Link href={`/blog/${post.slug}`}>
              <span className="inline-flex items-center hover:opacity-70 transition-opacity" style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Read More <ArrowRight className="h-3 w-3 ml-1" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
