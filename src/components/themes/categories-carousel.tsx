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

  // Show 6 categories at a time (maintaining the existing structure)
  const categoriesPerPage = 6
  const totalPages = Math.ceil(categories.length / categoriesPerPage)

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
    return categories.slice(startIndex, endIndex)
  }

  // Category-specific placeholder images function
  const getCategoryPlaceholder = (categoryName: string, index: number) => {
    const name = categoryName.toLowerCase()
    
    // Category-specific images from Unsplash
    if (name.includes('clothing') || name.includes('apparel') || name.includes('fashion')) {
      return 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('electronics') || name.includes('tech') || name.includes('gadget')) {
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('home') || name.includes('decor') || name.includes('furniture')) {
      return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('book') || name.includes('education') || name.includes('learning')) {
      return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('sport') || name.includes('fitness') || name.includes('outdoor')) {
      return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('beauty') || name.includes('cosmetic') || name.includes('skincare')) {
      return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('jewelry') || name.includes('accessories')) {
      return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('food') || name.includes('grocery') || name.includes('kitchen')) {
      return 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('toy') || name.includes('game') || name.includes('kids')) {
      return 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    } else if (name.includes('automotive') || name.includes('car') || name.includes('vehicle')) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }
    
    // Fallback images with variety
    const fallbackImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ]
    return fallbackImages[index % fallbackImages.length]
  }

  // If 6 or fewer categories, show them all without carousel
  if (categories.length <= 6) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category, index) => (
          <CategoryCard 
            key={category.id} 
            category={category} 
            index={index}
            getCategoryPlaceholder={getCategoryPlaceholder}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden md:block">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="rounded-full bg-white shadow-lg hover:bg-gray-50 border-gray-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden md:block">
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="rounded-full bg-white shadow-lg hover:bg-gray-50 border-gray-200"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories Container */}
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                index={index}
                getCategoryPlaceholder={getCategoryPlaceholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Buttons */}
      <div className="flex justify-center mt-6 space-x-4 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="rounded-full"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={currentIndex === totalPages - 1}
          className="rounded-full"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-themes-blue-600 scale-110'
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

// Category Card Component
function CategoryCard({ 
  category, 
  index, 
  getCategoryPlaceholder 
}: { 
  category: CachedProductCategory
  index: number
  getCategoryPlaceholder: (categoryName: string, index: number) => string
}) {
  const imageUrl = category.image?.src || getCategoryPlaceholder(category.name, index)
  
  return (
    <Link href={`/shop?category=${category.slug}`}>
      <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
              <p className="text-white/90">{category.count} Products</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
