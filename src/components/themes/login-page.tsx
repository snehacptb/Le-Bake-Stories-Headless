'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface LoginPageProps {
  className?: string
}

export function LoginPage({ className }: LoginPageProps) {
  const { login, isLoading, error, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/my-account')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await login(formData.email, formData.password)
      // Wait a bit for session to be fully initialized and contexts to update
      setTimeout(() => {
        router.push('/my-account')
        router.refresh() // Refresh to ensure server-side state is updated
      }, 500)
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50', className)}>
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm text-gray-700">
                  Username or email address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-2 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  placeholder=""
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-12 pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder=""
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-semibold text-base shadow-md transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'LOGGING IN...' : 'LOG IN'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-gray-700 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <Link href="/forgot-password" className="text-gray-600 hover:text-orange-500 transition-colors">
                  Lost your password?
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4">
            <div className="text-center text-sm">
              <span className="text-gray-600">No account yet?</span>
              {' '}
              <Link href="/register" className="text-gray-900 font-semibold underline hover:text-orange-500 transition-colors">
                CREATE AN ACCOUNT
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
