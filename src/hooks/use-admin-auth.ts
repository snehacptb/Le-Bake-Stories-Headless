/**
 * useAdminAuth Hook
 * Checks if the current user has admin privileges for displaying admin features
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface AdminStatus {
  isAdmin: boolean
  canEditPosts: boolean
  isLoading: boolean
  error: string | null
  userId?: number
  userRoles?: string[]
  displayName?: string
}

export function useAdminAuth() {
  const { isAuthenticated, user } = useAuth()
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    canEditPosts: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const checkAdminStatus = async () => {
      // If user is not authenticated, they're not an admin
      if (!isAuthenticated || !user) {
        setAdminStatus({
          isAdmin: false,
          canEditPosts: false,
          isLoading: false,
          error: null,
        })
        return
      }

      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('wc-auth-token')
        
        if (!token) {
          setAdminStatus({
            isAdmin: false,
            canEditPosts: false,
            isLoading: false,
            error: 'No authentication token found',
          })
          return
        }

        // Call Next.js API route to verify admin status
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to verify admin status')
        }

        const data = await response.json()

        setAdminStatus({
          isAdmin: data.is_admin || false,
          canEditPosts: data.can_edit_posts || false,
          isLoading: false,
          error: null,
          userId: data.user_id,
          userRoles: data.user_roles,
          displayName: data.display_name,
        })
      } catch (error: any) {
        console.error('Admin verification error:', error)
        setAdminStatus({
          isAdmin: false,
          canEditPosts: false,
          isLoading: false,
          error: error.message,
        })
      }
    }

    checkAdminStatus()
  }, [isAuthenticated, user])

  return adminStatus
}

