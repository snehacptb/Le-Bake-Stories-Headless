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

  // Show 5 categories at a time (Manila theme 5-column layout)
  const categoriesPerPage = 5
  const totalPages = Math.ceil(categories.length / categoriesPerPage)

  // Filter categories that have images
  const categoriesWithImages = categories.filter(cat => cat.image?.src)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages)
    }, 6000) // Change every 6 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, totalPages])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages)
    setIsAutoPlaying(false) // Stop auto-play when user interacts
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPages) % totalPages)
    setIsAutoPlaying(false) // Stop auto-play when user interacts
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false) // Stop auto-play when user interacts
  }

  // Get categories for current page
  const getCurrentCategories = () => {
    const startIndex = currentIndex * categoriesPerPage
    const endIndex = startIndex + categoriesPerPage
    return categoriesWithImages.slice(startIndex, endIndex)
  }

  // If no categories with images, don't render anything
  if (categoriesWithImages.length === 0) {
    return null
  }

  // If 5 or fewer categories, show them all without carousel
  if (categoriesWithImages.length <= 5) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* Categories Container - Manila 5-column grid */}
      <div className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          disabled={currentIndex === 0}
          style={{ borderColor: 'rgba(129, 129, 129, 0.2)' }}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={currentIndex === totalPages - 1}
          style={{ borderColor: 'rgba(129, 129, 129, 0.2)' }}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Pagination Dots - Manila Theme */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
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

// Category Card Component - Manila Theme
function CategoryCard({
  category,
}: {
  category: CachedProductCategory
}) {
  if (!category.image?.src) return null

  return (
    <Link href={`/shop?category=${category.slug}`}>
      <div className="group cursor-pointer transition-all duration-300 overflow-hidden">
        <div className="relative aspect-square overflow-hidden rounded-sm">
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundImage: `url(${category.image.src})` }}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h3 className="text-lg md:text-xl font-normal text-white mb-1" style={{ fontWeight: 400 }}>
              {category.name}
            </h3>
            <p className="text-sm text-white/80">{category.count} {category.count === 1 ? 'Product' : 'Products'}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
