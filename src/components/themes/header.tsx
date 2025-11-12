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

interface NavigationItem {
  label: string
  href: string
  children?: NavigationItem[]
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
  }
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
  logo = {
    src: '',
    alt: 'Logo',
    width: 120,
    height: 40
  },
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
    
    // If it's already a relative URL, return as is
    if (!url.startsWith('http')) {
      return url.startsWith('/') ? url : `/${url}`
    }
    
    try {
      const urlObj = new URL(url)
      
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
      
      let path = urlObj.pathname
      
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
      
      console.log(`🔗 Transformed menu URL: ${url} → ${path}`)
      return path
    } catch (error) {
      console.warn(`⚠️ Failed to parse menu URL: ${url}`, error)
      return '/'
    }
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

    fetchSiteInfo()
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


  return (
    <header className={cn(
      "w-full z-50 transition-all duration-300",
      isSticky && "sticky top-0",
      isScrolled && "shadow-lg backdrop-blur-md bg-white/95"
    )}>
      {/* Top Bar - Manila Style */}
      <div className="bg-gray-900 text-white text-xs">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            {/* Left Side - Contact Info */}
            <div className="hidden md:flex items-center space-x-6">
              {contactInfo.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>{contactInfo.phone}</span>
                </div>
              )}
              {contactInfo.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>{contactInfo.email}</span>
                </div>
              )}
            </div>
            
            {/* Right Side - Account Links */}
            <div className="flex items-center space-x-4 text-xs">
              {shouldShowAuth() && (
                <Link href="/my-account" className="hover:text-gray-300 transition-colors">
                  My Account
                </Link>
              )}
              {shouldShowWishlist() && (
                <Link href="/wishlist" className="hover:text-gray-300 transition-colors">
                  Wishlist
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header - Manila Style */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              {(siteInfo.logo || siteInfo.siteIcon || (siteInfo.title && siteInfo.title.trim().length > 0)) ? (
                <div className="flex items-center gap-3">
                  {siteInfo.logo ? (
                    <Image
                      src={siteInfo.logo.url}
                      alt={siteInfo.logo.alt}
                      width={140}
                      height={45}
                      className="h-11 w-auto"
                      priority
                    />
                  ) : siteInfo.siteIcon ? (
                    <Image
                      src={siteInfo.siteIcon.url}
                      alt={siteInfo.siteIcon.alt}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded"
                      priority
                    />
                  ) : null}
                  {siteInfo.title && siteInfo.title.trim().length > 0 && (
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">{siteInfo.title}</span>
                  )}
                </div>
              ) : (
                logo?.src && (
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={140}
                    height={45}
                    className="h-11 w-auto"
                    priority
                  />
                )
              )}
            </Link>

            {/* Search Bar - Manila Style */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <div className="flex">
                  <select className="px-4 py-2 border border-r-0 border-gray-300 bg-gray-50 text-sm rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>All Categories</option>
                    {/* Add dynamic categories here */}
                  </select>
                  <div className="relative flex-1">
                    <Input
                      type="search"
                      placeholder="Search for products..."
                      className="pl-4 pr-12 py-2 border-l-0 border-r-0 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      size="sm"
                      className="absolute right-0 top-0 h-full px-4 rounded-l-none bg-blue-600 hover:bg-blue-700"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Navigation Bar - Manila Style */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {(navigation || dynamicNavigation).map((item) => (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className="flex items-center space-x-1 py-4 text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm uppercase tracking-wide"
                  >
                    <span>{item.label}</span>
                    {item.children && <ChevronDown className="h-3 w-3 ml-1" />}
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {item.children && (
                    <div className="absolute top-full left-0 mt-0 w-56 bg-white shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="py-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Search */}
            <div className="flex lg:hidden flex-1 mx-4">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-4 pr-10 py-2 text-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Header Actions - Manila Style */}
            <div className="flex items-center space-x-4">
              {/* Account */}
              {shouldShowAuth() && (
                <Link href="/my-account" className="hidden md:flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <User className="h-4 w-4" />
                  <span>{isAuthenticated ? 'My Account' : 'Login / Register'}</span>
                </Link>
              )}

              {/* Wishlist - Only show if WooCommerce is available */}
              {shouldShowWishlist() && (
                <Link href="/wishlist" className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <div className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {wishlistCount}
                      </Badge>
                    )}
                  </div>
                  <span className="hidden md:inline">Wishlist</span>
                </Link>
              )}

              {/* Compare - Only show if WooCommerce is available */}
              {shouldShowShop() && (
                <Link href="/compare" className="hidden md:flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  <span>Compare</span>
                </Link>
              )}

              {/* Cart - Only show if WooCommerce is available */}
              {shouldShowCart() && (
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors p-2"
                  onClick={() => setIsCartOpen(true)}
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {itemCount}
                      </Badge>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <span className="font-semibold">Cart</span>
                  </div>
                </Button>
              )}

              {/* User Menu - Only show if authenticated or if auth is available (ecommerce site) */}
              {(isAuthenticated || shouldShowAuth()) && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-themes-gray-600 hover:text-themes-blue-600"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <User className="h-5 w-5" />
                  </Button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      >
                        {isAuthenticated ? (
                          <>
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-900">
                                {user?.first_name} {user?.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <Link
                              href="/my-account"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              My Account
                            </Link>
                            <Link
                              href="/my-account?tab=orders"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              Orders
                            </Link>
                            <Link
                              href="/my-account?tab=wishlist"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              Wishlist
                            </Link>
                            <button
                              onClick={() => {
                                logout()
                                setIsUserMenuOpen(false)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Logout
                            </button>
                          </>
                        ) : (
                          <>
                            {shouldShowAuth() && (
                              <>
                                <Link
                                  href="/login"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  Login
                                </Link>
                                <Link
                                  href="/register"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  Register
                                </Link>
                              </>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
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
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    {/* Site Icon (favicon) - smaller, used as fallback or alongside logo */}
                    {siteInfo.siteIcon && !siteInfo.logo && (
                      <Image
                        src={siteInfo.siteIcon.url}
                        alt={siteInfo.siteIcon.alt}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded"
                      />
                    )}
                    {/* Main Logo */}
                    {siteInfo.logo ? (
                      <Image
                        src={siteInfo.logo.url}
                        alt={siteInfo.logo.alt}
                        width={siteInfo.logo.width}
                        height={siteInfo.logo.height}
                        className="h-8 w-auto"
                      />
                    ) : logo?.src ? (
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={logo.width}
                        height={logo.height}
                        className="h-8 w-auto"
                      />
                    ) : null}
                    {/* Site Title */}
                    {siteInfo.title && siteInfo.title.trim().length > 0 && (
                      <span className="text-lg font-semibold text-gray-900">{siteInfo.title}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav className="space-y-2">
                  {dynamicNavigation.map((item) => (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        className="block py-3 px-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors uppercase tracking-wide"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                      {item.children && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block py-2 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
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
                    {/* Always show account link */}
                    <Link
                      href="/my-account"
                      className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    
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
    </header>
  )
}
