'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Lock, MapPin, Mail, Phone, Building, Loader2, Frown, ShoppingBag, ArrowRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { CouponInput } from '@/components/ui/coupon-input'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import { useWooCommerce } from '@/contexts/woocommerce-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { CustomerAddress } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { StripePaymentForm } from '@/components/StripePaymentForm'
import { PayPalPaymentForm } from '@/components/PayPalPaymentForm'

interface CheckoutPageProps {
  className?: string
}

interface CheckoutForm {
  billing: CustomerAddress
  shipping: CustomerAddress
  sameAsShipping: boolean
  paymentMethod: string
  customerNote: string
  createAccount: boolean
  accountPassword: string
  agreeToTerms: boolean
}

export function CheckoutPage({ className }: CheckoutPageProps) {
  const { 
    items, 
    total, 
    subtotal, 
    discountTotal, 
    taxTotal, 
    shippingTotal, 
    appliedCoupons,
    clearCart, 
    cartToken,
    isHydrated,
    refreshCart,
    error: cartError,
    itemCount,
    addToCart
  } = useCart()
  const { user, isAuthenticated } = useAuth()
  const { isAvailable: isWooCommerceAvailable, isLoading: isWooCommerceLoading } = useWooCommerce()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [countries, setCountries] = useState<{[key: string]: string}>({})
  const [countriesData, setCountriesData] = useState<{ [code: string]: { name: string, states: { [code: string]: string } } }>({})
  const [billingStates, setBillingStates] = useState<{ [key: string]: string }>({})
  const [shippingStates, setShippingStates] = useState<{ [key: string]: string }>({})
  const [loadingStates, setLoadingStates] = useState({
    countries: false,
    billingStates: false,
    shippingStates: false,
    paymentMethods: false,
    shippingMethods: false
  })
  
  // Stripe payment state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [showStripeForm, setShowStripeForm] = useState(false)

  // PayPal payment state
  const [showPayPalForm, setShowPayPalForm] = useState(false)

  // Empty cart state - new products
  const [newProducts, setNewProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [addingToCart, setAddingToCart] = useState<Set<number>>(new Set())

  const [form, setForm] = useState<CheckoutForm>(() => ({
    billing: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      company: user?.billing?.company || '',
      address_1: user?.billing?.address_1 || '',
      address_2: user?.billing?.address_2 || '',
      city: user?.billing?.city || '',
      state: user?.billing?.state || 'KL', // Default to Kerala
      postcode: user?.billing?.postcode || '',
      country: user?.billing?.country || 'IN', // Default to India
      email: user?.email || '',
      phone: user?.billing?.phone || '',
    },
    shipping: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      company: user?.shipping?.company || '',
      address_1: user?.shipping?.address_1 || '',
      address_2: user?.shipping?.address_2 || '',
      city: user?.shipping?.city || '',
      state: user?.shipping?.state || 'KL', // Default to Kerala
      postcode: user?.shipping?.postcode || '',
      country: user?.shipping?.country || 'IN', // Default to India
    },
    sameAsShipping: true,
    paymentMethod: '',
    customerNote: '',
    createAccount: !isAuthenticated,
    accountPassword: '',
    agreeToTerms: false,
  }))

  // Fetch new products when cart is empty
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      fetchNewProducts()
    }
  }, [isHydrated, items.length])

  const fetchNewProducts = async () => {
    setLoadingProducts(true)
    try {
      const products = await woocommerceApi.getProducts({
        per_page: 4,
        orderby: 'date',
        order: 'desc',
        status: 'publish'
      })
      setNewProducts(products)
    } catch (error) {
      console.error('Failed to fetch new products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchStates = (section: 'billing' | 'shipping', countryCode: string) => {
    if (!countryCode) return
    const upper = String(countryCode).toUpperCase()
    const states = countriesData[upper]?.states || {}
    if (section === 'billing') {
      setBillingStates(states)
      setForm(prev => ({
        ...prev,
        billing: {
          ...prev.billing,
          state: states[prev.billing.state] ? prev.billing.state : ''
        }
      }))
    } else {
      setShippingStates(states)
      setForm(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          state: states[prev.shipping.state] ? prev.shipping.state : ''
        }
      }))
    }
  }

  const handleAddToCart = async (product: any) => {
    setAddingToCart(prev => new Set(prev).add(product.id))
    try {
      await addToCart(product, 1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }
  }

  const handleToggleWishlist = (product: any) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  useEffect(() => {
    // Wait for WooCommerce to be available before loading data
    if (isWooCommerceLoading) {
      console.log('⏳ Waiting for WooCommerce status check...')
      return
    }

    if (!isWooCommerceAvailable) {
      console.warn('⚠️ WooCommerce is not available, skipping checkout data load')
      setError('WooCommerce is not available. Please check your configuration.')
      return
    }

    // Load all initial data in parallel
    const loadData = async () => {
      console.log('✅ WooCommerce is available, loading checkout data...')
      
      // Load critical data first
      await Promise.allSettled([
        fetchCountries(),
        fetchPaymentMethods()
      ])
      
      // Load shipping methods separately (non-critical)
      try {
        await fetchShippingMethods()
      } catch (error) {
        console.warn('Shipping methods failed to load, but checkout can continue:', error)
      }
    }
    
    loadData()
  }, [isWooCommerceAvailable, isWooCommerceLoading])

  // Update form when user data becomes available
  useEffect(() => {
    if (user) {
      console.log('Updating form with user data:', user)
      
      // Convert numeric country codes to proper ISO codes
      const billingCountry = String(user.billing?.country || 'IN')
      const shippingCountry = String(user.shipping?.country || 'IN')
      
      // Handle known numeric country codes
      const normalizeCountryCode = (code: string): string => {
        switch (code) {
          case '102': return 'IN' // India
          case '40': return 'AT'  // Austria (common numeric code)
          case '1': return 'US'   // United States
          case '44': return 'GB'  // United Kingdom
          case '91': return 'IN'  // India (phone code)
          default:
            // If it's a valid 2-letter ISO code, return as is
            if (/^[A-Z]{2}$/i.test(code)) {
              return code.toUpperCase()
            }
            // If it's a numeric code we don't recognize, default to India
            if (/^\d+$/.test(code)) {
              console.warn(`Unknown numeric country code: ${code}, defaulting to IN`)
              return 'IN'
            }
            return code.toUpperCase()
        }
      }
      
      const normalizedBillingCountry = normalizeCountryCode(billingCountry)
      const normalizedShippingCountry = normalizeCountryCode(shippingCountry)
      
      setForm(prev => ({
        ...prev,
        billing: {
          first_name: user.first_name || prev.billing.first_name,
          last_name: user.last_name || prev.billing.last_name,
          company: user.billing?.company || prev.billing.company,
          address_1: user.billing?.address_1 || prev.billing.address_1,
          address_2: user.billing?.address_2 || prev.billing.address_2,
          city: user.billing?.city || prev.billing.city,
          state: user.billing?.state || prev.billing.state || 'KL',
          postcode: user.billing?.postcode || prev.billing.postcode,
          country: normalizedBillingCountry,
          email: user.email || prev.billing.email,
          phone: user.billing?.phone || prev.billing.phone,
        },
        shipping: {
          first_name: user.first_name || prev.shipping.first_name,
          last_name: user.last_name || prev.shipping.last_name,
          company: user.shipping?.company || prev.shipping.company,
          address_1: user.shipping?.address_1 || prev.shipping.address_1,
          address_2: user.shipping?.address_2 || prev.shipping.address_2,
          city: user.shipping?.city || prev.shipping.city,
          state: user.shipping?.state || prev.shipping.state || 'KL',
          postcode: user.shipping?.postcode || prev.shipping.postcode,
          country: normalizedShippingCountry,
        }
      }))
      
      // Load states for preset countries
      if (normalizedBillingCountry) {
        fetchStates('billing', normalizedBillingCountry)
      }
      if (normalizedShippingCountry) {
        fetchStates('shipping', normalizedShippingCountry)
      }
    }
  }, [user])

  const fetchCountries = async () => {
    setLoadingStates(prev => ({ ...prev, countries: true }))
    try {
      const fullData = await woocommerceApi.getCountriesData()
      setCountriesData(fullData)
      const justCountries: { [key: string]: string } = {}
      for (const [code, entry] of Object.entries(fullData)) {
        justCountries[code] = entry.name
      }
      setCountries(justCountries)
      console.log('Countries loaded:', Object.keys(justCountries).length)
      // Initialize states based on current selections
      setBillingStates(fullData[String(form.billing.country).toUpperCase()]?.states || {})
      if (!form.sameAsShipping) {
        setShippingStates(fullData[String(form.shipping.country).toUpperCase()]?.states || {})
      }
      setError(null)
    } catch (error: any) {
      console.error('Failed to fetch countries:', error)
      const errorMessage = error.message || 'Failed to load countries. Please check your connection and try again.'
      setError(errorMessage)
    } finally {
      setLoadingStates(prev => ({ ...prev, countries: false }))
    }
  }

  // Ensure states are loaded when countries data is ready
  useEffect(() => {
    if (Object.keys(countriesData).length > 0) {
      if (form.billing.country) fetchStates('billing', form.billing.country)
      if (!form.sameAsShipping && form.shipping.country) fetchStates('shipping', form.shipping.country)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesData])


  const fetchPaymentMethods = async () => {
    setLoadingStates(prev => ({ ...prev, paymentMethods: true }))
    try {
      console.log('Fetching payment methods from WooCommerce...')
      const methods = await woocommerceApi.getPaymentGateways()
      console.log('Payment methods received:', methods)
      
      if (methods && methods.length > 0) {
        setPaymentMethods(methods)
        setForm(prev => ({ ...prev, paymentMethod: methods[0].id }))
        console.log('Set default payment method:', methods[0].id)
      } else {
        // Don't throw error, just use fallback payment methods
        console.warn('No payment methods from API, using Stripe as fallback')
        const fallbackMethods = [
          { id: 'stripe', title: 'Credit Card (Stripe)', enabled: true }
        ]
        setPaymentMethods(fallbackMethods)
        setForm(prev => ({ ...prev, paymentMethod: 'stripe' }))
      }
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error)
      
      // Use fallback payment method instead of showing error
      console.log('Using fallback payment method: Stripe')
      const fallbackMethods = [
        { id: 'stripe', title: 'Credit Card (Stripe)', enabled: true }
      ]
      setPaymentMethods(fallbackMethods)
      setForm(prev => ({ ...prev, paymentMethod: 'stripe' }))
    } finally {
      setLoadingStates(prev => ({ ...prev, paymentMethods: false }))
    }
  }

  const fetchShippingMethods = async () => {
    setLoadingStates(prev => ({ ...prev, shippingMethods: true }))
    try {
      console.log('Fetching shipping zones...')
      const zones = await woocommerceApi.getShippingZones()
      console.log('Shipping zones fetched:', zones.length, zones)
      
      if (zones.length > 0) {
        console.log('Fetching shipping methods for zone:', zones[0].id)
        const methods = await woocommerceApi.getShippingMethods(zones[0].id)
        setShippingMethods(methods)
        console.log('Shipping methods loaded:', methods.length, methods)
      } else {
        console.log('No shipping zones found, shipping methods not required')
        setShippingMethods([]) // No zones = no shipping methods needed
      }
    } catch (error: any) {
      console.error('Failed to fetch shipping methods - Full error:', error)
      console.error('Error message:', error.message)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      setShippingMethods([]) // Clear shipping methods on error
      
      // Show detailed error message from API
      const errorMessage = error.message || 'Failed to load shipping methods. Please check your connection and try again.'
      
      // Only show error if it's a critical issue (not just missing shipping methods)
      if (errorMessage.includes('endpoint not found') || 
          errorMessage.includes('Authentication failed') || 
          errorMessage.includes('Cannot connect') ||
          errorMessage.includes('WordPress server not found')) {
        setError(errorMessage)
      } else {
        // For shipping method configuration issues, just log but don't block checkout
        console.warn('Shipping methods issue (non-critical):', errorMessage)
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, shippingMethods: false }))
    }
  }

  const handleInputChange = (section: 'billing' | 'shipping', field: keyof CustomerAddress, value: string) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))

    // If country changed, fetch states for that section
    if (field === 'country') {
      fetchStates(section, value)
    }
  }

  const handleFormChange = (field: keyof CheckoutForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Normalize to ISO-3166 alpha-2 for Stripe billing address
  const normalizeToIsoCountry = (code: string): string => {
    if (!code) return 'US'
    switch (code) {
      case '102': return 'IN'
      case '40': return 'AT'
      case '1': return 'US'
      case '44': return 'GB'
      case '91': return 'IN'
      default:
        if (/^[A-Z]{2}$/i.test(code)) return code.toUpperCase()
        if (/^\d+$/.test(code)) return 'IN'
        return code.toUpperCase()
    }
  }

  // Create Stripe Payment Intent via WordPress API
  const createStripePaymentIntent = async (order: any) => {
    try {
      console.log('Creating Stripe Payment Intent via WordPress for order:', order.id)
      
      const wpApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WP_URL
      if (!wpApiUrl) {
        throw new Error('WordPress URL not configured')
      }
      
      const response = await fetch(`${wpApiUrl}/wp-json/stripe/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || 'Failed to create payment intent')
      }

      const data = await response.json()
      console.log('Payment Intent created successfully:', data.intentId)
      
      return { 
        clientSecret: data.clientSecret, 
        paymentIntentId: data.intentId 
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error)
      throw new Error(`Payment setup failed: ${error.message}`)
    }
  }

  // Handle successful Stripe payment
  const handleStripePaymentSuccess = async (paymentIntentId: string, orderNumber?: string) => {
    console.log('✅ Payment succeeded:', paymentIntentId)
    
    if (!currentOrder?.id) {
      console.error('Order ID not found')
      setError('Order ID not found. Please contact support.')
      return
    }

    // NOTE: Order status is now updated by WordPress API call in StripePaymentForm
    // The confirm-payment endpoint updates the order status to 'processing'
    console.log('💡 Order status updated via WordPress API')

    try {
      // Clear cart after successful payment
      console.log('Clearing cart...')
      await clearCart()
      console.log('✅ Cart cleared')
    } catch (cartError) {
      console.warn('⚠️ Failed to clear cart:', cartError)
      // Continue anyway
    }

    // Redirect to order confirmation page with order number if available
    console.log('🔄 Redirecting to order confirmation page with order ID:', currentOrder.id)
    window.location.href = `/order-confirmation/${currentOrder.id}`
  }

  // Handle Stripe payment errors
  const handleStripePaymentError = (error: string) => {
    console.error('Stripe payment error:', error)
    setError(`Payment failed: ${error}`)
    setLoading(false)
    setShowStripeForm(false)
    setStripeClientSecret(null)
  }

  // Handle successful PayPal payment
  const handlePayPalPaymentSuccess = async (paypalOrderId: string) => {
    console.log('✅ PayPal payment succeeded:', paypalOrderId)
    
    if (!currentOrder?.id) {
      console.error('Order ID not found')
      setError('Order ID not found. Please contact support.')
      return
    }

    try {
      // Clear cart after successful payment
      console.log('Clearing cart...')
      await clearCart()
      console.log('✅ Cart cleared')
    } catch (cartError) {
      console.warn('⚠️ Failed to clear cart:', cartError)
      // Continue anyway
    }

    // Redirect to order confirmation page
    console.log('🔄 Redirecting to order confirmation page with order ID:', currentOrder.id)
    window.location.href = `/order-confirmation/${currentOrder.id}`
  }

  // Handle PayPal payment errors
  const handlePayPalPaymentError = (error: string) => {
    console.error('PayPal payment error:', error)
    setError(`Payment failed: ${error}`)
    setLoading(false)
    setShowPayPalForm(false)
  }

  // Handle PayPal payment cancellation
  const handlePayPalPaymentCancel = () => {
    console.log('PayPal payment cancelled by user')
    setLoading(false)
    setShowPayPalForm(false)
    setError('Payment was cancelled. You can try again when ready.')
  }

  const processPayment = async (order: any, paymentMethod: string) => {
    console.log('Processing payment for order:', order.id, 'with method:', paymentMethod)
    
    try {
      switch (paymentMethod) {
        case 'stripe':
          // For Stripe, we create a Payment Intent and show the Stripe form
          console.log('Setting up Stripe payment...')
          setCurrentOrder(order)
          
          try {
            const { clientSecret } = await createStripePaymentIntent(order)
            setStripeClientSecret(clientSecret)
            setShowStripeForm(true)
            setLoading(false) // Allow user to interact with Stripe form
          } catch (stripeError: any) {
            console.error('Failed to create Stripe Payment Intent:', stripeError)
            throw new Error(`Payment setup failed: ${stripeError.message}`)
          }
          
          // Don't mark as paid yet - this will be done after Stripe confirmation
          break
          
        case 'paypal':
        case 'ppcp-gateway':
          // For PayPal, we show the PayPal payment form
          console.log('Setting up PayPal payment...')
          setCurrentOrder(order)
          setShowPayPalForm(true)
          setLoading(false) // Allow user to interact with PayPal form
          // Don't mark as paid yet - this will be done after PayPal confirmation
          break
          
        case 'cod':
          // Cash on Delivery - no immediate payment processing needed
          console.log('Cash on Delivery selected - no immediate payment processing')
          await woocommerceApi.updateOrderStatus(order.id, 'on-hold', 'Awaiting cash on delivery payment')
          break
          
        case 'bacs':
          // Bank Transfer - no immediate payment processing needed
          console.log('Bank Transfer selected - awaiting payment')
          await woocommerceApi.updateOrderStatus(order.id, 'on-hold', 'Awaiting bank transfer payment')
          break
          
        default:
          console.log('Unknown payment method, keeping order as pending')
          break
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      throw error
    }
  }

  const validateForm = (): boolean => {
    const requiredAddressFields: (keyof CustomerAddress)[] = [
      'first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'country'
    ]

    console.log('Validating form with billing data:', form.billing)
    console.log('Validating form with shipping data:', form.shipping)
    console.log('Same as shipping:', form.sameAsShipping)

    if (form.sameAsShipping) {
      // When "Same as billing address" is checked, user fills BILLING form
      // So validate billing fields (which includes email)
      console.log('Validating billing fields (same as billing mode)')
      
      const requiredBillingFields: (keyof CustomerAddress)[] = [
        'first_name', 'last_name', 'email', 'address_1', 'city', 'state', 'postcode', 'country'
      ]
      
      for (const field of requiredBillingFields) {
        const value = form.billing[field]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          console.error(`Validation failed for billing field: ${field}, value:`, value)
          setError(`Please fill in the ${field.replace('_', ' ')}`)
          return false
        }
      }
      
      // Validate email format
      if (!form.billing.email || !/\S+@\S+\.\S+/.test(form.billing.email)) {
        setError('Please enter a valid email address')
        return false
      }
    } else {
      // When "Same as billing address" is unchecked, validate both forms separately
      console.log('Validating both billing and shipping fields (separate addresses mode)')
      
      // Check billing fields (including email)
      const requiredBillingFields: (keyof CustomerAddress)[] = [
        'first_name', 'last_name', 'email', 'address_1', 'city', 'state', 'postcode', 'country'
      ]
      
      for (const field of requiredBillingFields) {
        const value = form.billing[field]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          console.error(`Validation failed for billing field: ${field}, value:`, value)
          setError(`Please fill in the billing ${field.replace('_', ' ')}`)
          return false
        }
      }
      
      // Check shipping fields
      for (const field of requiredAddressFields) {
        const value = form.shipping[field]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          console.error(`Validation failed for shipping field: ${field}, value:`, value)
          setError(`Please fill in the shipping ${field.replace('_', ' ')}`)
          return false
        }
      }
      
      // Validate email format
      if (!form.billing.email || !/\S+@\S+\.\S+/.test(form.billing.email)) {
        setError('Please enter a valid email address')
        return false
      }
    }

    // Check payment method
    if (!form.paymentMethod) {
      setError('Please select a payment method')
      return false
    }

    // Check terms agreement
    if (!form.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Normalize country codes before creating order
      const normalizeCountryCode = (code: string): string => {
        switch (code) {
          case '102': return 'IN' // India
          case '40': return 'AT'  // Austria
          case '1': return 'US'   // United States
          case '44': return 'GB'  // United Kingdom
          case '91': return 'IN'  // India (phone code)
          default:
            if (/^[A-Z]{2}$/i.test(code)) {
              return code.toUpperCase()
            }
            if (/^\d+$/.test(code)) {
              console.warn(`Unknown numeric country code: ${code}, defaulting to IN`)
              return 'IN'
            }
            return code.toUpperCase()
        }
      }

      // When "Same as billing address" is checked, use billing address for both billing and shipping
      // When unchecked, use separate addresses
      const billingAddress = {
        ...form.billing,
        country: normalizeCountryCode(form.billing.country)
      }
      const shippingAddress = form.sameAsShipping 
        ? {
            ...form.billing, // Use billing address for shipping when "Same as billing address" is checked
            country: normalizeCountryCode(form.billing.country)
          }
        : {
            ...form.shipping, // Use separate shipping address when unchecked
            country: normalizeCountryCode(form.shipping.country)
          }

      const orderData = {
        payment_method: form.paymentMethod,
        payment_method_title: paymentMethods.find(m => m.id === form.paymentMethod)?.title || '',
        billing: billingAddress,
        shipping: shippingAddress,
        line_items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        coupon_lines: appliedCoupons.map(coupon => ({
          code: coupon.code,
        })),
        customer_note: form.customerNote,
        // Include customer ID if authenticated
        customer_id: isAuthenticated && user?.id ? user.id : 0,
      }

      console.log('Checkout order data:', {
        ...orderData,
        billing: { 
          ...orderData.billing, 
          email: orderData.billing.email ? 'present' : 'missing',
          phone: orderData.billing.phone ? 'present' : 'missing'
        },
        shipping: {
          ...orderData.shipping,
          same_as_billing: form.sameAsShipping
        },
        line_items_count: orderData.line_items.length,
        has_cart_token: !!cartToken
      })

      // Debug billing address structure
      console.log('Detailed billing address:', {
        first_name: orderData.billing.first_name || 'MISSING',
        last_name: orderData.billing.last_name || 'MISSING',
        company: orderData.billing.company || 'empty',
        address_1: orderData.billing.address_1 || 'MISSING',
        address_2: orderData.billing.address_2 || 'empty',
        city: orderData.billing.city || 'MISSING',
        state: orderData.billing.state || 'MISSING',
        postcode: orderData.billing.postcode || 'MISSING',
        country: orderData.billing.country || 'MISSING',
        email: orderData.billing.email || 'MISSING',
        phone: orderData.billing.phone || 'empty'
      })

      // Debug form state
      console.log('Form state debug:', {
        sameAsShipping: form.sameAsShipping,
        billing_filled: Object.keys(form.billing).filter(key => form.billing[key as keyof CustomerAddress]).length,
        shipping_filled: Object.keys(form.shipping).filter(key => form.shipping[key as keyof CustomerAddress]).length
      })

      // Validate required billing fields before sending to API
      const requiredBillingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'country', 'email']
      const missingBillingFields = requiredBillingFields.filter(field => {
        const value = orderData.billing[field as keyof typeof orderData.billing]
        return !value || (typeof value === 'string' && value.trim() === '')
      })
      
      if (missingBillingFields.length > 0) {
        const errorMsg = `Please fill in the following billing fields: ${missingBillingFields.join(', ')}`
        console.error(errorMsg)
        console.error('Current billing data:', orderData.billing)
        setError(errorMsg)
        setLoading(false)
        return
      }

      // Create order using direct WooCommerce REST API (matches curl example)
      const order = await woocommerceApi.createOrder(orderData)
      
      console.log('Order created successfully:', { id: order?.id, status: order?.status })
      
      // Payment Processing Based on Selected Method
      if (order.id) {
        try {
          await processPayment(order, form.paymentMethod)
          
          // For non-Stripe and non-PayPal payments, complete the checkout flow
          if (form.paymentMethod !== 'stripe' && form.paymentMethod !== 'paypal' && form.paymentMethod !== 'ppcp-gateway') {
            // Clear cart after successful order (both local and server)
            await clearCart()
            // Redirect to order confirmation
            window.location.href = `/order-confirmation/${order.id}`
          }
          // For Stripe and PayPal payments, the flow continues in their respective form components
        } catch (paymentError) {
          console.warn('Payment processing failed, but order was created:', paymentError)
          setError(`Payment processing failed: ${paymentError}`)
        }
      }
      
    } catch (err: any) {
      console.error('Checkout error:', err)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create order'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.code) {
        switch (err.code) {
          case 'woocommerce_rest_cannot_create':
            errorMessage = 'Unable to create order. Please check your information and try again.'
            break
          case 'woocommerce_rest_invalid_product_id':
            errorMessage = 'One or more products in your cart are no longer available.'
            break
          case 'woocommerce_rest_insufficient_stock':
            errorMessage = 'Insufficient stock for one or more items in your cart.'
            break
          default:
            errorMessage = `Order creation failed: ${err.code}`
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const finalTotal: number = total

  // Show loading skeleton during cart hydration or initial data loading
  if (!isHydrated || loadingStates.countries || loadingStates.paymentMethods || loadingStates.shippingMethods) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address Skeleton */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Skeleton */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show empty cart state only after hydration is complete
  if (items.length === 0) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        {/* Empty Cart Icon and Message */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
            <Frown className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is currently empty!</h2>
          <p className="text-gray-600">
            <Link href="/shop" className="text-themes-pink-600 hover:underline">Return to shop</Link>
          </p>
        </div>

        {/* New in Store Section */}
        <div className="mt-16 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">New in store</h2>
          
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newProducts.map((product) => (
                <div key={product.id} className="group relative">
                  <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Product Image */}
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-square bg-gray-100">
                        {product.images?.[0]?.src ? (
                          <Image
                            src={product.images[0].src}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Sale Badge */}
                        {product.on_sale && (
                          <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                            Sale
                          </div>
                        )}

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleToggleWishlist(product)
                          }}
                          className={cn(
                            "absolute top-2 left-2 p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all",
                            isInWishlist(product.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
                          )}
                          aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart className={cn("h-5 w-5", isInWishlist(product.id) && "fill-current")} />
                        </button>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link href={`/product/${product.slug}`}>
                        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-themes-pink-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mb-3">
                        {product.on_sale && product.regular_price ? (
                          <>
                            <span className="text-lg font-bold text-gray-900">
                              ${parseFloat(product.sale_price || product.price).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${parseFloat(product.regular_price).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCart.has(product.id)}
                        className="w-full"
                        size="sm"
                      >
                        {addingToCart.has(product.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue Shopping Button */}
          <div className="text-center mt-12">
            <Link href="/shop">
              <Button size="lg" className="flex items-center gap-2 mx-auto">
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Check if critical data is missing and show appropriate error
  const hasCriticalError = (
    (Object.keys(countries).length === 0 && !loadingStates.countries) ||
    (paymentMethods.length === 0 && !loadingStates.paymentMethods)
  )

  if (hasCriticalError && error) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <div className="text-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-red-900 mb-4">Checkout Unavailable</h2>
            <div className="text-left space-y-4">
              <div className="bg-white p-4 rounded border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">Configuration Error</h3>
                <p className="text-red-700 text-sm mb-3">{error}</p>
                <p className="text-red-600 text-sm">
                  Please ensure WooCommerce is properly configured with:
                </p>
                <ul className="list-disc list-inside text-red-600 text-sm mt-2 space-y-1">
                  <li>At least one enabled payment method</li>
                  <li>Proper API credentials</li>
                  <li>Active WooCommerce plugin</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-2">What to do next</h3>
                <p className="text-yellow-700 text-sm">
                  Contact the site administrator or try refreshing the page. If the problem persists, please check back later.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/shop">
                <Button variant="outline">Return to Shop</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasBillingStateOptions = Object.keys(billingStates).length > 0
  const hasShippingStateOptions = Object.keys(shippingStates).length > 0

  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      {/* WoodMart Style Page Header */}
      <div className="mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-4">Secure Checkout</h1>
          <div className="flex items-center justify-center text-sm text-gray-600 bg-green-50 px-6 py-3 rounded-xl border border-green-200 max-w-md mx-auto">
            <Lock className="h-5 w-5 mr-3 text-green-600" />
            <span className="font-medium">256-bit SSL Secure Encryption</span>
          </div>
        </div>
      </div>

      {/* Cart Error Message */}
      {cartError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800 text-sm">{cartError}</p>
            {cartError.includes('connect') && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCart}
                disabled={loading}
                className="ml-4 text-red-700 border-red-300 hover:bg-red-100"
              >
                {loading ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* WoodMart Style Billing Address */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 mb-6">
                <h3 className="text-2xl font-bold text-blue-900 flex items-center">
                  <MapPin className="h-6 w-6 mr-3 text-blue-600" />
                  Billing Address
                </h3>
                <p className="text-blue-700 text-sm mt-2">Enter your billing information for payment processing</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billing_first_name">First Name *</Label>
                  <Input
                    id="billing_first_name"
                    value={form.billing.first_name}
                    onChange={(e) => handleInputChange('billing', 'first_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billing_last_name">Last Name *</Label>
                  <Input
                    id="billing_last_name"
                    value={form.billing.last_name}
                    onChange={(e) => handleInputChange('billing', 'last_name', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="billing_email">Email Address *</Label>
                  <Input
                    id="billing_email"
                    type="email"
                    value={form.billing.email}
                    onChange={(e) => handleInputChange('billing', 'email', e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="billing_phone">Phone Number</Label>
                  <Input
                    id="billing_phone"
                    type="tel"
                    value={form.billing.phone || ''}
                    onChange={(e) => handleInputChange('billing', 'phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="billing_company">Company Name</Label>
                  <Input
                    id="billing_company"
                    value={form.billing.company}
                    onChange={(e) => handleInputChange('billing', 'company', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="billing_address_1">Street Address *</Label>
                  <Input
                    id="billing_address_1"
                    value={form.billing.address_1}
                    onChange={(e) => handleInputChange('billing', 'address_1', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="billing_address_2">Apartment, suite, etc.</Label>
                  <Input
                    id="billing_address_2"
                    value={form.billing.address_2}
                    onChange={(e) => handleInputChange('billing', 'address_2', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="billing_city">City *</Label>
                  <Input
                    id="billing_city"
                    value={form.billing.city}
                    onChange={(e) => handleInputChange('billing', 'city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billing_state">State / Province *</Label>
                  {Object.keys(billingStates).length > 0 ? (
                    <select
                      id="billing_state"
                      value={form.billing.state}
                      onChange={(e) => handleInputChange('billing', 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-themes-pink-500"
                      required
                      disabled={loadingStates.billingStates}
                    >
                      <option value="">{loadingStates.billingStates ? 'Loading states...' : 'Select State'}</option>
                      {Object.entries(billingStates).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id="billing_state"
                      value={form.billing.state}
                      onChange={(e) => handleInputChange('billing', 'state', e.target.value)}
                      required
                      placeholder="Enter your state or province"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="billing_postcode">ZIP Code *</Label>
                  <Input
                    id="billing_postcode"
                    value={form.billing.postcode}
                    onChange={(e) => handleInputChange('billing', 'postcode', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billing_country">Country *</Label>
                  <select
                    id="billing_country"
                    value={form.billing.country}
                    onChange={(e) => handleInputChange('billing', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-themes-pink-500"
                    required
                    disabled={loadingStates.countries}
                  >
                    <option value="">
                      {loadingStates.countries ? 'Loading countries...' : 'Select Country'}
                    </option>
                    {Object.entries(countries).map(([code, name]) => (
                      <option key={code} value={code}>
                        {typeof name === 'string' ? name : typeof name === 'object' && name !== null ? (name as any).name || code : code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* WoodMart Style Shipping Address */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-purple-900 flex items-center">
                      <MapPin className="h-6 w-6 mr-3 text-purple-600" />
                      Shipping Address
                    </h3>
                    <p className="text-purple-700 text-sm mt-2">Where should we deliver your order?</p>
                  </div>
                  <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-xl border border-purple-200">
                    <Checkbox
                      id="sameAsShipping"
                      checked={form.sameAsShipping}
                      onCheckedChange={(checked) => handleFormChange('sameAsShipping', checked)}
                    />
                    <Label htmlFor="sameAsShipping" className="font-medium text-purple-800">Same as billing address</Label>
                  </div>
                </div>
              </div>

              {!form.sameAsShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_first_name">First Name *</Label>
                    <Input
                      id="shipping_first_name"
                      value={form.shipping.first_name}
                      onChange={(e) => handleInputChange('shipping', 'first_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_last_name">Last Name *</Label>
                    <Input
                      id="shipping_last_name"
                      value={form.shipping.last_name}
                      onChange={(e) => handleInputChange('shipping', 'last_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="shipping_company">Company Name</Label>
                    <Input
                      id="shipping_company"
                      value={form.shipping.company}
                      onChange={(e) => handleInputChange('shipping', 'company', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="shipping_address_1">Street Address *</Label>
                    <Input
                      id="shipping_address_1"
                      value={form.shipping.address_1}
                      onChange={(e) => handleInputChange('shipping', 'address_1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="shipping_address_2">Apartment, suite, etc.</Label>
                    <Input
                      id="shipping_address_2"
                      value={form.shipping.address_2}
                      onChange={(e) => handleInputChange('shipping', 'address_2', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_city">City *</Label>
                    <Input
                      id="shipping_city"
                      value={form.shipping.city}
                      onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_state">State / Province *</Label>
                    {Object.keys(shippingStates).length > 0 ? (
                      <select
                        id="shipping_state"
                        value={form.shipping.state}
                        onChange={(e) => handleInputChange('shipping', 'state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-themes-pink-500"
                        required
                        disabled={loadingStates.shippingStates}
                      >
                        <option value="">{loadingStates.shippingStates ? 'Loading states...' : 'Select State'}</option>
                        {Object.entries(shippingStates).map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id="shipping_state"
                        value={form.shipping.state}
                        onChange={(e) => handleInputChange('shipping', 'state', e.target.value)}
                        required
                        placeholder="Enter your state or province"
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="shipping_postcode">ZIP Code *</Label>
                    <Input
                      id="shipping_postcode"
                      value={form.shipping.postcode}
                      onChange={(e) => handleInputChange('shipping', 'postcode', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_country">Country *</Label>
                    <select
                      id="shipping_country"
                      value={form.shipping.country}
                      onChange={(e) => handleInputChange('shipping', 'country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-themes-pink-500"
                      required
                      disabled={loadingStates.countries}
                    >
                      <option value="">
                        {loadingStates.countries ? 'Loading countries...' : 'Select Country'}
                      </option>
                      {Object.entries(countries).map(([code, name]) => (
                        <option key={code} value={code}>
                          {typeof name === 'string' ? name : typeof name === 'object' && name !== null ? (name as any).name || code : code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* WoodMart Style Order Notes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200 mb-6">
                <h3 className="text-2xl font-bold text-green-900 mb-2">Order Notes</h3>
                <p className="text-green-700 text-sm">Add special instructions for your order (optional)</p>
              </div>
              <Label htmlFor="customerNote" className="text-lg font-medium text-gray-900">Notes about your order</Label>
              <textarea
                id="customerNote"
                value={form.customerNote}
                onChange={(e) => handleFormChange('customerNote', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mt-3 bg-gray-50 hover:bg-white transition-colors duration-200"
                rows={4}
                placeholder="Special delivery instructions, gift message, etc..."
              />
            </div>
          </div>

          {/* WoodMart Style Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 sticky top-4 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Summary</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto"></div>
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="mb-6">
                <CouponInput compact showValidation={false} />
              </div>

              <Separator className="mb-4" />

              {/* WoodMart Style Order Totals */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="text-lg font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                
                {discountTotal > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Discount</span>
                    <span className="text-lg font-bold text-green-600">-${discountTotal.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Shipping</span>
                  <span className="text-lg font-bold text-gray-900">
                    {shippingTotal === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `$${shippingTotal.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Tax</span>
                  <span className="text-lg font-bold text-gray-900">${taxTotal.toFixed(2)}</span>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-orange-900">Total</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* WoodMart Style Payment Methods */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200 mb-4">
                  <h4 className="text-lg font-bold text-indigo-900 flex items-center">
                    <CreditCard className="h-5 w-5 mr-3 text-indigo-600" />
                    Payment Method
                  </h4>
                  <p className="text-indigo-700 text-sm mt-1">Choose your preferred payment option</p>
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className={cn(
                      "flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all duration-200",
                      form.paymentMethod === method.id && "border-orange-500 bg-orange-50",
                      (loading || showStripeForm) && "opacity-50 cursor-not-allowed"
                    )}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={form.paymentMethod === method.id}
                        onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                        disabled={loading || showStripeForm}
                        className="mr-4 w-5 h-5 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-base font-medium text-gray-900">{method.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stripe Payment Form */}
              {showStripeForm && stripeClientSecret && currentOrder && (
                <div className="mb-6">
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                    <h4 className="text-pink-800 font-medium mb-2">Complete Your Payment</h4>
                    <p className="text-pink-600 text-sm">
                      Order #{currentOrder.id} created. Complete payment below to finalize your purchase.
                    </p>
                  </div>
                  
                  <StripePaymentForm
                    clientSecret={stripeClientSecret}
                    amount={finalTotal}
                    currency={currentOrder.currency || 'usd'}
                    orderId={currentOrder.id}
                    customerEmail={form.billing.email || ''}
                    billingDetails={{
                      name: `${form.billing.first_name} ${form.billing.last_name}`.trim(),
                      email: form.billing.email || '',
                      phone: form.billing.phone || undefined,
                      address: {
                        line1: form.billing.address_1 || '',
                        line2: form.billing.address_2 || undefined,
                        city: form.billing.city || '',
                        state: form.billing.state || '',
                        postal_code: form.billing.postcode || '',
                        country: normalizeToIsoCountry(form.billing.country || 'US'),
                      },
                    }}
                    onSuccess={handleStripePaymentSuccess}
                    onError={handleStripePaymentError}
                  />
                  
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowStripeForm(false)
                        setStripeClientSecret(null)
                        setLoading(false)
                      }}
                      disabled={loading}
                    >
                      Cancel Payment
                    </Button>
                  </div>
                </div>
              )}

              {/* PayPal Payment Form */}
              {showPayPalForm && currentOrder && (
                <div className="mb-6">
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                    <h4 className="text-pink-800 font-medium mb-2">Complete Your Payment</h4>
                    <p className="text-pink-600 text-sm">
                      Order #{currentOrder.id} created. Complete payment with PayPal below to finalize your purchase.
                    </p>
                  </div>
                  
                  <PayPalPaymentForm
                    orderId={currentOrder.id}
                    orderTotal={finalTotal}
                    currency={currentOrder.currency || 'USD'}
                    onSuccess={handlePayPalPaymentSuccess}
                    onError={handlePayPalPaymentError}
                    onCancel={handlePayPalPaymentCancel}
                  />
                  
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPayPalForm(false)
                        setLoading(false)
                      }}
                      disabled={loading}
                    >
                      Cancel Payment
                    </Button>
                  </div>
                </div>
              )}

              {/* WoodMart Style Terms and Conditions */}
              <div className="mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreeToTerms"
                      checked={form.agreeToTerms}
                      onCheckedChange={(checked) => handleFormChange('agreeToTerms', checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm font-medium text-gray-700 leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* WoodMart Style Place Order Button - Hide when Stripe or PayPal form is shown */}
              {!showStripeForm && !showPayPalForm && (
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  disabled={loading || !form.agreeToTerms}
                >
                  {loading ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
