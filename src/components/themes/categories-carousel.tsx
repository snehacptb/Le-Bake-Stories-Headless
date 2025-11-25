'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CachedProductCategory } from '@/lib/cache-types'
import Link from 'next/link'

interface CategoriesCarouselProps {
  categories: CachedProductCategory[]
}

export function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Show 4 categories at a time (Manila theme reference)
  const categoriesPerPage = 4

  // Filter categories that have images and products
  const categoriesWithImages = categories.filter(cat => cat.image?.src && cat.count > 0)

  // Calculate max slides - slide one category at a time
  const maxSlides = Math.max(0, categoriesWithImages.length - categoriesPerPage)

  // Auto-play functionality - slide one at a time
  useEffect(() => {
    if (!isAutoPlaying || maxSlides === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= maxSlides) {
          return 0 // Loop back to start
        }
        return prevIndex + 1
      })
    }, 6000) // Change every 6 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, maxSlides])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex >= maxSlides) {
        return 0 // Loop back to start
      }
      return prevIndex + 1
    })
    setIsAutoPlaying(false) // Stop auto-play when user interacts
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex <= 0) {
        return maxSlides // Loop to end
      }
      return prevIndex - 1
    })
    setIsAutoPlaying(false) // Stop auto-play when user interacts
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false) // Stop auto-play when user interacts
  }

  // Get categories for current slide - sliding window of 4
  const getCurrentCategories = () => {
    return categoriesWithImages.slice(currentIndex, currentIndex + categoriesPerPage)
  }

  // If no categories with images, don't render anything
  if (categoriesWithImages.length === 0) {
    return null
  }

  // If 4 or fewer categories, show them all without carousel
  if (categoriesWithImages.length <= 4) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4" style={{ gap: '30px' }}>
        {categoriesWithImages.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Navigation Arrows - Manila Theme */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden lg:block">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="rounded-full bg-white shadow-md hover:bg-gray-50"
          style={{ borderColor: 'rgba(129, 129, 129, 0.2)' }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden lg:block">
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="rounded-full bg-white shadow-md hover:bg-gray-50"
          style={{ borderColor: 'rgba(129, 129, 129, 0.2)' }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories Container - Manila 4-column grid */}
      <div className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4" style={{ gap: '30px' }}>
          {getCurrentCategories().map((category, index) => (
            <div
              key={`${currentIndex}-${category.id}`}
              className="opacity-0 animate-fade-in"
              style={{
                animation: 'fadeIn 0.5s ease-in-out forwards',
                animationDelay: `${index * 0.1}s`
              }}
            >
              <CategoryCard
                category={category}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Buttons */}
      <div className="flex justify-center mt-6 space-x-4 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          style={{ borderColor: 'rgba(129, 129, 129, 0.2)' }}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          style={{ borderColor: 'rgba(129, 129, 129, 0.2)' }}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Pagination Dots - Manila Theme */}
      {maxSlides > 0 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: maxSlides + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-black scale-110'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Custom CSS for fade animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Category Card Component - Manila Theme Reference Design
function CategoryCard({
  category,
}: {
  category: CachedProductCategory
}) {
  if (!category.image?.src) return null

  return (
    <Link href={`/shop?category=${category.slug}`}>
      <div className="group cursor-pointer">
        {/* Category Image - No overlay */}
        <div className="relative overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${category.image.src})` }}
          />
        </div>

        {/* Category Name */}
        <h3
          className="text-center uppercase mb-2"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: '#000000'
          }}
        >
          {category.name}
        </h3>

        {/* Product Count */}
        <p
          className="text-center"
          style={{
            fontSize: '12px',
            color: '#999999'
          }}
        >
          {category.count} {category.count === 1 ? 'product' : 'products'}
        </p>
      </div>
    </Link>
  )
}
