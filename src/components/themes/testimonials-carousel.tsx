'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Testimonial } from '@/types'

interface TestimonialsCarouselProps {
  testimonials: Testimonial[]
}

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Show 3 testimonials at a time
  const testimonialsPerPage = 3
  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages)
    }, 5000) // Change every 5 seconds

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

  // Get testimonials for current page
  const getCurrentTestimonials = () => {
    const startIndex = currentIndex * testimonialsPerPage
    const endIndex = startIndex + testimonialsPerPage
    return testimonials.slice(startIndex, endIndex)
  }

  // If 3 or fewer testimonials, show them all without carousel
  if (testimonials.length <= 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={testimonial.id || index} testimonial={testimonial} />
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

      {/* Testimonials Container */}
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {getCurrentTestimonials().map((testimonial, index) => (
            <div 
              key={testimonial.id || `${currentIndex}-${index}`}
              className="opacity-0 animate-fade-in"
              style={{ 
                animation: 'fadeIn 0.5s ease-in-out forwards',
                animationDelay: `${index * 0.1}s`
              }}
            >
              <TestimonialCard testimonial={testimonial} />
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

// Testimonial Card Component
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [imageError, setImageError] = useState(false)
  
  // Use the processed avatar from the API
  const avatarUrl = testimonial.avatar || ''
  
  // Also check if there's embedded media as fallback
  const embeddedAvatar = (testimonial as any)?._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
  
  // Only use the avatar if we have a direct URL (don't use media proxy fallback)
  const finalAvatarUrl = avatarUrl || embeddedAvatar
  
  const handleImageError = () => {
    setImageError(true)
  }
  
  return (
    <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow duration-300 h-full">
      <div className="flex items-start mb-3 md:mb-4">
        {finalAvatarUrl && !imageError ? (
          <div className="relative w-12 h-12 md:w-14 md:h-14 mr-3 md:mr-4 flex-shrink-0">
            <Image
              src={finalAvatarUrl}
              alt={`${testimonial.name || 'Anonymous'} avatar`}
              fill
              sizes="(max-width: 768px) 48px, 56px"
              className="rounded-full object-cover border-2 border-gray-100"
              onError={handleImageError}
            />
          </div>
        ) : (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-themes-blue-100 to-themes-blue-200 mr-3 md:mr-4 flex items-center justify-center flex-shrink-0">
            <span className="text-themes-blue-600 font-semibold text-base md:text-lg">
              {(testimonial.name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-semibold text-sm md:text-base text-gray-900 truncate">{testimonial.name || 'Anonymous'}</h4>
          {testimonial.role && (
            <p className="text-xs md:text-sm text-gray-500 mb-1 truncate">{testimonial.role}</p>
          )}
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm md:text-base text-gray-600 italic leading-relaxed">"{testimonial.comment || 'No comment available'}"</p>
    </Card>
  )
}
