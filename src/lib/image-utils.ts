/**
 * Image Utilities
 * Helper functions for working with cached images
 */

import { imageCacheService } from './image-cache-service'

/**
 * Transform product images to use cached versions
 */
export async function transformProductImages(products: any[]): Promise<any[]> {
  if (!products || !Array.isArray(products)) {
    return products
  }

  const transformedProducts = await Promise.all(
    products.map(async (product) => {
      if (!product) return product

      const transformedProduct = { ...product }

      // Transform product images array
      if (product.images && Array.isArray(product.images)) {
        transformedProduct.images = await Promise.all(
          product.images.map(async (image: any) => {
            if (!image || !image.src) return image

            try {
              const cachedUrl = await imageCacheService.getCachedImageUrl(image.src)
              return {
                ...image,
                src: cachedUrl,
                original_src: image.src // Keep original URL as backup
              }
            } catch (error) {
              console.error('Error transforming image:', error)
              return image // Return original if transformation fails
            }
          })
        )
      }

      // Transform featured image if exists
      if (product.featured_image) {
        try {
          const cachedUrl = await imageCacheService.getCachedImageUrl(product.featured_image)
          transformedProduct.featured_image = cachedUrl
          transformedProduct.original_featured_image = product.featured_image
        } catch (error) {
          console.error('Error transforming featured image:', error)
        }
      }

      // Transform category images if they exist
      if (product.categories && Array.isArray(product.categories)) {
        transformedProduct.categories = await Promise.all(
          product.categories.map(async (category: any) => {
            if (!category || !category.image?.src) return category

            try {
              const cachedUrl = await imageCacheService.getCachedImageUrl(category.image.src)
              return {
                ...category,
                image: {
                  ...category.image,
                  src: cachedUrl,
                  original_src: category.image.src
                }
              }
            } catch (error) {
              console.error('Error transforming category image:', error)
              return category
            }
          })
        )
      }

      return transformedProduct
    })
  )

  return transformedProducts
}

/**
 * Transform a single image URL to use cached version
 */
export async function transformImageUrl(imageUrl: string): Promise<string> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl
  }

  try {
    return await imageCacheService.getCachedImageUrl(imageUrl)
  } catch (error) {
    console.error('Error transforming image URL:', error)
    return imageUrl // Return original if transformation fails
  }
}

/**
 * Transform blog post images to use cached versions
 */
export async function transformPostImages(posts: any[]): Promise<any[]> {
  if (!posts || !Array.isArray(posts)) {
    return posts
  }

  const transformedPosts = await Promise.all(
    posts.map(async (post) => {
      if (!post) return post

      const transformedPost = { ...post }

      // Transform featured image
      if (post.featured_image) {
        try {
          const cachedUrl = await imageCacheService.getCachedImageUrl(post.featured_image)
          transformedPost.featured_image = cachedUrl
          transformedPost.original_featured_image = post.featured_image
        } catch (error) {
          console.error('Error transforming post featured image:', error)
        }
      }

      // Transform images in content (basic regex replacement)
      if (post.content && typeof post.content === 'string') {
        try {
          // Find all image URLs in content
          const imageRegex = /<img[^>]+src="([^"]+)"/g
          let match
          const imageUrls: string[] = []

          while ((match = imageRegex.exec(post.content)) !== null) {
            imageUrls.push(match[1])
          }

          // Transform each found image URL
          let transformedContent = post.content
          for (const imageUrl of imageUrls) {
            try {
              const cachedUrl = await imageCacheService.getCachedImageUrl(imageUrl)
              transformedContent = transformedContent.replace(imageUrl, cachedUrl)
            } catch (error) {
              console.error('Error transforming content image:', error)
            }
          }

          transformedPost.content = transformedContent
        } catch (error) {
          console.error('Error transforming post content images:', error)
        }
      }

      return transformedPost
    })
  )

  return transformedPosts
}

/**
 * Transform category images to use cached versions
 */
export async function transformCategoryImages(categories: any[]): Promise<any[]> {
  if (!categories || !Array.isArray(categories)) {
    return categories
  }

  const transformedCategories = await Promise.all(
    categories.map(async (category) => {
      if (!category) return category

      const transformedCategory = { ...category }

      // Transform category image
      if (category.image?.src) {
        try {
          const cachedUrl = await imageCacheService.getCachedImageUrl(category.image.src)
          transformedCategory.image = {
            ...category.image,
            src: cachedUrl,
            original_src: category.image.src
          }
        } catch (error) {
          console.error('Error transforming category image:', error)
        }
      }

      return transformedCategory
    })
  )

  return transformedCategories
}
