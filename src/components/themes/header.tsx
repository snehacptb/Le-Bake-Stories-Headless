'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  ChevronDown,
  Heart,
  Search,
  Phone,
  Mail,
  Globe,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { useWooCommerceFeatures } from '@/contexts/woocommerce-context'
import { CartDrawer } from './cart-drawer'
import { LoginModal } from './LoginModal'
import { MyAccountDropdown } from './MyAccountDropdown'

interface NavigationItem {
  label: string
  href: string
  children?: NavigationItem[]
}

interface ProductCategory {
  id: number
  name: string
  slug: string
  count: number
  parent: number
  description: string
}

interface HeaderProps {
  navigation?: NavigationItem[]
  menuSlug?: string // Allow specifying which menu to use
  menuLocation?: string // Allow specifying menu by location
  isSticky?: boolean
  showTopBar?: boolean
  logo?: {
    src: string
    alt: string
    width?: number
    height?: number
  },
  contactInfo?: {
    phone?: string
    email?: string
    address?: string
  }
}

const defaultNavigation: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' }
]

export function ThemesHeader({
  navigation,
  menuSlug,
  menuLocation,
  isSticky = true,
  showTopBar = false,
  logo,
  contactInfo = {
    phone: '+1 (555) 123-4567',
    email: 'info@example.com',
    address: '123 Main St, City, State'
  }
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [dynamicNavigation, setDynamicNavigation] = useState<NavigationItem[]>([])
  const [isLoadingNavigation, setIsLoadingNavigation] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [siteInfo, setSiteInfo] = useState<{
    title: string;
    description: string;
    logo: { url: string; width: number; height: number; alt: string } | null;
    siteIcon: { url: string; width: number; height: number; alt: string } | null;
  }>({
    title: '',
    description: '',
    logo: null,
    siteIcon: null
  })
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const router = useRouter()
  
  // Use cart, auth, and wishlist contexts
  const { itemCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const { getWishlistCount } = useWishlist()
  const { shouldShowCart, shouldShowWishlist, shouldShowShop, shouldShowAuth } = useWooCommerceFeatures()
  
  const wishlistCount = getWishlistCount()

  // Helper function to transform WordPress menu URLs to relative paths
  const transformMenuUrl = (url: string): string => {
    if (!url) return '/'
    
    // If it's already a relative URL, return as is (but apply mappings)
    if (!url.startsWith('http')) {
      const path = url.startsWith('/') ? url : `/${url}`
      return mapWordPressPathToFrontend(path)
    }
    
    try {
      const urlObj = new URL(url)
      let path = urlObj.pathname
      
      // Common WordPress URL patterns to transform
      const patterns = [
        // Remove WordPress subdirectory paths
        /\/wordpress\//g,
        /\/wp\//g,
        // Remove common WordPress query parameters
        /\?.*$/g,
        // Remove trailing slashes except for root
        /\/+$/g
      ]
      
      // Apply transformations
      patterns.forEach(pattern => {
        if (pattern.source.includes('\\?')) {
          // Handle query parameter removal
          path = path.replace(pattern, '')
        } else if (pattern.source.includes('wordpress') || pattern.source.includes('wp')) {
          // Handle WordPress subdirectory removal
          path = path.replace(pattern, '/')
        } else {
          // Handle other patterns
          path = path.replace(pattern, '')
        }
      })
      
      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = `/${path}`
      }
      
      // Handle root path
      if (path === '' || path === '//') {
        path = '/'
      }
      
      // Clean up double slashes
      path = path.replace(/\/+/g, '/')
      
      // Apply WordPress to frontend path mappings
      path = mapWordPressPathToFrontend(path)
      
      console.log(`🔗 Transformed menu URL: ${url} → ${path}`)
      return path
    } catch (error) {
      console.warn(`⚠️ Failed to parse menu URL: ${url}`, error)
      return '/'
    }
  }

  // Map WordPress paths to frontend paths
  const mapWordPressPathToFrontend = (path: string): string => {
    // WordPress path to frontend path mappings
    const pathMappings: Record<string, string> = {
      '/about-us': '/about',
      '/about-us/': '/about',
      '/contact-us': '/contact',
      '/contact-us/': '/contact',
    }
    
    // Check for exact match or match with trailing slash
    const normalizedPath = path.replace(/\/+$/, '') || '/'
    return pathMappings[normalizedPath] || pathMappings[path] || path
  }

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const res = await fetch('/api/cache/site-info', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json = await res.json()
        if (json?.data) {
          setSiteInfo(json.data)
        }
      } catch (error) {
        console.error('Error fetching site info:', error)
      }
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/product-categories', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (json?.data) {
            setCategories(json.data)
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchSiteInfo()
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchNavigation = async () => {
      if (navigation) {
        setDynamicNavigation(navigation)
        return
      }

      setIsLoadingNavigation(true)
      try {
        let menu = null
        
        // If a specific menu slug is provided, use it directly
        if (menuSlug) {
          console.log(`Fetching menu by slug: ${menuSlug}`)
          const res = await fetch(`/api/cache/menus?slug=${menuSlug}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            menu = json?.data
          }
        }
        
        // If a specific menu location is provided, use it
        if (!menu && menuLocation) {
          console.log(`Fetching menu by location: ${menuLocation}`)
          const res = await fetch(`/api/cache/menus?location=${menuLocation}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            menu = json?.data
          }
        }
        
        // If no specific menu requested or found, try common locations
        if (!menu || !menu.items || menu.items.length === 0) {
          const locations = ['primary', 'main-menu', 'header-menu', 'main']
          
          for (const location of locations) {
            console.log(`Trying menu location: ${location}`)
            const res = await fetch(`/api/cache/menus?location=${location}`, { cache: 'no-store' })
            if (res.ok) {
              const json = await res.json()
              if (json?.data && json.data.items && json.data.items.length > 0) {
                menu = json.data
                break
              }
            }
          }
        }
        
        // If location-based approach fails, get all menus and use the first one with items
        if (!menu || !menu.items || menu.items.length === 0) {
          console.log('Fetching all menus to find one with items')
          const res = await fetch('/api/cache/menus?withItems=true', { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            const allMenus = json?.data
            if (Array.isArray(allMenus) && allMenus.length > 0) {
              // Find the first menu with items, preferring ones with 'primary', 'main', or 'home' in the name/slug
              menu = allMenus.find(m => 
                m.items && m.items.length > 0 && 
                (m.slug?.includes('primary') || m.slug?.includes('main') || m.slug?.includes('home') || 
                 m.name?.toLowerCase().includes('primary') || m.name?.toLowerCase().includes('main'))
              ) || allMenus.find(m => m.items && m.items.length > 0) // Fallback to first menu with items
              
              if (menu) {
                console.log(`Using menu: ${menu.name} (${menu.slug}) with ${menu.items.length} items`)
              }
            }
          }
        }
        
        if (menu && menu.items && menu.items.length > 0) {
          console.log(`Found menu: ${menu.name} (${menu.slug}) with ${menu.items.length} items`)
          
          // Transform WordPress menu items into NavigationItem format
          const transformedItems = menu.items.map((item: any) => ({
            label: item.title,
            href: transformMenuUrl(item.url),
            // Handle child items (submenus)
            ...(item.children && item.children.length > 0 && {
              children: item.children.map((child: any) => ({
                label: child.title,
                href: transformMenuUrl(child.url),
              }))
            })
          }))
          
          setDynamicNavigation(transformedItems)
        } else {
          // If no menu found, use default navigation
          console.log('No menu with items found, using default navigation')
          setDynamicNavigation(defaultNavigation)
        }
      } catch (error) {
        console.error('Error fetching navigation:', error)
        // Fallback to default navigation if there's an error
        setDynamicNavigation(defaultNavigation)
      }
      setIsLoadingNavigation(false)
    }

    fetchNavigation()
  }, [navigation, menuSlug, menuLocation])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    if (isSticky) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isSticky])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const searchParams = new URLSearchParams()
      searchParams.set('search', searchQuery.trim())
      if (selectedCategory) {
        searchParams.set('category', selectedCategory)
      }
      router.push(`/shop?${searchParams.toString()}`)
    }
  }

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug)
    setIsCategoriesOpen(false)
    const searchParams = new URLSearchParams()
    searchParams.set('category', categorySlug)
    if (searchQuery.trim()) {
      searchParams.set('search', searchQuery.trim())
    }
    router.push(`/shop?${searchParams.toString()}`)
  }

  const handleBrowseCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen)
  }

  return (
    <header className={cn(
      "w-full z-50 transition-all duration-300",
      isSticky && "sticky top-0",
      isScrolled && "shadow-lg backdrop-blur-md bg-slate-900/95"
    )}>
      {/* Top Bar - Dark Navy Style - Hidden on Mobile */}
      <div className="hidden lg:block bg-slate-900 border-b border-slate-700 text-white text-[10px] sm:text-xs">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between py-1.5 sm:py-2">
            {/* Left Side - Language/Country */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
              <div className="flex items-center space-x-1 sm:space-x-2 hover:text-gray-300 transition-colors cursor-pointer">
                <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden lg:inline">ENGLISH</span>
                <span className="lg:hidden">EN</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 hover:text-gray-300 transition-colors cursor-pointer">
                <span className="hidden lg:inline">COUNTRY</span>
                <span className="lg:hidden">US</span>
              </div>
            </div>

            {/* Right Side - Social Links & Account */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 lg:space-x-6 ml-auto">
              <div className="flex items-center space-x-1.5 sm:space-x-3">
                {/* Social Icons */}
                <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                    <span className="text-white text-[10px] sm:text-xs font-bold">f</span>
                  </div>
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-[10px] sm:text-xs font-bold">X</span>
                  </div>
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-pink-500 rounded-sm flex items-center justify-center">
                    <span className="text-white text-[10px] sm:text-xs font-bold">@</span>
                  </div>
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                    <span className="text-white text-[10px] sm:text-xs font-bold">in</span>
                  </div>
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-cyan-400 rounded-sm flex items-center justify-center">
                    <span className="text-white text-[10px] sm:text-xs font-bold">S</span>
                  </div>
                </div>
              </div>
              <span className="hidden sm:inline text-gray-400">|</span>
              <div className="flex items-center space-x-1.5 sm:space-x-3 lg:space-x-4">
                <Link href="/newsletter" className="hover:text-gray-300 transition-colors hidden lg:inline whitespace-nowrap">
                  NEWSLETTER
                </Link>
                <Link href="/contact" className="hover:text-gray-300 transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">CONTACT US</span>
                  <span className="sm:hidden">CONTACT</span>
                </Link>
                <Link href="/faqs" className="hover:text-gray-300 transition-colors whitespace-nowrap">
                  FAQS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header - Dark Navy Style */}
      <div className="bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 sm:px-4">
          <div className="flex items-center justify-between py-3.5 lg:py-6 gap-2">
            {/* Mobile Menu Button - Left */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-1.5 text-white hover:text-gray-300 transition-colors tap-target flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-1 lg:flex-shrink-0 flex justify-center lg:justify-start z-10 min-w-0">
              {(siteInfo.logo || siteInfo.siteIcon || (siteInfo.title && siteInfo.title.trim().length > 0)) ? (
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
                  {siteInfo.logo ? (
                    <Image
                      src={siteInfo.logo.url}
                      alt={siteInfo.logo.alt}
                      width={160}
                      height={50}
                      className="h-8 lg:h-12 w-auto max-w-[140px] sm:max-w-[160px] lg:max-w-none"
                      priority
                    />
                  ) : siteInfo.siteIcon ? (
                    <Image
                      src={siteInfo.siteIcon.url}
                      alt={siteInfo.siteIcon.alt}
                      width={48}
                      height={48}
                      className="h-8 w-8 lg:h-12 lg:w-12 rounded flex-shrink-0"
                      priority
                    />
                  ) : null}
                  {siteInfo.title && siteInfo.title.trim().length > 0 && (
                    <span className="text-sm sm:text-base lg:text-2xl font-bold text-white tracking-tight truncate">{siteInfo.title}</span>
                  )}
                </div>
              ) : (
                logo && logo.src && logo.src.trim() !== '' && (
                  <Image
                    src={logo.src}
                    alt={logo.alt || 'Logo'}
                    width={160}
                    height={50}
                    className="h-8 lg:h-12 w-auto max-w-[140px] sm:max-w-[160px] lg:max-w-none"
                    priority
                  />
                )
              )}
            </Link>
            {/* Search Bar - Desktop Only */}
            <div className="hidden lg:flex flex-1 max-w-lg lg:max-w-2xl mx-2 sm:mx-4 lg:mx-8">
              <div className="relative w-full">
                <form onSubmit={handleSearch} className="flex rounded-full border border-gray-300 bg-white overflow-hidden hover:border-gray-400 transition-colors">
                  <select
                    className="hidden lg:block px-2 lg:px-4 py-2 lg:py-3 bg-white text-xs lg:text-sm text-gray-600 focus:outline-none cursor-pointer border-r border-gray-300 appearance-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">SELECT CATEGORY</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1 relative">
                    <input
                      type="search"
                      placeholder="Search for products"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 lg:py-3 bg-white border-none focus:ring-0 focus:outline-none text-xs lg:text-sm placeholder:text-gray-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 sm:px-4 lg:px-6 py-2 lg:py-3 bg-themes-pink-600 hover:bg-themes-pink-700 text-white transition-colors flex items-center justify-center"
                  >
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 lg:space-x-6 flex-shrink-0">
              {/* Login/Register or My Account - Desktop Only */}
              <div className="hidden xl:flex items-center space-x-4 text-white">
                {isAuthenticated ? (
                  <MyAccountDropdown />
                ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-sm hover:text-gray-300 transition-colors whitespace-nowrap"
                  >
                    LOGIN / REGISTER
                  </button>
                )}
              </div>

              {/* Wishlist - Desktop Only */}
              {shouldShowWishlist() && (
                <Link href="/wishlist" className="hidden lg:flex relative text-white hover:text-gray-300 transition-colors">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                      {wishlistCount}
                    </Badge>
                  )}
                </Link>
              )}

              {/* Cart - Mobile and Desktop */}
              {shouldShowCart() && (
                <Button
                  variant="ghost"
                  className="relative p-1.5 lg:p-0 hover:bg-transparent flex-shrink-0"
                  onClick={() => setIsCartOpen(true)}
                >
                  <div className="flex items-center space-x-1 lg:space-x-2 text-white hover:text-gray-300 transition-colors">
                    <div className="relative">
                      <ShoppingCart className="h-6 w-6 lg:h-5 lg:w-5" />
                      {itemCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-semibold bg-red-500 text-white border-2 border-slate-900">
                          {itemCount}
                        </Badge>
                      )}
                    </div>
                    <span className="hidden lg:inline text-sm font-medium">$0.00</span>
                  </div>
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Navigation Bar - White Background Style */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 lg:py-3">
            {/* Browse Categories Button - Desktop Only */}
            <div className="hidden lg:flex items-center relative">
              <Button 
                variant="ghost" 
                className="text-gray-800 hover:text-slate-900 hover:bg-transparent p-0 flex items-center space-x-2"
                onClick={handleBrowseCategories}
              >
                <Menu className="h-4 w-4" />
                <span className="text-sm font-medium uppercase tracking-wide">BROWSE CATEGORIES</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isCategoriesOpen && "rotate-180")} />
              </Button>
              
              {/* Categories Dropdown */}
              <AnimatePresence>
                {isCategoriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white shadow-2xl border border-gray-100 rounded-lg z-50"
                  >
                    <div className="py-2">
                      <Link
                        href="/shop"
                        className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        All Categories
                      </Link>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category.slug)}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          {category.name} ({category.count})
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Desktop Navigation - Left Aligned */}
            <nav className="hidden lg:flex items-center flex-1 ml-8">
              <div className="flex items-center space-x-6 xl:space-x-8">
                {(navigation || dynamicNavigation).map((item) => (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className="flex items-center space-x-1 py-3 text-gray-800 hover:text-slate-900 font-medium transition-colors text-sm relative uppercase tracking-wide"
                    >
                      <span>{item.label}</span>
                      {item.children && <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />}
                    </Link>
                    
                    {/* Dropdown Menu */}
                    {item.children && (
                      <div className="absolute top-full left-0 mt-0 w-64 bg-white shadow-2xl border border-gray-100 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                        <div className="py-4">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-6 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors relative"
                            >
                              <span className="relative z-10">{child.label}</span>
                              <div className="absolute left-0 top-0 w-1 h-full bg-gray-900 scale-y-0 transition-transform hover:scale-y-100"></div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Mobile Search Bar - Full Width */}
            <div className="flex lg:hidden items-center w-full">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search for products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-12 py-2.5 text-sm rounded-lg bg-white border-gray-300 w-full focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <button 
                  type="submit" 
                  className="absolute right-0 top-0 h-full px-4 bg-purple-900 hover:bg-purple-800 text-white rounded-r-lg transition-colors flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>


      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="bg-white h-full w-full max-w-sm shadow-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-2">
                    {/* Site Icon (favicon) - smaller, used as fallback or alongside logo */}
                    {siteInfo.siteIcon && !siteInfo.logo && (
                      <Image
                        src={siteInfo.siteIcon.url}
                        alt={siteInfo.siteIcon.alt}
                        width={24}
                        height={24}
                        className="h-5 w-5 sm:h-6 sm:w-6 rounded"
                      />
                    )}
                    {/* Main Logo */}
                    {siteInfo.logo ? (
                      <Image
                        src={siteInfo.logo.url}
                        alt={siteInfo.logo.alt}
                        width={siteInfo.logo.width}
                        height={siteInfo.logo.height}
                        className="h-7 sm:h-8 w-auto"
                      />
                    ) : logo?.src && logo?.src.trim() !== '' ? (
                      <Image
                        src={logo?.src || ''}
                        alt={logo?.alt || 'Logo'}
                        width={logo?.width || 120}
                        height={logo?.height || 40}
                        className="h-7 sm:h-8 w-auto"
                      />
                    ) : null}
                    {/* Site Title */}
                    {siteInfo.title && siteInfo.title.trim().length > 0 && (
                      <span className="text-base sm:text-lg font-semibold text-gray-900">{siteInfo.title}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                    className="h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>

                <nav className="space-y-1 sm:space-y-2">
                  {dynamicNavigation.map((item) => (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        className="block py-2.5 sm:py-3 px-3 sm:px-2 text-sm sm:text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors uppercase tracking-wide"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                      {item.children && (
                        <div className="ml-3 sm:ml-4 mt-1 space-y-0.5 sm:space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block py-2 px-3 sm:px-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    {/* Show different options based on auth state */}
                    {isAuthenticated ? (
                      <>
                        <Link
                          href="/my-account"
                          className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          href="/my-account/orders"
                          className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        <button
                          onClick={() => {
                            logout()
                            setIsMenuOpen(false)
                          }}
                          className="block py-2 text-gray-700 hover:text-red-600 transition-colors w-full text-left"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setIsLoginModalOpen(true)
                          setIsMenuOpen(false)
                        }}
                        className="block py-2 text-gray-700 hover:text-blue-600 transition-colors w-full text-left"
                      >
                        Login / Register
                      </button>
                    )}
                    
                    {/* WooCommerce-specific links - only show when available */}
                    {shouldShowWishlist() && (
                      <Link
                        href="/wishlist"
                        className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Wishlist
                      </Link>
                    )}
                    
                    {shouldShowShop() && (
                      <Link
                        href="/compare"
                        className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Compare
                      </Link>
                    )}
                    
                    <Link
                      href="/contact"
                      className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Contact
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer - Only render if WooCommerce is available */}
      {shouldShowCart() && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </header>
  )
}
