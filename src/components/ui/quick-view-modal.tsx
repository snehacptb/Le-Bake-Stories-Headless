"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WooCommerceProduct } from "@/types";

interface QuickViewModalProps {
  product: WooCommerceProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: WooCommerceProduct) => void;
  onAddToWishlist?: (product: WooCommerceProduct) => void;
}

export const QuickViewModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
}: QuickViewModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const price = parseFloat(product.price);
  const regularPrice = parseFloat(product.regular_price || product.price);
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const discountPercentage = salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  const rating = parseFloat(product.average_rating || '0');
  const reviewCount = parseInt(product.rating_count?.toString() || '0');

  const handleAddToCart = () => {
    onAddToCart(product);
    onClose();
  };

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex flex-col lg:flex-row">
                {/* Product Image Section */}
                <div className="lg:w-1/2 p-6">
                  <div className="relative">
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      {product.on_sale && discountPercentage > 0 && (
                        <Badge className="bg-red-500 text-white hover:bg-red-600 shadow-md text-xs font-semibold">
                          -{discountPercentage}%
                        </Badge>
                      )}
                      {product.featured && (
                        <Badge className="bg-red-500 text-white hover:bg-red-600 shadow-md font-semibold text-xs">
                          HOT
                        </Badge>
                      )}
                    </div>

                    {/* Main Product Image */}
                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4">
                      {product.images?.[selectedImage] && (
                        <img
                          src={product.images[selectedImage].src}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Thumbnail Images */}
                    {product.images && product.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {product.images.slice(0, 4).map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={cn(
                              "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                              selectedImage === index ? "border-orange-500" : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <img
                              src={image.src}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details Section */}
                <div className="lg:w-1/2 p-6 flex flex-col">
                  {/* Product Title */}
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h1>

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    {salePrice ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          ${salePrice.toFixed(2)}
                        </span>
                        <span className="text-xl text-gray-400 line-through">
                          ${regularPrice.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">
                        ${price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  {product.categories?.[0] && (
                    <div className="mb-4">
                      <span className="text-sm text-gray-500">Category: </span>
                      <span className="text-sm font-medium text-orange-600">
                        {product.categories[0].name}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  {rating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < Math.floor(rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      {reviewCount > 0 && (
                        <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
                      )}
                    </div>
                  )}

                  {/* Short Description */}
                  {product.short_description && (
                    <div 
                      className="text-gray-600 mb-6 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: product.short_description }}
                    />
                  )}

                  {/* Quantity and Add to Cart */}
                  <div className="flex items-center gap-4 mb-6">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={handleAddToCart}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                    >
                      ADD TO BASKET
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 mb-6">
                    {onAddToWishlist && (
                      <button
                        onClick={handleAddToWishlist}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">Add to Wishlist</span>
                      </button>
                    )}
                  </div>

                  {/* Share Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Share:</span>
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors">
                          <Facebook className="w-4 h-4 text-white" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center transition-colors">
                          <Twitter className="w-4 h-4 text-white" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center transition-colors">
                          <Linkedin className="w-4 h-4 text-white" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors">
                          <Share2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
