'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WooCommerceProduct } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/contexts/cart-context'

interface BestSellersSectionProps {
  saleProducts: WooCommerceProduct[]
  newProducts: WooCommerceProduct[]
  featuredProducts: WooCommerceProduct[]
  topSellers: WooCommerceProduct[]
  className?: string
}

type TabType = 'special' | 'new' | 'featured' | 'top'

export function BestSellersSection({
  saleProducts,
  newProducts,
  featuredProducts,
  topSellers,
  className
}: BestSellersSectionProps) {
  const [currentSaleIndex, setCurrentSaleIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('special')
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play for sale products carousel
  useEffect(() => {
    if (!isAutoPlaying || saleProducts.length === 0) return

    const interval = setInterval(() => {
      setCurrentSaleIndex((prev) => (prev + 1) % saleProducts.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, saleProducts.length])

  const nextSaleProduct = () => {
    setCurrentSaleIndex((prev) => (prev + 1) % saleProducts.length)
    setIsAutoPlaying(false)
  }

  const prevSaleProduct = () => {
    setCurrentSaleIndex((prev) => (prev - 1 + saleProducts.length) % saleProducts.length)
    setIsAutoPlaying(false)
  }

  const getTabProducts = () => {
    switch (activeTab) {
      case 'special':
        return saleProducts.slice(0, 6)
      case 'new':
        return newProducts
      case 'featured':
        return featuredProducts
      case 'top':
        return topSellers
      default:
        return saleProducts.slice(0, 6)
    }
  }

  const currentSaleProduct = saleProducts[currentSaleIndex]

  if (saleProducts.length === 0 && newProducts.length === 0 && featuredProducts.length === 0 && topSellers.length === 0) {
    return null
  }

  return (
    <section className={`py-16 lg:py-20 ${className || ''}`} style={{ backgroundColor: '#ffffff' }}>
      <div className="container mx-auto px-4" style={{ maxWidth: '1222px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Column - Sale Products Carousel */}
          {saleProducts.length > 0 && (
            <div className="relative" style={{ border: '1px solid #e0e0e0', padding: '25px 20px', backgroundColor: '#ffffff' }}>
              {/* Header with navigation */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="uppercase font-bold" style={{ fontSize: '14px', letterSpacing: '0.05em', color: '#000000' }}>
                  SALE PRODUCTS
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevSaleProduct}
                    className="w-7 h-7 flex items-center justify-center border transition-colors hover:bg-gray-100"
                    style={{ borderColor: '#e0e0e0', borderRadius: '0' }}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={nextSaleProduct}
                    className="w-7 h-7 flex items-center justify-center border transition-colors hover:bg-gray-100"
                    style={{ borderColor: '#e0e0e0', borderRadius: '0' }}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sale Product Display */}
              {currentSaleProduct && (
                <Link href={`/product/${currentSaleProduct.slug}`}>
                  <div className="group">
                    {/* Product Image */}
                    <div className="relative mb-5" style={{ aspectRatio: '1/1' }}>
                      {currentSaleProduct.images?.[0] && (
                        <Image
                          src={currentSaleProduct.images[0].src}
                          alt={currentSaleProduct.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* HOT Badge */}
                      {currentSaleProduct.on_sale && (
                        <div
                          className="absolute top-2 left-2"
                          style={{
                            backgroundColor: '#e74c3c',
                            color: '#ffffff',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          HOT
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="text-center">
                      <h4
                        className="mb-1 group-hover:opacity-70 transition-opacity"
                        style={{
                          fontSize: '14px',
                          fontWeight: '400',
                          lineHeight: '1.3',
                          color: '#000000'
                        }}
                      >
                        {currentSaleProduct.name}
                      </h4>

                      {/* Category */}
                      {currentSaleProduct.categories?.[0] && (
                        <p style={{ fontSize: '11px', color: '#999999', marginBottom: '6px' }}>
                          {currentSaleProduct.categories[0].name}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-center gap-2">
                        {currentSaleProduct.on_sale && currentSaleProduct.sale_price ? (
                          <>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#000000' }}>
                              {formatPrice(currentSaleProduct.sale_price)}
                            </span>
                            <span style={{ fontSize: '13px', color: '#999999', textDecoration: 'line-through' }}>
                              {formatPrice(currentSaleProduct.regular_price)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: '16px', fontWeight: '700', color: '#000000' }}>
                            {formatPrice(currentSaleProduct.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Dots Indicator */}
              {saleProducts.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-5">
                  {saleProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentSaleIndex(index)
                        setIsAutoPlaying(false)
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentSaleIndex ? 'bg-black' : 'bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right Column - Tabbed Products */}
          <div>
            {/* Tabs Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('special')}
                  className={`pb-2.5 uppercase font-bold transition-colors relative ${
                    activeTab === 'special' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ fontSize: '13px', letterSpacing: '0.05em' }}
                >
                  SPECIAL OFFER
                  {activeTab === 'special' && (
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{ height: '2px', backgroundColor: '#ff9800' }}
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('new')}
                  className={`pb-2.5 uppercase font-bold transition-colors relative ${
                    activeTab === 'new' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ fontSize: '13px', letterSpacing: '0.05em' }}
                >
                  NEW
                  {activeTab === 'new' && (
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{ height: '2px', backgroundColor: '#ff9800' }}
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('featured')}
                  className={`pb-2.5 uppercase font-bold transition-colors relative ${
                    activeTab === 'featured' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ fontSize: '13px', letterSpacing: '0.05em' }}
                >
                  FEATURED
                  {activeTab === 'featured' && (
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{ height: '2px', backgroundColor: '#ff9800' }}
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('top')}
                  className={`pb-2.5 uppercase font-bold transition-colors relative ${
                    activeTab === 'top' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ fontSize: '13px', letterSpacing: '0.05em' }}
                >
                  TOP SELLERS
                  {activeTab === 'top' && (
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{ height: '2px', backgroundColor: '#ff9800' }}
                    />
                  )}
                </button>
              </div>

              {/* Navigation arrows */}
              <div className="flex items-center gap-1">
                <button
                  className="w-7 h-7 flex items-center justify-center border transition-colors hover:bg-gray-100"
                  style={{ borderColor: '#e0e0e0', borderRadius: '0' }}
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center border transition-colors hover:bg-gray-100"
                  style={{ borderColor: '#e0e0e0', borderRadius: '0' }}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {getTabProducts().map((product) => (
                <TabProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Tab Product Card Component
function TabProductCard({ product }: { product: WooCommerceProduct }) {
  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group">
        {/* Product Image */}
        <div className="relative mb-3" style={{ aspectRatio: '1/1' }}>
          {product.images?.[0] && (
            <Image
              src={product.images[0].src}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}

          {/* HOT Badge */}
          {product.on_sale && (
            <div
              className="absolute top-2 left-2"
              style={{
                backgroundColor: '#e74c3c',
                color: '#ffffff',
                padding: '3px 7px',
                fontSize: '9px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              HOT
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="text-center">
          <h4
            className="mb-1 group-hover:opacity-70 transition-opacity line-clamp-2"
            style={{
              fontSize: '13px',
              fontWeight: '400',
              lineHeight: '1.3',
              color: '#000000'
            }}
          >
            {product.name}
          </h4>

          {/* Category */}
          {product.categories?.[0] && (
            <p style={{ fontSize: '10px', color: '#999999', marginBottom: '5px' }}>
              {product.categories[0].name}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center justify-center gap-2">
            {product.on_sale && product.sale_price ? (
              <>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#000000' }}>
                  {formatPrice(product.sale_price)}
                </span>
                <span style={{ fontSize: '12px', color: '#999999', textDecoration: 'line-through' }}>
                  {formatPrice(product.regular_price)}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#000000' }}>
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
