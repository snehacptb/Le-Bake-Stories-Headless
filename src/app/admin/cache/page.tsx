'use client'

import { useState, useEffect } from 'react'

interface ImageCacheStats {
  totalImages: number
  totalSize: number
  cacheHits: number
  cacheMisses: number
  downloadErrors: number
  lastCleanup: string
}

export default function CacheAdminPage() {
  const [stats, setStats] = useState<ImageCacheStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache/images?action=stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const cleanup = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/cache/images?action=cleanup')
      const data = await response.json()
      if (data.success) {
        setMessage('Cache cleanup completed successfully')
        await fetchStats()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Error performing cleanup')
      console.error('Error during cleanup:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeCache = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/cache/init?secret=' + process.env.NEXT_PUBLIC_CACHE_SECRET)
      const data = await response.json()
      if (data.success) {
        setMessage('Cache initialization completed successfully')
        await fetchStats()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Error initializing cache')
      console.error('Error during initialization:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cache Administration</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Image Cache Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Image Cache Statistics</h2>
            {stats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Images:</span>
                  <span className="font-medium">{stats.totalImages.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Size:</span>
                  <span className="font-medium">{formatBytes(stats.totalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Hits:</span>
                  <span className="font-medium text-green-600">{stats.cacheHits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Misses:</span>
                  <span className="font-medium text-yellow-600">{stats.cacheMisses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Download Errors:</span>
                  <span className="font-medium text-red-600">{stats.downloadErrors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Cleanup:</span>
                  <span className="font-medium">{formatDate(stats.lastCleanup)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Hit Rate:</span>
                  <span className="font-medium">
                    {stats.cacheHits + stats.cacheMisses > 0 
                      ? `${((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading stats...</div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Actions</h2>
            <div className="space-y-4">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Refresh Stats
              </button>
              
              <button
                onClick={initializeCache}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Initializing...' : 'Initialize Cache'}
              </button>
              
              <button
                onClick={cleanup}
                disabled={loading}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {loading ? 'Cleaning...' : 'Cleanup Old Images'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How Image Caching Works</h2>
          <div className="prose text-gray-600">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Automatic Caching:</strong> Images are automatically cached when products are fetched</li>
              <li><strong>Local Storage:</strong> Images are stored in <code>.next/cache/images/</code></li>
              <li><strong>Smart URLs:</strong> Cached images are served via <code>/api/images/[filename]</code></li>
              <li><strong>SSL Bypass:</strong> Downloads work even with self-signed certificates</li>
              <li><strong>Fallback:</strong> If caching fails, original URLs are used</li>
              <li><strong>Performance:</strong> Cached images load instantly and reduce WordPress server load</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
