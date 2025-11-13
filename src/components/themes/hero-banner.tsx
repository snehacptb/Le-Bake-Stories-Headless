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
    }, 7000) // Change slide every 7 seconds

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
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-50">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentBanner.image.full && (
          <Image
            src={currentBanner.image.full}
            alt={currentBanner.image.alt || currentBanner.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        {/* WoodMart Style Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Content - WoodMart Style */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl text-white">
            {currentBanner.subtitle && (
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20">
                  {currentBanner.subtitle}
                </span>
              </div>
            )}
            
            {currentBanner.title && (
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight">
                <span className="block text-white drop-shadow-lg">
                  {currentBanner.title}
                </span>
              </h1>
            )}

            <div className="flex flex-col sm:flex-row gap-6 mt-10">
              {currentBanner.button1.text && currentBanner.button1.link && (
                <Link href={currentBanner.button1.link}>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-10 py-4 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-full text-base transition-all duration-300 transform hover:scale-105 shadow-xl"
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
                    className="w-full sm:w-auto px-10 py-4 border-2 border-white/50 text-white hover:bg-white/10 hover:border-white font-semibold rounded-full text-base backdrop-blur-sm transition-all duration-300"
                  >
                    {currentBanner.button2.text}
                  </Button>
                </Link>
              )}
            </div>

            {/* Additional WoodMart Features */}
            <div className="mt-12 flex items-center space-x-8 text-white/80">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm">Easy Returns</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - WoodMart Style */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white hover:scale-110 transition-all duration-300 rounded-full shadow-lg flex items-center justify-center"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white hover:scale-110 transition-all duration-300 rounded-full shadow-lg flex items-center justify-center"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots Indicator - WoodMart Style */}
      {banners.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 h-2 bg-white rounded-full'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80 rounded-full'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
