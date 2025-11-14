"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: any[]; // Add categories prop
  topRatedProducts?: any[]; // Make optional
  filters: any;
  onFilterChange: (key: string, value: any) => void;
  products: any[];
  className?: string;
}

export const PremiumSidebar = ({
  isOpen,
  onClose,
  categories,
  topRatedProducts: propTopRatedProducts,
  filters,
  onFilterChange,
  products,
  className,
}: PremiumSidebarProps) => {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [topRatedProducts, setTopRatedProducts] = useState<any[]>(propTopRatedProducts || []);
  const [isLoadingTopRated, setIsLoadingTopRated] = useState(false);

  // Fetch top-rated products
  useEffect(() => {
    const fetchTopRatedProducts = async () => {
      // If topRatedProducts are provided via props, use them
      if (propTopRatedProducts && propTopRatedProducts.length > 0) {
        setTopRatedProducts(propTopRatedProducts);
        return;
      }

      setIsLoadingTopRated(true);
      try {
        const response = await fetch('/api/products/top-rated?limit=3');
        const data = await response.json();

        if (data.success && data.data) {
          setTopRatedProducts(data.data);
        } else {
          console.warn('Failed to fetch top-rated products:', data.error);
        }
      } catch (error) {
        console.error('Error fetching top-rated products:', error);
      } finally {
        setIsLoadingTopRated(false);
      }
    };

    fetchTopRatedProducts();
  }, [propTopRatedProducts]);

  // Calculate dynamic price range from products
  useEffect(() => {
    if (products && products.length > 0) {
      const prices = products
        .map((p: any) => parseFloat(p.price || '0'))
        .filter((price: number) => price > 0);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange({
          min: Math.floor(minPrice),
          max: Math.ceil(maxPrice)
        });
      }
    }
  }, [products]);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "w-[275px] h-fit",
          // Desktop sidebar - static positioned, always visible
          !className?.includes('lg:hidden') && "sticky top-6 block",
          // Mobile sidebar - fixed overlay
          className?.includes('lg:hidden') && [
            "fixed inset-y-0 left-0 z-50 lg:hidden",
            isOpen ? "block" : "hidden"
          ],
          className
        )}
        style={{
          transform: className?.includes('lg:hidden') && !isOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        <div className="widget-area space-y-0 bg-white lg:bg-transparent p-4 lg:p-0">
          {/* Mobile Close Button */}
          <div className="flex justify-between items-center lg:hidden mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Filters
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 1. Filter by Price Widget */}
          <div className="wd-widget widget sidebar-widget woocommerce widget_price_filter bg-white border-0 mb-8 pb-8 border-b border-gray-200">
            <h5 className="widget-title text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">
              Filter by price
            </h5>
            <form className="price-filter-form">
              <div className="price_slider_wrapper">
                {/* Price Range Slider */}
                <div className="price_slider ui-slider ui-corner-all ui-slider-horizontal ui-widget ui-widget-content relative mb-4 h-5">
                  {/* Background track */}
                  <div className="absolute w-full h-0.5 bg-gray-300 rounded top-1/2 transform -translate-y-1/2"></div>
                  
                  {/* Active range */}
                  <div 
                    className="ui-slider-range ui-corner-all ui-widget-header absolute h-0.5 bg-gray-800 rounded top-1/2 transform -translate-y-1/2"
                    style={{
                      left: `${((filters.minPrice || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                      right: `${100 - ((filters.maxPrice || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                      zIndex: 1
                    }}
                  />
                  
                  {/* Min price slider handle */}
                  <span 
                    className="ui-slider-handle ui-corner-all ui-state-default absolute w-7.5 h-7.5 bg-white border-2 border-gray-300 rounded-full cursor-pointer top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-sm hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                    style={{
                      left: `${((filters.minPrice || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                      zIndex: 3
                    }}
                  />
                  
                  {/* Max price slider handle */}
                  <span 
                    className="ui-slider-handle ui-corner-all ui-state-default absolute w-7.5 h-7.5 bg-white border-2 border-gray-300 rounded-full cursor-pointer top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-sm hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                    style={{
                      left: `${((filters.maxPrice || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                      zIndex: 3
                    }}
                  />
                  
                  {/* Hidden range inputs */}
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step="10"
                    value={filters.minPrice || priceRange.min}
                    onChange={(e) => onFilterChange('minPrice', parseInt(e.target.value))}
                    className="absolute w-full h-5 bg-transparent appearance-none cursor-pointer opacity-0 top-0"
                    style={{ zIndex: 2 }}
                  />
                  
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step="10"
                    value={filters.maxPrice || priceRange.max}
                    onChange={(e) => onFilterChange('maxPrice', parseInt(e.target.value))}
                    className="absolute w-full h-5 bg-transparent appearance-none cursor-pointer opacity-0 top-0"
                    style={{ zIndex: 2 }}
                  />
                </div>
                
                {/* Price Display and Filter Button */}
                <div className="price_slider_amount flex items-center justify-between">
                  <div className="price_label text-sm text-gray-600">
                    <span className="from">${(filters.minPrice || priceRange.min).toLocaleString()}</span>
                    <span className="mx-1">—</span>
                    <span className="to">${(filters.maxPrice || priceRange.max).toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange('minPrice', filters.minPrice || priceRange.min);
                      onFilterChange('maxPrice', filters.maxPrice || priceRange.max);
                    }}
                    className="button bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium rounded transition-colors"
                  >
                    Filter
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* 2. Stock Status Widget */}
          <div className="wd-widget widget sidebar-widget wd-widget-stock-status bg-white border-0 mb-8 pb-8 border-b border-gray-200">
            <h5 className="widget-title text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">
              Stock status
            </h5>
            <ul className="wd-checkboxes-on space-y-3">
              <li>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onFilterChange('onSale', !filters.onSale);
                  }}
                  className={cn(
                    "text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center",
                    filters.onSale && "text-orange-600 font-medium"
                  )}
                >
                  On sale
                </a>
              </li>
              <li>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onFilterChange('inStock', !filters.inStock);
                  }}
                  className={cn(
                    "text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center",
                    filters.inStock && "text-green-600 font-medium"
                  )}
                >
                  In stock
                </a>
              </li>
            </ul>
          </div>

          {/* 3. Top Rated Products Widget */}
          <div className="wd-widget widget sidebar-widget woocommerce widget_top_rated_products bg-white border-0">
            <h5 className="widget-title text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">
              Top rated products
            </h5>

            {isLoadingTopRated ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topRatedProducts.length > 0 ? (
              <ul className="product_list_widget space-y-4">
                {topRatedProducts.slice(0, 3).map((product) => (
                  <li key={product.id}>
                    <span className="widget-product-wrap flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                      <a
                        className="widget-product-img flex-shrink-0"
                        href={`/product/${product.slug}`}
                        title={product.name}
                      >
                        <img
                          className="attachment-woocommerce_thumbnail size-woocommerce_thumbnail w-16 h-16 object-cover rounded"
                          src={product.images?.[0]?.src || '/placeholder-product.jpg'}
                          alt={product.name}
                        />
                      </a>
                      <span className="widget-product-info flex-1 min-w-0">
                        <a
                          className="wd-entities-title text-sm font-medium text-gray-900 hover:text-gray-700 line-clamp-2 mb-1 block"
                          href={`/product/${product.slug}`}
                          title={product.name}
                        >
                          {product.name}
                        </a>

                        {/* Star Rating */}
                        {product.average_rating && parseFloat(product.average_rating) > 0 && (
                          <div className="flex items-center gap-1 mb-1">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={cn(
                                  "h-3 w-3",
                                  index < Math.floor(parseFloat(product.average_rating))
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                              ({product.rating_count || 0})
                            </span>
                          </div>
                        )}

                        <span className="price">
                          <span className="woocommerce-Price-amount amount text-sm font-semibold text-gray-900">
                            <bdi>
                              <span className="woocommerce-Price-currencySymbol">$</span>
                              {parseFloat(product.price).toLocaleString()}
                            </bdi>
                          </span>
                        </span>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No top-rated products available</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
