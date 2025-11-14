'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, User, Package, Heart, Settings, LogOut, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

interface MyAccountDropdownProps {
  className?: string
}

export function MyAccountDropdown({ className = '' }: MyAccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const menuItems = [
    {
      icon: User,
      label: 'My Profile',
      href: '/my-account',
      description: 'View and edit your profile'
    },
    {
      icon: Package,
      label: 'Orders',
      href: '/my-account/orders',
      description: 'Track your orders'
    },
    {
      icon: Heart,
      label: 'Wishlist',
      href: '/wishlist',
      description: 'Your saved items'
    },
    {
      icon: MapPin,
      label: 'Addresses',
      href: '/my-account/addresses',
      description: 'Manage shipping addresses'
    },
    {
      icon: CreditCard,
      label: 'Payment Methods',
      href: '/my-account/payment-methods',
      description: 'Manage payment options'
    },
    {
      icon: Settings,
      label: 'Account Settings',
      href: '/my-account/settings',
      description: 'Privacy and preferences'
    }
  ]

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        className="flex items-center space-x-2 text-white hover:text-gray-300 hover:bg-transparent p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-sm font-medium">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : 'My Account'}
            </div>
            <div className="text-xs text-gray-300">
              {user?.email}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {user?.first_name ? `${user.first_name} ${user.last_name}` : 'Welcome'}
                    </div>
                    <div className="text-white/70 text-sm">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-500 transition-all duration-200">
                        <Icon className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors duration-200" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-gray-900">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-gray-600">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Logout */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors group rounded-lg"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-all duration-200">
                    <LogOut className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 group-hover:text-red-600">
                      Sign Out
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-red-500">
                      Sign out of your account
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
