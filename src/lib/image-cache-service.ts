/**
 * Image Cache Service
 * Downloads and caches images from WordPress locally
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import https from 'https'
import http from 'http'

export interface CachedImage {
  originalUrl: string
  localPath: string
  filename: string
  size: number
  mimeType: string
  width?: number
  height?: number
  downloadedAt: string
  lastAccessed: string
}

export interface ImageCacheStats {
  totalImages: number
  totalSize: number
  cacheHits: number
  cacheMisses: number
  downloadErrors: number
  lastCleanup: string
}

class ImageCacheService {
  private cacheDir: string
  private imagesDir: string
  private metadataFile: string
  private statsFile: string
  private imageCache: Map<string, CachedImage> = new Map()
  private stats: ImageCacheStats

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.next', 'cache', 'images')
    this.imagesDir = path.join(this.cacheDir, 'files')
    this.metadataFile = path.join(this.cacheDir, 'metadata.json')
    this.statsFile = path.join(this.cacheDir, 'stats.json')
    this.stats = {
      totalImages: 0,
      totalSize: 0,
      cacheHits: 0,
      cacheMisses: 0,
      downloadErrors: 0,
      lastCleanup: new Date().toISOString()
    }
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.imagesDir, { recursive: true })
    } catch (error) {
      console.error('Error creating image cache directory:', error)
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const metadataExists = await fs.access(this.metadataFile).then(() => true).catch(() => false)
      if (metadataExists) {
        const metadata = await fs.readFile(this.metadataFile, 'utf-8')
        const cachedImages: CachedImage[] = JSON.parse(metadata)
        
        for (const image of cachedImages) {
          this.imageCache.set(image.originalUrl, image)
        }
        
        console.log(`Loaded ${cachedImages.length} cached images`)
      }

      const statsExists = await fs.access(this.statsFile).then(() => true).catch(() => false)
      if (statsExists) {
        const statsData = await fs.readFile(this.statsFile, 'utf-8')
        this.stats = { ...this.stats, ...JSON.parse(statsData) }
      }
    } catch (error) {
      console.error('Error loading image cache:', error)
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cachedImages = Array.from(this.imageCache.values())
      await fs.writeFile(this.metadataFile, JSON.stringify(cachedImages, null, 2))
      await fs.writeFile(this.statsFile, JSON.stringify(this.stats, null, 2))
    } catch (error) {
      console.error('Error saving image cache:', error)
    }
  }

  private generateFilename(url: string): string {
    const urlHash = crypto.createHash('md5').update(url).digest('hex')
    const extension = path.extname(new URL(url).pathname) || '.jpg'
    return `${urlHash}${extension}`
  }

  private async downloadImage(url: string): Promise<CachedImage | null> {
    return new Promise((resolve) => {
      try {
        const filename = this.generateFilename(url)
        const localPath = path.join(this.imagesDir, filename)
        const file = fs.open(localPath, 'w')

        const client = url.startsWith('https:') ? https : http
        
        // Create agent that ignores SSL certificates for local development
        const agent = url.startsWith('https:') ? new https.Agent({
          rejectUnauthorized: false
        }) : undefined

        const request = client.get(url, { agent }, (response) => {
          if (response.statusCode !== 200) {
            console.error(`Failed to download image: ${url} - Status: ${response.statusCode}`)
            this.stats.downloadErrors++
            resolve(null)
            return
          }

          let size = 0
          const chunks: Buffer[] = []

          response.on('data', (chunk) => {
            chunks.push(chunk)
            size += chunk.length
          })

          response.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks)
              await fs.writeFile(localPath, buffer)

              const cachedImage: CachedImage = {
                originalUrl: url,
                localPath,
                filename,
                size,
                mimeType: response.headers['content-type'] || 'image/jpeg',
                downloadedAt: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
              }

              this.imageCache.set(url, cachedImage)
              this.stats.totalImages++
              this.stats.totalSize += size

              console.log(`Downloaded and cached image: ${filename} (${size} bytes)`)
              resolve(cachedImage)
            } catch (error) {
              console.error(`Error saving image ${filename}:`, error)
              this.stats.downloadErrors++
              resolve(null)
            }
          })
        })

        request.on('error', (error) => {
          console.error(`Error downloading image ${url}:`, error)
          this.stats.downloadErrors++
          resolve(null)
        })

        request.setTimeout(30000, () => {
          request.destroy()
          console.error(`Timeout downloading image: ${url}`)
          this.stats.downloadErrors++
          resolve(null)
        })

      } catch (error) {
        console.error(`Error setting up download for ${url}:`, error)
        this.stats.downloadErrors++
        resolve(null)
      }
    })
  }

  async getCachedImageUrl(originalUrl: string): Promise<string> {
    if (!originalUrl || typeof originalUrl !== 'string') {
      return originalUrl
    }

    // Skip non-image URLs
    if (!originalUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i)) {
      return originalUrl
    }

    // Skip external URLs that are not from WordPress
    if (!originalUrl.includes('manila.esdemo.in') && 
        !originalUrl.includes('headless-wp.local') &&
        !originalUrl.includes('localhost')) {
      return originalUrl
    }

    await this.ensureCacheDir()
    await this.loadCache()

    const cachedImage = this.imageCache.get(originalUrl)
    
    if (cachedImage) {
      // Check if cached file still exists
      try {
        await fs.access(cachedImage.localPath)
        
        // Update last accessed time
        cachedImage.lastAccessed = new Date().toISOString()
        this.imageCache.set(originalUrl, cachedImage)
        this.stats.cacheHits++
        
        // Return local URL
        return `/api/images/${cachedImage.filename}`
      } catch {
        // File doesn't exist, remove from cache
        this.imageCache.delete(originalUrl)
      }
    }

    // Download and cache the image
    this.stats.cacheMisses++
    const newCachedImage = await this.downloadImage(originalUrl)
    
    if (newCachedImage) {
      await this.saveCache()
      return `/api/images/${newCachedImage.filename}`
    }

    // Fallback to original URL if download failed
    return originalUrl
  }

  async cacheProductImages(products: any[]): Promise<void> {
    console.log(`Starting to cache images for ${products.length} products...`)
    
    const imageUrls = new Set<string>()
    
    // Collect all unique image URLs
    for (const product of products) {
      if (product.images && Array.isArray(product.images)) {
        for (const image of product.images) {
          if (image.src) {
            imageUrls.add(image.src)
          }
        }
      }
      
      // Also cache featured image if exists
      if (product.featured_image) {
        imageUrls.add(product.featured_image)
      }
    }

    console.log(`Found ${imageUrls.size} unique images to cache`)

    // Cache images in batches to avoid overwhelming the server
    const batchSize = 5
    const urls = Array.from(imageUrls)
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      const promises = batch.map(url => this.getCachedImageUrl(url))
      
      await Promise.allSettled(promises)
      
      // Small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    await this.saveCache()
    console.log(`Image caching completed. Total cached: ${this.stats.totalImages}`)
  }

  async getImageFile(filename: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      const filePath = path.join(this.imagesDir, filename)
      const buffer = await fs.readFile(filePath)
      
      // Find the cached image to get mime type
      const cachedImage = Array.from(this.imageCache.values())
        .find(img => img.filename === filename)
      
      const mimeType = cachedImage?.mimeType || 'image/jpeg'
      
      return { buffer, mimeType }
    } catch (error) {
      console.error(`Error reading cached image ${filename}:`, error)
      return null
    }
  }

  async getStats(): Promise<ImageCacheStats> {
    return { ...this.stats }
  }

  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    console.log('Starting image cache cleanup...')
    
    const now = new Date().getTime()
    let deletedCount = 0
    let freedSpace = 0

    const entries = Array.from(this.imageCache.entries())
    for (const [url, image] of entries) {
      const lastAccessed = new Date(image.lastAccessed).getTime()
      
      if (now - lastAccessed > maxAge) {
        try {
          await fs.unlink(image.localPath)
          this.imageCache.delete(url)
          deletedCount++
          freedSpace += image.size
        } catch (error) {
          console.error(`Error deleting cached image ${image.filename}:`, error)
        }
      }
    }

    this.stats.totalImages -= deletedCount
    this.stats.totalSize -= freedSpace
    this.stats.lastCleanup = new Date().toISOString()

    await this.saveCache()
    
    console.log(`Image cache cleanup completed. Deleted ${deletedCount} images, freed ${freedSpace} bytes`)
  }
}

export const imageCacheService = new ImageCacheService()
