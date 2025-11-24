'use client'

import { useState, useEffect } from 'react'
import { Banner } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ShopBannerProps {
  banners: Banner[]
}

export function ShopBanner({ banners }: ShopBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance slides
  useEffect(() => {
    if (banners.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 7000)

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
    <section
      className="relative h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden"
      style={{ backgroundColor: 'rgb(53,55,52)' }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentBanner.image?.full && (
          <Image
            src={currentBanner.image.full}
            alt={currentBanner.image?.alt || currentBanner.title || 'Shop Banner'}
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
          <div className="max-w-3xl mx-auto text-center text-white">
            {currentBanner.subtitle && (
              <div className="mb-3 md:mb-4">
                <span className="text-sm md:text-base font-semibold text-white">
                  {currentBanner.subtitle}
                </span>
              </div>
            )}

            {currentBanner.title && (
              <h1
                className="font-normal mb-4 md:mb-6 leading-tight"
                style={{
                  fontSize: 'clamp(24px, 4vw, 42px)',
                  fontWeight: 400,
                  color: '#FFFFFF'
                }}
              >
                {currentBanner.title}
              </h1>
            )}

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6 justify-center items-center">
              {(currentBanner.button1?.text || currentBanner.button1?.link) && (
                <Link href={currentBanner.button1?.link || '#'}>
                  <Button
                    className="w-full sm:w-auto text-white font-medium transition-all duration-300 hover:opacity-90"
                    style={{
                      backgroundColor: '#32373c',
                      padding: 'calc(0.667em + 2px) calc(1.333em + 2px)',
                      marginRight: '0px'
                    }}
                  >
                    {currentBanner.button1?.text || 'Shop Now'}
                  </Button>
                </Link>
              )}

              {(currentBanner.button2?.text || currentBanner.button2?.link) && (
                <Link href={currentBanner.button2?.link || '#'}>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-2 text-white font-medium hover:bg-white/10 transition-all duration-300"
                    style={{
                      borderColor: '#fff',
                      padding: 'calc(0.667em + 2px) calc(1.333em + 2px)',
                      marginLeft: '20px'
                    }}
                  >
                    {currentBanner.button2?.text || 'Learn More'}
                  </Button>
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
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 rounded-full flex items-center justify-center"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 rounded-full flex items-center justify-center"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots Indicator - Manila Theme Style */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-6 h-2 bg-white'
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
