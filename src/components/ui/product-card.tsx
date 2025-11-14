"use client";
import React from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WooCommerceProduct } from "@/types";

interface PremiumProductCardProps {
  product: WooCommerceProduct;
  onAddToCart: (product: WooCommerceProduct) => void;
  onQuickView: (product: WooCommerceProduct) => void;
  onAddToWishlist?: (product: WooCommerceProduct) => void;
  variant?: 'default' | 'compact';
  priority?: boolean;
  className?: string;
}

export const PremiumProductCard = ({
  product,
  onAddToCart,
  onQuickView,
  onAddToWishlist,
  variant = 'default',
  priority = false,
  className,
}: PremiumProductCardProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const price = parseFloat(product.price);
  const regularPrice = parseFloat(product.regular_price || product.price);
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const discountPercentage = salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  const rating = parseFloat(product.average_rating || '0');
  const reviewCount = parseInt(product.rating_count?.toString() || '0');

  // List view layout (horizontal)
  if (variant === 'compact') {
    return (
      <div
        className={cn("group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container - Left Side */}
        <div className="relative overflow-hidden bg-white w-64 flex-shrink-0">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
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

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
              transition={{ duration: 0.2 }}
            >
              {onAddToWishlist && (
                <button
                  className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-md transition-colors"
                  onClick={() => onAddToWishlist(product)}
                  aria-label="Add to wishlist"
                >
                  <Heart className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <button
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-md transition-colors"
                onClick={() => onQuickView(product)}
                aria-label="Quick view"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            </motion.div>
          </div>

          {/* Product Image */}
          <div className="aspect-square relative overflow-hidden bg-gray-50">
            {product.images?.[0] && (
              <>
                <img
                  src={product.images[0].src}
                  alt={product.name}
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-300",
                    "group-hover:scale-105",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  loading={priority ? "eager" : "lazy"}
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Product Info - Right Side */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          {/* Category */}
          {product.categories?.[0] && (
            <p className="text-sm text-gray-500 mb-2">
              {product.categories[0].name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 mb-3 text-lg hover:text-gray-700 transition-colors">
            <a href={`/product/${product.slug}`}>{product.name}</a>
          </h3>

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
                <span className="text-sm text-gray-500">({reviewCount})</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            {salePrice ? (
              <>
                <span className="text-xl font-semibold text-gray-900">
                  ${salePrice.toFixed(2)}
                </span>
                <span className="text-base text-gray-400 line-through">
                  ${regularPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-xl font-semibold text-gray-900">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 shadow-md w-fit"
          >
            <ShoppingCart className="w-4 h-4" />
            ADD TO BASKET
          </button>
        </div>
      </div>
    );
  }

  // Grid view layout (card format) - Default
  return (
    <div
      className={cn("group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-white">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
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

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
            transition={{ duration: 0.2 }}
          >
            {onAddToWishlist && (
              <button
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-md transition-colors"
                onClick={() => onAddToWishlist(product)}
                aria-label="Add to wishlist"
              >
                <Heart className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <button
              className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-md transition-colors"
              onClick={() => onQuickView(product)}
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
          </motion.div>
        </div>

        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-gray-50">
          {product.images?.[0] && (
            <>
              <img
                src={product.images[0].src}
                alt={product.name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-300",
                  "group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading={priority ? "eager" : "lazy"}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              )}
            </>
          )}

          {/* Overlay with Add to Cart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 bottom-0 p-3"
          >
            <button
              onClick={() => onAddToCart(product)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
              ADD TO BASKET
            </button>
          </motion.div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        {product.categories?.[0] && (
          <p className="text-xs text-gray-500 mb-1.5">
            {product.categories[0].name}
          </p>
        )}

        {/* Product Name */}
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm hover:text-gray-700 transition-colors">
          <a href={`/product/${product.slug}`}>{product.name}</a>
        </h3>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3.5 h-3.5',
                    i < Math.floor(rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-gray-500">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          {salePrice ? (
            <>
              <span className="text-base font-semibold text-gray-900">
                ${salePrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                ${regularPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-base font-semibold text-gray-900">
              ${price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
