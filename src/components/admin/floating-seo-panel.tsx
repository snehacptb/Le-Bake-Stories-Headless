'use client'

/**
 * Floating SEO Panel - WordPress Style
 * Complete SEOPress metabox with all fields
 * Simple WordPress admin interface (no fancy styling)
 */

import { useState, useEffect } from 'react'
import { X, Edit, ExternalLink, Loader2, Save } from 'lucide-react'
import { useAdminAuth } from '@/hooks/use-admin-auth'

interface FloatingSEOPanelProps {
  postId?: number
  postSlug?: string
  postType?: 'post' | 'page' | 'product'
  mode?: 'new-tab' | 'modal'
}

interface SEOFormData {
  // Titles & Metas
  title: string
  description: string

  // Advanced
  canonical: string
  robots: {
    noindex: boolean
    nofollow: boolean
    noimageindex: boolean
    noarchive: boolean
    nosnippet: boolean
  }

  // Social - Facebook/OpenGraph
  og_title: string
  og_description: string
  og_image: string

  // Social - Twitter
  twitter_title: string
  twitter_description: string
  twitter_image: string

  // Redirections
  redirect_enabled: boolean
  redirect_type: string
  redirect_url: string
}

export function FloatingSEOPanel({
  postId,
  postSlug,
  postType = 'post',
  mode = 'modal',
}: FloatingSEOPanelProps) {
  const { isAdmin, canEditPosts, isLoading: isAuthLoading } = useAdminAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'titles' | 'social' | 'advanced'>('titles')

  const [seoData, setSeoData] = useState<SEOFormData>({
    title: '',
    description: '',
    canonical: '',
    robots: {
      noindex: false,
      nofollow: false,
      noimageindex: false,
      noarchive: false,
      nosnippet: false,
    },
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    redirect_enabled: false,
    redirect_type: '301',
    redirect_url: '',
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const buildEditUrl = () => {
    if (!postId) return null
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
    const baseUrl = wpUrl.replace('/wp-json/wp/v2', '').replace('/wp/v2', '')
    return `${baseUrl}/wp-admin/post.php?post=${postId}&action=edit`
  }

  const fetchSEOData = async () => {
    setIsLoadingData(true)
    setError(null)

    try {
      // Build API URL with postId (preferred) or slug (fallback)
      let apiUrl = '/api/seo/get?'
      if (postId) {
        apiUrl += `postId=${postId}&type=${postType}`
      } else if (postSlug) {
        apiUrl += `slug=${postSlug}&type=${postType}`
      } else {
        throw new Error('No post ID or slug available')
      }

      const response = await fetch(apiUrl)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to fetch SEO data')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setSeoData({
          title: data.data.title || '',
          description: data.data.description || '',
          canonical: data.data.canonical || '',
          robots: {
            noindex: data.data.robots?.noindex || false,
            nofollow: data.data.robots?.nofollow || false,
            noimageindex: data.data.robots?.noimageindex || false,
            noarchive: data.data.robots?.noarchive || false,
            nosnippet: data.data.robots?.nosnippet || false,
          },
          og_title: data.data.og_title || '',
          og_description: data.data.og_description || '',
          og_image: data.data.og_image || '',
          twitter_title: data.data.twitter_title || '',
          twitter_description: data.data.twitter_description || '',
          twitter_image: data.data.twitter_image || '',
          redirect_enabled: data.data.redirect_enabled || false,
          redirect_type: data.data.redirect_type || '301',
          redirect_url: data.data.redirect_url || '',
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      console.error('Error fetching SEO data:', err)
      setError(err.message)
    } finally {
      setIsLoadingData(false)
    }
  }

  const saveSEOData = async () => {
    if (!postId) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const token = localStorage.getItem('wc-auth-token')

      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/seo/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          ...seoData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update SEO data')
      }

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('SEO updated successfully!')

        setTimeout(() => {
          setIsModalOpen(false)
          window.location.reload()
        }, 1500)
      } else {
        throw new Error(result.message || 'Update failed')
      }
    } catch (err: any) {
      console.error('Error saving SEO data:', err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenModal = () => {
    if (!postId) {
      setError('No post available for editing')
      return
    }

    if (mode === 'new-tab') {
      const url = buildEditUrl()
      if (url) {
        window.open(url, '_blank')
      }
    } else {
      setIsModalOpen(true)
      fetchSEOData()
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setError(null)
    setSuccessMessage(null)
  }

  const handleOpenInWordPress = () => {
    const url = buildEditUrl()
    if (url) {
      window.open(url, '_blank')
    }
  }

  if (!isMounted) {
    return null
  }

  if (isAuthLoading || (!isAdmin && !canEditPosts)) {
    return null
  }

  // Need postId to edit SEO (required for save functionality)
  if (!postId) {
    return null
  }

  return (
    <>
      {/* Floating Button - WordPress Admin Style */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 z-50 bg-[#2271b1] hover:bg-[#135e96] text-white rounded shadow-lg px-4 py-3 flex items-center gap-2 transition-colors"
        title="Edit SEO"
      >
        <Edit className="w-4 h-4" />
        <span className="text-sm font-medium">SEO</span>
      </button>

      {/* Modal - WordPress Admin Style */}
      {mode === 'modal' && isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header - WordPress Style */}
            <div className="bg-[#f0f0f1] border-b border-[#c3c4c7] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#2271b1]" />
                <h2 className="text-lg font-semibold text-[#1d2327]">SEOPress</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenInWordPress}
                  className="text-[#2271b1] hover:text-[#135e96] p-1"
                  title="Open in WordPress"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCloseModal}
                  className="text-[#50575e] hover:text-[#1d2327] p-1"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs - WordPress Style */}
            <div className="bg-[#f0f0f1] border-b border-[#c3c4c7]">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('titles')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'titles'
                      ? 'border-[#2271b1] text-[#2271b1] bg-white'
                      : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
                  }`}
                >
                  Titles & Metas
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'social'
                      ? 'border-[#2271b1] text-[#2271b1] bg-white'
                      : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
                  }`}
                >
                  Social Networks
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'advanced'
                      ? 'border-[#2271b1] text-[#2271b1] bg-white'
                      : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mx-4 mt-4 p-3 bg-[#fcf0f1] border border-[#c3393a] text-[#1d2327] text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            {successMessage && (
              <div className="mx-4 mt-4 p-3 bg-[#f0f6fc] border border-[#2271b1] text-[#1d2327] text-sm">
                {successMessage}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2271b1]" />
                </div>
              ) : (
                <>
                  {/* Titles & Metas Tab */}
                  {activeTab === 'titles' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1d2327] mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={seoData.title}
                          onChange={(e) => setSeoData({ ...seoData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                        />
                        <p className="text-xs text-[#646970] mt-1">
                          {seoData.title.length} characters - 60 recommended
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#1d2327] mb-1">
                          Meta description
                        </label>
                        <textarea
                          value={seoData.description}
                          onChange={(e) => setSeoData({ ...seoData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                        />
                        <p className="text-xs text-[#646970] mt-1">
                          {seoData.description.length} characters - 160 recommended
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Social Networks Tab */}
                  {activeTab === 'social' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-[#1d2327] mb-3">Facebook (Open Graph)</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-[#1d2327] mb-1">
                              OG Title
                            </label>
                            <input
                              type="text"
                              value={seoData.og_title}
                              onChange={(e) => setSeoData({ ...seoData, og_title: e.target.value })}
                              className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-[#1d2327] mb-1">
                              OG Description
                            </label>
                            <textarea
                              value={seoData.og_description}
                              onChange={(e) => setSeoData({ ...seoData, og_description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-[#1d2327] mb-1">
                              OG Image URL
                            </label>
                            <input
                              type="url"
                              value={seoData.og_image}
                              onChange={(e) => setSeoData({ ...seoData, og_image: e.target.value })}
                              className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-[#1d2327] mb-3">Twitter</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-[#1d2327] mb-1">
                              Twitter Title
                            </label>
                            <input
                              type="text"
                              value={seoData.twitter_title}
                              onChange={(e) => setSeoData({ ...seoData, twitter_title: e.target.value })}
                              className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-[#1d2327] mb-1">
                              Twitter Description
                            </label>
                            <textarea
                              value={seoData.twitter_description}
                              onChange={(e) => setSeoData({ ...seoData, twitter_description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-[#1d2327] mb-1">
                              Twitter Image URL
                            </label>
                            <input
                              type="url"
                              value={seoData.twitter_image}
                              onChange={(e) => setSeoData({ ...seoData, twitter_image: e.target.value })}
                              className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advanced Tab */}
                  {activeTab === 'advanced' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-[#1d2327] mb-3">Canonical URL</h3>
                        <input
                          type="url"
                          value={seoData.canonical}
                          onChange={(e) => setSeoData({ ...seoData, canonical: e.target.value })}
                          className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                          placeholder="https://example.com/page"
                        />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-[#1d2327] mb-3">Robots Meta</h3>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seoData.robots.noindex}
                              onChange={(e) => setSeoData({
                                ...seoData,
                                robots: { ...seoData.robots, noindex: e.target.checked }
                              })}
                              className="rounded border-[#8c8f94]"
                            />
                            <span className="text-sm text-[#1d2327]">Do not display this page in search engines results (noindex)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seoData.robots.nofollow}
                              onChange={(e) => setSeoData({
                                ...seoData,
                                robots: { ...seoData.robots, nofollow: e.target.checked }
                              })}
                              className="rounded border-[#8c8f94]"
                            />
                            <span className="text-sm text-[#1d2327]">Do not follow links from this page (nofollow)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seoData.robots.noimageindex}
                              onChange={(e) => setSeoData({
                                ...seoData,
                                robots: { ...seoData.robots, noimageindex: e.target.checked }
                              })}
                              className="rounded border-[#8c8f94]"
                            />
                            <span className="text-sm text-[#1d2327]">Do not index images from this page (noimageindex)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seoData.robots.noarchive}
                              onChange={(e) => setSeoData({
                                ...seoData,
                                robots: { ...seoData.robots, noarchive: e.target.checked }
                              })}
                              className="rounded border-[#8c8f94]"
                            />
                            <span className="text-sm text-[#1d2327]">Do not display a "Cached" link in search results (noarchive)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seoData.robots.nosnippet}
                              onChange={(e) => setSeoData({
                                ...seoData,
                                robots: { ...seoData.robots, nosnippet: e.target.checked }
                              })}
                              className="rounded border-[#8c8f94]"
                            />
                            <span className="text-sm text-[#1d2327]">Do not display a description in search results (nosnippet)</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-[#1d2327] mb-3">Redirections</h3>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seoData.redirect_enabled}
                              onChange={(e) => setSeoData({ ...seoData, redirect_enabled: e.target.checked })}
                              className="rounded border-[#8c8f94]"
                            />
                            <span className="text-sm text-[#1d2327]">Enable redirection</span>
                          </label>
                          {seoData.redirect_enabled && (
                            <>
                              <div>
                                <label className="block text-sm text-[#1d2327] mb-1">
                                  Redirect type
                                </label>
                                <select
                                  value={seoData.redirect_type}
                                  onChange={(e) => setSeoData({ ...seoData, redirect_type: e.target.value })}
                                  className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                                >
                                  <option value="301">301 Moved Permanently</option>
                                  <option value="302">302 Found</option>
                                  <option value="307">307 Temporary Redirect</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm text-[#1d2327] mb-1">
                                  Redirect URL
                                </label>
                                <input
                                  type="url"
                                  value={seoData.redirect_url}
                                  onChange={(e) => setSeoData({ ...seoData, redirect_url: e.target.value })}
                                  className="w-full px-3 py-2 border border-[#8c8f94] rounded text-sm focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                                  placeholder="https://example.com/new-page"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#f0f0f1] border-t border-[#c3c4c7] p-4 flex items-center justify-between">
              <button
                onClick={handleOpenInWordPress}
                className="text-sm text-[#2271b1] hover:text-[#135e96] flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Edit in WordPress
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-[#2c3338] border border-[#2c3338] rounded hover:bg-[#f6f7f7]"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSEOData}
                  disabled={isSaving || isLoadingData}
                  className="px-4 py-2 text-sm text-white bg-[#2271b1] rounded hover:bg-[#135e96] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
