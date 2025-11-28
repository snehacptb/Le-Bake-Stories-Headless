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

interface RegisterPageProps {
  className?: string
}

export function RegisterPage({ className }: RegisterPageProps) {
  const { register, isLoading, error, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeNewsletter: false,
  })
  const [validationError, setValidationError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/my-account')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    if (!formData.agreeToTerms) {
      setValidationError('You must agree to the Terms of Service and Privacy Policy')
      return
    }
    
    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        username: formData.email,
      })
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
    // Clear validation error when user starts typing
    if (validationError) setValidationError('')
  }

  const handleClose = () => {
    router.back()
  }

  const passwordsMatch = formData.password === formData.confirmPassword || !formData.confirmPassword

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
            <h1 className="text-2xl font-semibold text-gray-900">Create an account</h1>
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
            {(error || validationError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error || validationError}</p>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-sm text-gray-700">
                    First name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="mt-2 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder=""
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name" className="text-sm text-gray-700">
                    Last name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="mt-2 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder=""
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm text-gray-700">
                  Email address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
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

              <div>
                <Label htmlFor="confirmPassword" className="text-sm text-gray-700">
                  Confirm password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={cn(
                      "h-12 pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500",
                      !passwordsMatch && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder=""
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {!passwordsMatch && (
                  <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700 leading-5 cursor-pointer">
                    I agree to the{' '}
                    <Link href="/terms" className="text-orange-500 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-orange-500 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="subscribeNewsletter"
                    name="subscribeNewsletter"
                    type="checkbox"
                    checked={formData.subscribeNewsletter}
                    onChange={(e) => handleInputChange('subscribeNewsletter', e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="subscribeNewsletter" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    Subscribe to our newsletter for updates and special offers
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-semibold text-base shadow-md transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4">
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account?</span>
              {' '}
              <Link href="/login" className="text-gray-900 font-semibold underline hover:text-orange-500 transition-colors">
                SIGN IN
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
