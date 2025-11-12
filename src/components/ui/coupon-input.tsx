'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, AlertCircle, Loader2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/contexts/cart-context'
import { cn } from '@/lib/utils'

interface CouponInputProps {
  className?: string
  placeholder?: string
  showValidation?: boolean
  compact?: boolean
  onCouponApplied?: (code: string) => void
  onCouponRemoved?: (code: string) => void
  onError?: (error: string) => void
}

export function CouponInput({
  className,
  placeholder = "Enter coupon code",
  showValidation = true,
  compact = false,
  onCouponApplied,
  onCouponRemoved,
  onError
}: CouponInputProps) {
  const { applyCoupon, removeCoupon, validateCoupon, appliedCoupons, isLoading, loadingStates } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const [validationMessage, setValidationMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  // Real-time validation with debounce
  useEffect(() => {
    if (!showValidation || !couponCode.trim()) {
      setValidationState('idle')
      setValidationMessage('')
      return
    }

    const timeoutId = setTimeout(async () => {
      setValidationState('validating')
      try {
        const result = await validateCoupon(couponCode.trim())
        if (result.valid) {
          setValidationState('valid')
          setValidationMessage('Coupon is valid')
        } else {
          setValidationState('invalid')
          setValidationMessage(result.error || 'Invalid coupon')
        }
      } catch (error) {
        setValidationState('invalid')
        setValidationMessage('Error validating coupon')
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [couponCode, showValidation, validateCoupon])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    // Reset validation state before applying
    setValidationState('idle')
    setValidationMessage('')
    setIsApplying(true)
    
    try {
      await applyCoupon(couponCode.trim())
      setCouponCode('')
      setValidationState('idle')
      setValidationMessage('')
      onCouponApplied?.(couponCode.trim())
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to apply coupon'
      setValidationState('invalid')
      setValidationMessage(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemoveCoupon = async (code: string) => {
    try {
      await removeCoupon(code)
      onCouponRemoved?.(code)
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove coupon'
      onError?.(errorMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleApplyCoupon()
    }
  }

  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getValidationColor = () => {
    switch (validationState) {
      case 'valid':
        return 'text-green-600'
      case 'invalid':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Coupon Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={placeholder}
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value); setValidationState('idle'); setValidationMessage('') }}
              onKeyDown={handleKeyDown}
              disabled={loadingStates.applyingCoupon || isApplying}
              className={cn(
                'pr-8',
                validationState === 'valid' && 'border-green-300 focus:border-green-500',
                validationState === 'invalid' && 'border-red-300 focus:border-red-500'
              )}
              aria-label="Coupon code"
            />
            {showValidation && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {getValidationIcon()}
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim() || loadingStates.applyingCoupon || isApplying}
            size="sm"
            className="flex-shrink-0"
          >
            {loadingStates.applyingCoupon || isApplying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>

        {/* Applied Coupons */}
        <AnimatePresence>
          {appliedCoupons.map((coupon) => (
            <motion.div
              key={coupon.code}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md text-sm"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-green-600" />
                <span className="font-medium text-green-800">{coupon.code}</span>
                <span className="text-green-600">
                  -{coupon.discount_type === 'percent' ? `${coupon.amount}%` : `$${coupon.discount_total.toFixed(2)}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCoupon(coupon.code)}
                disabled={loadingStates.removingCoupon === coupon.code}
                className="text-green-600 hover:text-green-700 h-6 w-6 p-0"
                aria-label={`Remove coupon ${coupon.code}`}
              >
                {loadingStates.removingCoupon === coupon.code ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Coupon Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Coupon Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={placeholder}
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value); setValidationState('idle'); setValidationMessage('') }}
              onKeyDown={handleKeyDown}
              disabled={loadingStates.applyingCoupon || isApplying}
              className={cn(
                'pr-8',
                validationState === 'valid' && 'border-green-300 focus:border-green-500',
                validationState === 'invalid' && 'border-red-300 focus:border-red-500'
              )}
              aria-label="Coupon code"
              aria-describedby={showValidation && validationMessage ? 'coupon-validation' : undefined}
            />
            {showValidation && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {getValidationIcon()}
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim() || loadingStates.applyingCoupon || isApplying}
            className="flex-shrink-0"
          >
            {loadingStates.applyingCoupon || isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Applying...
              </>
            ) : (
              'Apply Coupon'
            )}
          </Button>
        </div>

        {/* Validation Message */}
        {showValidation && validationMessage && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id="coupon-validation"
            className={cn('text-xs mt-1', getValidationColor())}
          >
            {validationMessage}
          </motion.p>
        )}
      </div>

      {/* Applied Coupons Section */}
      {appliedCoupons.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Applied Coupons</h4>
          <div className="space-y-2">
            <AnimatePresence>
              {appliedCoupons.map((coupon) => (
                <motion.div
                  key={coupon.code}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Tag className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">{coupon.code}</p>
                      <p className="text-sm text-green-600">
                        {coupon.discount_type === 'percent' 
                          ? `${coupon.amount}% discount` 
                          : `$${coupon.discount_total.toFixed(2)} discount`
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCoupon(coupon.code)}
                    disabled={loadingStates.removingCoupon === coupon.code}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                    aria-label={`Remove coupon ${coupon.code}`}
                  >
                    {loadingStates.removingCoupon === coupon.code ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
