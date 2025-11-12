'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatPrice } from '@/lib/utils'
import { WooCommerceProduct } from '@/types'

interface ProductVariation {
  id: number
  date_created: string
  date_modified: string
  description: string
  permalink: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  date_on_sale_from: string | null
  date_on_sale_to: string | null
  on_sale: boolean
  status: 'publish' | 'private' | 'draft'
  purchasable: boolean
  virtual: boolean
  downloadable: boolean
  downloads: any[]
  download_limit: number
  download_expiry: number
  tax_status: 'taxable' | 'shipping' | 'none'
  tax_class: string
  manage_stock: boolean
  stock_quantity: number | null
  stock_status: 'instock' | 'outofstock' | 'onbackorder'
  backorders: 'no' | 'notify' | 'yes'
  backorders_allowed: boolean
  backordered: boolean
  low_stock_amount: number | null
  weight: string
  dimensions: {
    length: string
    width: string
    height: string
  }
  shipping_class: string
  shipping_class_id: number
  image: {
    id: number
    date_created: string
    date_modified: string
    src: string
    name: string
    alt: string
  } | null
  attributes: {
    id: number
    name: string
    option: string
  }[]
  menu_order: number
  meta_data: any[]
}

interface ProductVariationsProps {
  product: WooCommerceProduct
  onVariationChange: (variation: ProductVariation | null, attributes: Record<string, string>) => void
  selectedAttributes: Record<string, string>
}

export function ProductVariations({ 
  product, 
  onVariationChange, 
  selectedAttributes 
}: ProductVariationsProps) {
  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null)

  // Get variable attributes (attributes that are used for variations)
  const variableAttributes = product.attributes?.filter(attr => attr.variation) || []

  // Fetch variations when component mounts
  useEffect(() => {
    if (product.type === 'variable' && product.variations && product.variations.length > 0) {
      fetchVariations()
    }
  }, [product.id])

  // Update selected variation when attributes change
  useEffect(() => {
    if (variations.length > 0 && variableAttributes.length > 0) {
      findMatchingVariation()
    }
  }, [selectedAttributes, variations])

  const fetchVariations = async () => {
    setLoading(true)
    try {
      // Fetch variations from API
      const response = await fetch(`/api/products/${product.id}/variations`)
      if (response.ok) {
        const { data } = await response.json()
        setVariations(data || [])
      }
    } catch (error) {
      console.error('Error fetching variations:', error)
    } finally {
      setLoading(false)
    }
  }

  const findMatchingVariation = () => {
    const matchingVariation = variations.find(variation => {
      return variation.attributes.every(attr => {
        const selectedValue = selectedAttributes[attr.name]
        return !selectedValue || selectedValue === attr.option || attr.option === ''
      })
    })

    if (matchingVariation !== selectedVariation) {
      setSelectedVariation(matchingVariation || null)
      onVariationChange(matchingVariation || null, selectedAttributes)
    }
  }

  const handleAttributeChange = (attributeName: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: value }
    onVariationChange(selectedVariation, newAttributes)
  }

  const getAvailableOptions = (attributeName: string) => {
    const attribute = product.attributes?.find(attr => attr.name === attributeName)
    if (!attribute) return []

    // Filter options based on available variations
    const availableOptions = attribute.options.filter(option => {
      return variations.some(variation => {
        const varAttr = variation.attributes.find(attr => attr.name === attributeName)
        return !varAttr || varAttr.option === '' || varAttr.option === option
      })
    })

    return availableOptions
  }

  const isOptionAvailable = (attributeName: string, option: string) => {
    // Check if this option combination would result in an available variation
    const testAttributes = { ...selectedAttributes, [attributeName]: option }
    
    return variations.some(variation => {
      if (variation.stock_status === 'outofstock') return false
      
      return variation.attributes.every(attr => {
        const testValue = testAttributes[attr.name]
        return !testValue || testValue === attr.option || attr.option === ''
      })
    })
  }

  // Don't render if not a variable product
  if (product.type !== 'variable' || variableAttributes.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Product Options</h3>
      
      {loading ? (
        <div className="space-y-3">
          {variableAttributes.map((attr) => (
            <div key={attr.id} className="space-y-2">
              <Label className="text-sm font-medium">{attr.name}</Label>
              <div className="h-10 bg-gray-200 animate-pulse rounded-md"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {variableAttributes.map((attribute) => {
            const availableOptions = getAvailableOptions(attribute.name)
            const selectedValue = selectedAttributes[attribute.name]

            return (
              <div key={attribute.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {attribute.name}
                  {selectedValue && (
                    <span className="ml-2 text-gray-500">({selectedValue})</span>
                  )}
                </Label>

                {/* Render as color swatches for color attributes */}
                {attribute.name.toLowerCase().includes('color') ? (
                  <div className="flex flex-wrap gap-2">
                    {availableOptions.map((option) => {
                      const isSelected = selectedValue === option
                      const isAvailable = isOptionAvailable(attribute.name, option)
                      
                      return (
                        <button
                          key={option}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            isSelected 
                              ? "border-themes-blue-600 ring-2 ring-themes-blue-200" 
                              : "border-gray-300 hover:border-gray-400",
                            !isAvailable && "opacity-50 cursor-not-allowed"
                          )}
                          style={{ 
                            backgroundColor: option.toLowerCase(),
                            backgroundImage: option.toLowerCase().includes('gradient') 
                              ? `linear-gradient(45deg, ${option.toLowerCase()})` 
                              : undefined
                          }}
                          onClick={() => isAvailable && handleAttributeChange(attribute.name, option)}
                          disabled={!isAvailable}
                          title={`${option}${!isAvailable ? ' (Out of stock)' : ''}`}
                        />
                      )
                    })}
                  </div>
                ) : 
                /* Render as size buttons for size attributes */
                attribute.name.toLowerCase().includes('size') ? (
                  <div className="flex flex-wrap gap-2">
                    {availableOptions.map((option) => {
                      const isSelected = selectedValue === option
                      const isAvailable = isOptionAvailable(attribute.name, option)
                      
                      return (
                        <Button
                          key={option}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "min-w-[3rem]",
                            !isAvailable && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => isAvailable && handleAttributeChange(attribute.name, option)}
                          disabled={!isAvailable}
                        >
                          {option}
                          {!isAvailable && (
                            <span className="ml-1 text-xs">✕</span>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  /* Render as dropdown for other attributes */
                  <Select
                    value={selectedValue || ''}
                    onValueChange={(value) => handleAttributeChange(attribute.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose ${attribute.name.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.map((option) => {
                        const isAvailable = isOptionAvailable(attribute.name, option)
                        
                        return (
                          <SelectItem 
                            key={option} 
                            value={option}
                            disabled={!isAvailable}
                          >
                            {option}
                            {!isAvailable && ' (Out of stock)'}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )
          })}

          {/* Show selected variation info */}
          {selectedVariation && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Selected Variation
                    </p>
                    <p className="text-sm text-gray-600">
                      SKU: {selectedVariation.sku || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {selectedVariation.on_sale && selectedVariation.sale_price ? (
                        <>
                          <span className="text-lg font-bold text-themes-blue-600">
                            {formatPrice(selectedVariation.sale_price)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(selectedVariation.regular_price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(selectedVariation.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedVariation.stock_status === 'instock' ? (
                        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                          In Stock
                        </Badge>
                      ) : selectedVariation.stock_status === 'outofstock' ? (
                        <Badge variant="destructive">
                          Out of Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
                          On Backorder
                        </Badge>
                      )}
                      {selectedVariation.manage_stock && selectedVariation.stock_quantity !== null && selectedVariation.stock_quantity <= 5 && selectedVariation.stock_quantity > 0 && (
                        <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
                          Only {selectedVariation.stock_quantity} left!
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show message if no variation is selected but attributes are required */}
          {!selectedVariation && variableAttributes.some(attr => !selectedAttributes[attr.name]) && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800">
                  Please select all product options to see pricing and availability.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
