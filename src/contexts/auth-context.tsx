'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Customer } from '@/types'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { clearAllGuestData } from '@/lib/clear-guest-data'
import { cartPersistence } from '@/lib/cart-persistence'
import { wishlistPersistence } from '@/lib/wishlist-persistence'

interface AuthState {
  user: Customer | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    username?: string
  }) => Promise<void>
  logout: () => void
  updateProfile: (userData: Partial<Customer>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Helper method to extract user ID from JWT token
  const getUserIdFromToken = (token: string): number | null => {
    try {
      // JWT payload is the second part of the token (base64 encoded)
      const payload = token.split('.')[1]
      if (!payload) return null
      
      // Decode base64 and parse JSON
      const decoded = JSON.parse(atob(payload))
      return decoded.data?.user?.id || decoded.user_id || null
    } catch (error) {
      console.error('Error decoding JWT token:', error)
      return null
    }
  }

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('wc-auth-token')
      const userId = localStorage.getItem('wc-user-id')
      
      if (token && userId) {
        try {
          // Validate token by attempting to fetch user data
          const user = await woocommerceApi.getCustomer(parseInt(userId))
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (userError: any) {
          // If user fetch fails, token might be invalid or expired
          console.warn('Failed to fetch user data, token may be invalid:', userError)
          
          // If it's a 401/403, clear invalid session
          if (userError.response?.status === 401 || userError.response?.status === 403) {
            console.log('Token appears invalid, clearing session')
            localStorage.removeItem('wc-auth-token')
            localStorage.removeItem('wc-user-id')
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          } else {
            // Other errors might be temporary, keep session but mark as unauthenticated
            setState(prev => ({ ...prev, isLoading: false }))
          }
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('wc-auth-token')
      localStorage.removeItem('wc-user-id')
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  }

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      let jwtAuthUrl = process.env.NEXT_PUBLIC_JWT_AUTH_URL
      
      if (!jwtAuthUrl) {
        throw new Error('JWT authentication URL is not configured. Please check your environment variables.')
      }

      // Only convert HTTPS to HTTP for actual local development domains, not production domains
      if (process.env.NODE_ENV === 'development' && jwtAuthUrl.startsWith('https://')) {
        const isLocalDomain = jwtAuthUrl.includes('localhost') || 
                             jwtAuthUrl.includes('127.0.0.1') || 
                             jwtAuthUrl.includes('.local') ||
                             jwtAuthUrl.includes('192.168.') ||
                             jwtAuthUrl.includes('10.0.')
        
        if (isLocalDomain) {
          console.warn('Converting HTTPS to HTTP for local development to avoid SSL certificate issues')
          jwtAuthUrl = jwtAuthUrl.replace('https://', 'http://')
        } else {
          console.log('Production domain detected, keeping HTTPS for JWT authentication:', jwtAuthUrl)
        }
      }

      console.log('Attempting JWT authentication to:', `${jwtAuthUrl}/token`)
      
      // Call WordPress JWT authentication endpoint
      const response = await fetch(`${jwtAuthUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Include cookies for CORS
        body: JSON.stringify({
          username: email,
          password,
        }),
      })

      console.log('JWT Auth Response Status:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = 'Authentication failed'
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.data?.message || errorMessage
          console.error('JWT Auth Error Details:', errorData)
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }

        // Provide specific error messages for common issues
        if (response.status === 403) {
          errorMessage = 'JWT Authentication plugin may not be installed or configured properly in WordPress. Please check your WordPress setup.'
        } else if (response.status === 404) {
          errorMessage = 'JWT Authentication endpoint not found. Please ensure the JWT plugin is installed and activated.'
        } else if (response.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials.'
        }
        
        throw new Error(errorMessage)
      }

      const authData = await response.json()
      console.log('JWT Auth Success:', { 
        hasToken: !!authData.token, 
        hasUserId: !!authData.user_id,
        userEmail: authData.user_email,
        userDisplayName: authData.user_display_name 
      })
      
      if (!authData.token) {
        throw new Error('No authentication token received from server')
      }
      
      // Store auth data
      localStorage.setItem('wc-auth-token', authData.token)
      
      // Get user ID from response or decode from token
      const userId = authData.user_id || getUserIdFromToken(authData.token)
      if (!userId) {
        throw new Error('Could not determine user ID from authentication response')
      }
      localStorage.setItem('wc-user-id', userId.toString())
      
      // Fetch full customer data using WooCommerce API
      try {
        const user = await woocommerceApi.getCustomer(Number(userId))
        
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } catch (customerError) {
        console.error('Failed to fetch customer data:', customerError)
        
        // If we can't fetch customer data, create a basic user object from JWT response
        const basicUser = {
          id: Number(userId),
          email: authData.user_email || email,
          first_name: authData.user_display_name?.split(' ')[0] || '',
          last_name: authData.user_display_name?.split(' ').slice(1).join(' ') || '',
          username: authData.user_nicename || email,
          date_created: new Date().toISOString(),
          date_modified: new Date().toISOString(),
          role: 'customer',
          billing: {},
          shipping: {},
        }
        
        setState({
          user: basicUser as any,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed',
      })
      throw error
    }
  }

  const register = async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    username?: string
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      console.log('Starting WooCommerce REST API registration for:', userData.email)
      
      // Use WooCommerce REST API for customer registration
      // Note: Store API doesn't support customer registration, only cart/checkout operations
      const registrationResult = await woocommerceApi.registerCustomerViaWooCommerce(userData)
      
      if (!registrationResult.success) {
        throw new Error(registrationResult.message || 'Registration failed. Please try again.')
      }
      
      console.log('WooCommerce REST API registration successful:', {
        customerId: registrationResult.customer?.id,
        customerEmail: registrationResult.customer?.email
      })
      
      // 2. Wait a moment for WordPress to process the new user
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 3. Auto-login after successful registration
      try {
        console.log('Attempting` auto-login after WooCommerce REST API registration...')
        await login(userData.email, userData.password)
        console.log('Auto-login successful!')
      } catch (loginError: any) {
        console.error('Auto-login after registration failed:', loginError)
        
        // Provide helpful error message based on the login error
        let registrationMessage = 'Registration successful! '
        
        if (loginError.message?.includes('JWT Authentication plugin')) {
          registrationMessage += 'However, automatic login failed due to JWT configuration issues. Please log in manually.'
        } else if (loginError.message?.includes('Invalid email or password')) {
          registrationMessage += 'Please wait a moment and then log in with your new credentials.'
        } else {
          registrationMessage += 'Please log in with your new credentials.'
        }
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: registrationMessage
        }))
        
        // Don't throw error here - registration was successful
        return
      }
    } catch (error: any) {
      console.error('WooCommerce REST API registration error:', error)
      
      let errorMessage = 'Registration failed. Please try again.'
      
      if (error.message) {
        errorMessage = error.message
      }
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      }))
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    const userId = state.user?.id
    
    // Clear authentication tokens
    localStorage.removeItem('wc-auth-token')
    localStorage.removeItem('wc-user-id')
    
    // NOTE: We do NOT clear user-specific cart and wishlist data on logout
    // This data should persist so users can access their cart/wishlist when they log back in
    // Only guest data is cleared below
    
    // Clear ALL guest data on logout using utility function
    try {
      clearAllGuestData()
      
      // Clear any checkout-related localStorage data
      const checkoutKeys = [
        'checkout-form-data',
        'checkout-shipping-methods',
        'checkout-payment-methods',
        'checkout-countries',
        'checkout-states',
        'checkout-cache'
      ]
      
      checkoutKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key)
          console.log(`Cleared ${key} on logout`)
        }
      })
      
      console.log('✅ Successfully cleared guest data on logout (user data preserved)')
    } catch (error) {
      console.warn('⚠️ Failed to clear some data on logout:', error)
    }
    
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  }

  const updateProfile = async (userData: Partial<Customer>) => {
    if (!state.user) {
      throw new Error('No user logged in')
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const updatedUser = await woocommerceApi.updateCustomer(state.user.id, userData)
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
        error: null,
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Profile update failed',
      }))
      throw error
    }
  }

  const refreshUser = async () => {
    if (!state.user) return

    try {
      const user = await woocommerceApi.getCustomer(state.user.id)
      setState(prev => ({ ...prev, user }))
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
