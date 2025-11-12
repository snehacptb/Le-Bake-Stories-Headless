'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Shield,
  Truck,
  RotateCcw,
  Headphones,
  Wallet,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface SocialLink {
  platform: string
  href: string
  icon: React.ReactNode
}

interface FooterProps {
  logo?: {
    src: string
    alt: string
    width?: number
    height?: number
  }
  companyInfo?: {
    name: string
    description: string
    address: string
    phone: string
    email: string
  }
  sections?: FooterSection[]
  socialLinks?: SocialLink[]
  showNewsletter?: boolean
  showTrustBadges?: boolean
  copyrightText?: string
  className?: string
}


export function ThemesFooter({
  logo = {
    src: '',
    alt: 'Logo',
    width: 120,
    height: 40
  },
  companyInfo = {
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  },
  sections = [],
  socialLinks = [],
  showNewsletter = true,
  showTrustBadges = true,
  copyrightText,
  className
}: FooterProps) {
  const [email, setEmail] = React.useState('')
  const [isSubscribing, setIsSubscribing] = React.useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubscribing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubscribing(false)
    setEmail('')
    // Show success message (you can implement toast notification here)
  }

  const currentYear = new Date().getFullYear()
  const defaultCopyright = `© ${currentYear} ${companyInfo.name}. All rights reserved.`

  return (
    <footer className={cn("bg-purple-900 text-white", className)}>
      {/* Trust Badges */}
      {showTrustBadges && (
        <div className="border-b border-purple-800">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center space-x-3 p-3 md:p-0"
              >
                <div className="bg-orange-500 p-2.5 md:p-3 rounded-lg flex-shrink-0">
                  <Truck className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm md:text-base text-orange-400">Free Shipping.</h4>
                  <p className="text-xs md:text-sm text-gray-300">Free shipping on all.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-3 p-3 md:p-0"
              >
                <div className="bg-orange-500 p-2.5 md:p-3 rounded-lg flex-shrink-0">
                  <Headphones className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm md:text-base text-orange-400">24/7 Support.</h4>
                  <p className="text-xs md:text-sm text-gray-300">Full day support.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-3 p-3 md:p-0"
              >
                <div className="bg-orange-500 p-2.5 md:p-3 rounded-lg flex-shrink-0">
                  <Wallet className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm md:text-base text-orange-400">Online Payment.</h4>
                  <p className="text-xs md:text-sm text-gray-300">Secure online payments.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-3 p-3 md:p-0"
              >
                <div className="bg-orange-500 p-2.5 md:p-3 rounded-lg flex-shrink-0">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm md:text-base text-orange-400">Fast Delivery.</h4>
                  <p className="text-xs md:text-sm text-gray-300">Fast delivery.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {/* Our Stores - Column 1 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-white mb-4 text-sm uppercase">OUR STORES</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">New York</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">London</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Brooklyn</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Los Angeles</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Chicago</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Las Vegas</Link></li>
              </ul>
            </motion.div>
          </div>

          {/* Useful Links - Column 2 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-semibold text-white mb-4 text-sm uppercase">USEFUL LINKS</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Returns</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Terms & Conditions</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Contact Us</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Latest News</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Our Sitemap</Link></li>
              </ul>
            </motion.div>
          </div>

          {/* Our Stores - Column 3 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-semibold text-white mb-4 text-sm uppercase">OUR STORES</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">New York</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">London SF</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Brooklyn</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Los Angeles</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Chicago</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Las Vegas</Link></li>
              </ul>
            </motion.div>
          </div>

          {/* Useful Links - Column 4 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-semibold text-white mb-4 text-sm uppercase">USEFUL LINKS</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Returns</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Terms & Conditions</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Contact Us</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Latest News</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">Our Sitemap</Link></li>
              </ul>
            </motion.div>
          </div>

          {/* Available On - Column 5 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="font-semibold text-white mb-4 text-sm uppercase">AVAILABLE ON:</h3>
              <div className="space-y-3 mb-6">
                <Link href="/" className="block" aria-label="Download our app from the App Store">
                  <div className="bg-black rounded-lg p-2 flex items-center space-x-2 hover:bg-gray-800 transition-colors">
                    <div className="text-white text-xs">
                      <div className="text-[10px] leading-none">Download on the</div>
                      <div className="font-semibold text-sm">App Store</div>
                    </div>
                  </div>
                </Link>
                <Link href="/" className="block" aria-label="Get our app on Google Play">
                  <div className="bg-black rounded-lg p-2 flex items-center space-x-2 hover:bg-gray-800 transition-colors">
                    <div className="text-white text-xs">
                      <div className="text-[10px] leading-none">Get it on</div>
                      <div className="font-semibold text-sm">Google Play</div>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="text-xs text-gray-300 mb-3">Join our newsletter!</div>
              <div className="text-xs text-gray-300">Will be used in accordance with our privacy policy.</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment, Shipping & Social Section */}
      <div className="border-t border-purple-800">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Payment System */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Payment System:</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="Visa payment accepted">VISA</div>
                <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="Mastercard payment accepted">MC</div>
                <div className="bg-blue-400 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="PayPal payment accepted">PayPal</div>
                <div className="bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="American Express payment accepted">AMEX</div>
                <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="Discover payment accepted">Discover</div>
                <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="Apple Pay payment accepted">Apple Pay</div>
              </div>
            </div>

            {/* Shipping System */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Shipping System:</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="DHL shipping available">DHL</div>
                <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="UPS shipping available">UPS</div>
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="FedEx shipping available">FedEx</div>
                <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="TNT shipping available">TNT</div>
                <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="Canada Post shipping available">Canada Post</div>
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold" aria-label="USPS shipping available">USPS</div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Our Social Links:</h4>
              <div className="flex items-center gap-2">
                <Link href="/" className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors" aria-label="Follow us on Facebook">
                  <Facebook className="h-4 w-4 text-white" />
                </Link>
                <Link href="/" className="bg-black p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Follow us on Twitter">
                  <Twitter className="h-4 w-4 text-white" />
                </Link>
                <Link href="/" className="bg-pink-600 p-2 rounded-full hover:bg-pink-700 transition-colors" aria-label="Follow us on Instagram">
                  <Instagram className="h-4 w-4 text-white" />
                </Link>
                <Link href="/" className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors" aria-label="Subscribe to our YouTube channel">
                  <Youtube className="h-4 w-4 text-white" />
                </Link>
                <Link href="/" className="bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors" aria-label="Follow us on Pinterest">
                  <div className="h-4 w-4 bg-white rounded-full"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-purple-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <p className="text-gray-400 text-xs text-center md:text-left">
              Copyright © 2024 HongKong Store
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Powered by</span>
              <span className="text-orange-400 font-semibold">ECOM STORE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
