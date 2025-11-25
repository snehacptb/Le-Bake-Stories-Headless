'use client'

/**
 * Floating SEO Panel Component
 * Admin-only panel for editing SEO metadata directly from the frontend
 * Similar to the WordPress admin bar in traditional WordPress sites
 */

import { useState, useEffect } from 'react'
import { X, Edit, Save, ChevronDown, ChevronUp, Loader2, Check, AlertCircle } from 'lucide-react'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { usePathname } from 'next/navigation'

interface SEOData {
  title: string
  description: string
  canonical: string
  robots: {
    noindex: boolean
    nofollow: boolean
    noarchive: boolean
    nosnippet: boolean
    noimageindex: boolean
  }
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
}

interface FloatingSEOPanelProps {
  postId?: number
  postSlug?: string
  postType?: 'post' | 'page' | 'product'
  initialSeoData?: SEOData
}

export function FloatingSEOPanel({
  postId,
  postSlug,
  postType = 'post',
  initialSeoData
}: FloatingSEOPanelProps) {
  const { isAdmin, canEditPosts, isLoading: isAuthLoading } = useAdminAuth()
  const pathname = usePathname()
  
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [seoData, setSeoData] = useState<SEOData | null>(initialSeoData || null)
  const [editedData, setEditedData] = useState<Partial<SEOData>>({})
  const [isLoadingSeo, setIsLoadingSeo] = useState(false)

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch SEO data if not provided
  useEffect(() => {
    if (isMounted && !seoData && postSlug) {
      fetchSeoData()
    }
  }, [postSlug, isMounted])

  const fetchSeoData = async () => {
    if (!postSlug) return
    
    setIsLoadingSeo(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/seo/get?slug=${postSlug}&type=${postType}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch SEO data')
      }
      
      const result = await response.json()
      setSeoData(result.data)
    } catch (err: any) {
      console.error('Error fetching SEO data:', err)
      setError(err.message)
    } finally {
      setIsLoadingSeo(false)
    }
  }

  const handleSave = async () => {
    if (!postId) {
      setError('Post ID is required to update SEO data')
      return
    }

    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const token = localStorage.getItem('wc-auth-token')
      
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('/api/seo/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          ...editedData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update SEO data')
      }

      const result = await response.json()
      
      // Update local state with returned data
      if (result.seo_data) {
        setSeoData(result.seo_data)
      }
      
      setEditedData({})
      setIsEditing(false)
      setSaveSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error updating SEO data:', err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getCurrentValue = (field: keyof SEOData): string => {
    if (field in editedData) {
      const value = editedData[field]
      return typeof value === 'string' ? value : ''
    }
    const value = seoData?.[field]
    return typeof value === 'string' ? value : ''
  }

  const handleCancel = () => {
    setEditedData({})
    setIsEditing(false)
    setError(null)
  }

  // Don't render on server or if not mounted
  if (!isMounted) {
    return null
  }

  // Don't render if not admin or still loading
  if (isAuthLoading || (!isAdmin && !canEditPosts)) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center gap-2"
          title="Edit SEO"
        >
          <Edit className="w-5 h-5" />
          {!isOpen && <span className="text-sm font-medium">SEO</span>}
        </button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-[400px] max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              <h3 className="font-semibold">SEO Settings</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-white/10 p-1 rounded transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1 rounded transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {saveSuccess && (
            <div className="bg-green-50 border-b border-green-200 p-3 flex items-center gap-2 text-green-800">
              <Check className="w-4 h-4" />
              <span className="text-sm">SEO data saved successfully!</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-b border-red-200 p-3 flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingSeo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : !seoData && postSlug ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No SEO data found</p>
                <button
                  onClick={fetchSeoData}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Retry
                </button>
              </div>
            ) : seoData ? (
              <>
                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getCurrentValue('title')}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter meta title"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{seoData.title || 'Not set'}</p>
                  )}
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={getCurrentValue('description')}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter meta description"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{seoData.description || 'Not set'}</p>
                  )}
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canonical URL
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={getCurrentValue('canonical')}
                      onChange={(e) => handleInputChange('canonical', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/page"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded break-all">{seoData.canonical || 'Not set'}</p>
                  )}
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <>
                    {/* Robots Meta */}
                    {isEditing && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Robots Meta
                        </label>
                        <div className="space-y-2">
                          {['noindex', 'nofollow', 'noarchive', 'nosnippet', 'noimageindex'].map((robot) => (
                            <label key={robot} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editedData.robots?.[robot as keyof typeof seoData.robots] ?? seoData.robots?.[robot as keyof typeof seoData.robots] ?? false}
                                onChange={(e) => handleInputChange('robots', {
                                  ...(editedData.robots || seoData.robots),
                                  [robot]: e.target.checked
                                })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">{robot}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Open Graph Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OG Title
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={getCurrentValue('og_title')}
                          onChange={(e) => handleInputChange('og_title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Open Graph title"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{seoData.og_title || 'Not set'}</p>
                      )}
                    </div>

                    {/* Open Graph Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OG Description
                      </label>
                      {isEditing ? (
                        <textarea
                          value={getCurrentValue('og_description')}
                          onChange={(e) => handleInputChange('og_description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Open Graph description"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{seoData.og_description || 'Not set'}</p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No post selected for SEO editing</p>
                <p className="text-sm mt-2">Navigate to a post, page, or product to edit SEO</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {seoData && (
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit SEO
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

