'use client'

import { useState, useEffect } from 'react'
import { Banner } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface HeroBannerProps {
  banners: Banner[]
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance slides
  useEffect(() => {
    if (banners.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 6000) // Change slide every 6 seconds

    return () => clearInterval(timer)
  }, [banners.length])

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1)
  }

  if (!banners || banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  return (
    <section className="relative h-[450px] md:h-[550px] lg:h-[650px] overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentBanner.image.full && (
          <Image
            src={currentBanner.image.full}
            alt={currentBanner.image.alt || currentBanner.title}
            fill
            className="object-cover opacity-60"
            priority
            sizes="100vw"
          />
        )}
        {/* Gradient Overlay - Manila Style */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content - Manila Style */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl text-white">
            {currentBanner.subtitle && (
              <p className="text-sm md:text-base mb-4 text-blue-200 font-medium uppercase tracking-wider">
                {currentBanner.subtitle}
              </p>
            )}
            
            {currentBanner.title && (
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  {currentBanner.title}
                </span>
              </h1>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {currentBanner.button1.text && currentBanner.button1.link && (
                <Link href={currentBanner.button1.link}>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm uppercase tracking-wide transition-all duration-300 transform hover:scale-105"
                  >
                    {currentBanner.button1.text}
                  </Button>
                </Link>
              )}
              
              {currentBanner.button2.text && currentBanner.button2.link && (
                <Link href={currentBanner.button2.link}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-black font-semibold rounded-sm uppercase tracking-wide transition-all duration-300"
                  >
                    {currentBanner.button2.text}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Manila Style */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 rounded-sm"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 rounded-sm"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots Indicator - Manila Style */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-blue-500 rounded-full scale-125'
                  : 'bg-white/60 hover:bg-white/80 rounded-full'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
