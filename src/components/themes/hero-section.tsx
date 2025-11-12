'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Star, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HeroSlide {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string
  imageAlt: string
  ctaText: string
  ctaLink: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'sale' | 'featured'
  }
  overlay?: boolean
  textAlign?: 'left' | 'center' | 'right'
}

interface HeroSectionProps {
  slides: HeroSlide[]
  autoplay?: boolean
  autoplayDelay?: number
  showDots?: boolean
  showArrows?: boolean
  height?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const defaultSlides: HeroSlide[] = [
  {
    id: '1',
    title: 'Summer Collection 2024',
    subtitle: 'New Arrivals',
    description: 'Discover our latest summer collection with trendy styles and comfortable fabrics perfect for the season.',
    image: '',
    imageAlt: 'Summer Collection',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    badge: {
      text: 'New Collection',
      variant: 'featured'
    },
    overlay: true,
    textAlign: 'left'
  },
  {
    id: '2',
    title: 'Up to 50% Off',
    subtitle: 'Limited Time Offer',
    description: 'Save big on selected items from our premium collection. Hurry, offer ends soon!',
    image: '',
    imageAlt: 'Sale Banner',
    ctaText: 'Shop Sale',
    ctaLink: '/shop/sale',
    badge: {
      text: '50% Off',
      variant: 'sale'
    },
    overlay: true,
    textAlign: 'center'
  }
]

const heightClasses = {
  sm: 'h-64 md:h-80',
  md: 'h-80 md:h-96',
  lg: 'h-96 md:h-[500px]',
  xl: 'h-[500px] md:h-[600px]',
  full: 'h-screen'
}

export function HeroSection({
  slides = defaultSlides,
  autoplay = true,
  autoplayDelay = 5000,
  showDots = true,
  showArrows = true,
  height = 'lg',
  className
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(autoplay)

  React.useEffect(() => {
    if (!isPlaying || slides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, autoplayDelay)

    return () => clearInterval(interval)
  }, [isPlaying, slides.length, autoplayDelay])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const currentSlideData = slides[currentSlide]

  return (
    <section className={cn("relative overflow-hidden", heightClasses[height], className)}>
      {/* Slide Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: 0, x: index > currentSlide ? 100 : -100 }}
            animate={{ 
              opacity: index === currentSlide ? 1 : 0,
              x: index === currentSlide ? 0 : index > currentSlide ? 100 : -100
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ pointerEvents: index === currentSlide ? 'auto' : 'none' }}
          >
            {/* Background Image */}
            <div className="relative w-full h-full">
              {slide.image ? (
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={index === 0}
                />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
              
              {/* Overlay */}
              {slide.overlay && (
                <div className="absolute inset-0 bg-black/40" />
              )}
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className={cn(
                  "max-w-2xl",
                  slide.textAlign === 'center' && "mx-auto text-center",
                  slide.textAlign === 'right' && "ml-auto text-right"
                )}>
                  {/* Badge */}
                  {slide.badge && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-4"
                    >
                      <Badge variant={slide.badge.variant} className="text-sm px-3 py-1">
                        {slide.badge.text}
                      </Badge>
                    </motion.div>
                  )}

                  {/* Subtitle */}
                  {slide.subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg md:text-xl text-white/90 font-medium mb-2"
                    >
                      {slide.subtitle}
                    </motion.p>
                  )}

                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                  >
                    {slide.title}
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed"
                  >
                    {slide.description}
                  </motion.p>

                  {/* CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <Button size="lg" variant="themes" className="text-lg px-8 py-3" asChild>
                      <Link href={slide.ctaLink}>
                        {slide.ctaText}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    
                    {slide.secondaryCtaText && slide.secondaryCtaLink && (
                      <Button size="lg" variant="themes-outline" className="text-lg px-8 py-3 bg-white/10 border-white/30 text-white hover:bg-white hover:text-gray-900" asChild>
                        <Link href={slide.secondaryCtaLink}>
                          {slide.secondaryCtaText}
                        </Link>
                      </Button>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-colors"
            onMouseEnter={() => setIsPlaying(false)}
            onMouseLeave={() => setIsPlaying(autoplay)}
          >
            <ArrowRight className="h-6 w-6 text-white rotate-180" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-colors"
            onMouseEnter={() => setIsPlaying(false)}
            onMouseLeave={() => setIsPlaying(autoplay)}
          >
            <ArrowRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
              onMouseEnter={() => setIsPlaying(false)}
              onMouseLeave={() => setIsPlaying(autoplay)}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Control */}
      {autoplay && slides.length > 1 && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
        >
          <Play className={cn(
            "h-4 w-4 text-white transition-transform",
            isPlaying && "scale-0"
          )} />
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-transform",
            !isPlaying && "scale-0"
          )}>
            <div className="w-1 h-3 bg-white rounded-full mr-0.5" />
            <div className="w-1 h-3 bg-white rounded-full ml-0.5" />
          </div>
        </button>
      )}
    </section>
  )
}
