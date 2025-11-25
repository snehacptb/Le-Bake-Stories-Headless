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

  // Debug logging
  useEffect(() => {
    console.log('Current Banner Data:', currentBanner)
    console.log('Button 1:', currentBanner.button1)
    console.log('Button 2:', currentBanner.button2)
  }, [currentBanner])

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden" style={{ backgroundColor: 'rgb(53,55,52)' }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentBanner.image?.full && (
          <Image
            src={currentBanner.image.full}
            alt={currentBanner.image?.alt || currentBanner.title || 'Hero Banner'}
            fill
            className="object-cover"
            style={{ backgroundPosition: 'center center', backgroundSize: 'cover' }}
            priority
            sizes="100vw"
          />
        )}
        {/* Manila Theme Overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content - Manila Theme Centered Layout */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
          <div className="max-w-4xl mx-auto text-center text-white">
            {currentBanner.subtitle && (
              <div className="mb-4 md:mb-6">
                <span className="text-base md:text-lg font-semibold text-white">
                  {currentBanner.subtitle}
                </span>
              </div>
            )}

            {currentBanner.title && (
              <h1
                className="font-normal mb-6 md:mb-8 leading-tight"
                style={{
                  fontSize: 'clamp(26px, 5vw, 50px)',
                  fontWeight: 400,
                  color: '#FFFFFF'
                }}
              >
                {currentBanner.title}
              </h1>
            )}

            <div className="flex flex-col sm:flex-row gap-4 md:gap-5 mt-6 md:mt-8 justify-center items-center">
              {(currentBanner.button1?.text || currentBanner.button1?.link) && (
                <Link href={currentBanner.button1?.link || '#'}>
                  <button
                    className="font-medium transition-all duration-300 hover:opacity-80 uppercase tracking-wider"
                    style={{
                      backgroundColor: '#c71585',
                      color: '#ffffff',
                      padding: '12px 30px',
                      border: 'none',
                      borderRadius: '30px',
                      fontSize: '12px',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      cursor: 'pointer'
                    }}
                  >
                    {currentBanner.button1?.text || 'SHOP NOW'}
                  </button>
                </Link>
              )}

              {(currentBanner.button2?.text || currentBanner.button2?.link) && (
                <Link href={currentBanner.button2?.link || '#'}>
                  <button
                    className="font-medium transition-all duration-300 hover:bg-white hover:text-black uppercase tracking-wider"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      padding: '12px 30px',
                      border: '2px solid #ffffff',
                      borderRadius: '30px',
                      fontSize: '12px',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      cursor: 'pointer'
                    }}
                  >
                    {currentBanner.button2?.text || 'LEARN MORE'}
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Manila Theme Style */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 rounded-full flex items-center justify-center"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 rounded-full flex items-center justify-center"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator - Manila Theme Style */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
