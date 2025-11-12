import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClientLayout } from '@/components/themes/client-layout'
import { SingleProductPage } from '@/components/themes/single-product-page'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { WooCommerceProduct } from '@/types'

interface ProductPageProps {
  params: {
    slug: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await getProduct(params.slug)
    
    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.'
      }
    }

    const price = product.sale_price || product.regular_price || product.price
    const currency = 'INR' // You can make this dynamic based on your store settings

    return {
      title: `${product.name} - Buy Online`,
      description: product.short_description || product.description.substring(0, 160),
      keywords: product.tags?.map(tag => tag.name).join(', '),
      openGraph: {
        title: product.name,
        description: product.short_description || product.description.substring(0, 160),
        images: product.images?.map(image => ({
          url: image.src,
          width: 800,
          height: 600,
          alt: image.alt || product.name,
        })) || [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.short_description || product.description.substring(0, 160),
        images: product.images?.[0]?.src ? [product.images[0].src] : [],
      },
      other: {
        'product:price:amount': price,
        'product:price:currency': currency,
        'product:availability': product.stock_status === 'instock' ? 'in stock' : 'out of stock',
        'product:condition': 'new',
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Product',
      description: 'Product page'
    }
  }
}

// Fetch product data
async function getProduct(slug: string): Promise<WooCommerceProduct | null> {
  try {
    // Use the new API route that doesn't conflict with existing routes
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products/by-slug/${slug}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    
    if (response.ok) {
      const { success, data } = await response.json()
      if (success && data) {
        return data
      }
    }

    // Fallback to direct API call if the route fails
    const products = await woocommerceApi.getProducts({ slug })
    return products.length > 0 ? products[0] : null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Fetch related products
async function getRelatedProducts(productId: number, categoryIds: number[]): Promise<WooCommerceProduct[]> {
  try {
    // Get products from the same categories
    const relatedProducts = await woocommerceApi.getProducts({
      category: categoryIds.join(','),
      exclude: [productId],
      per_page: 4,
      orderby: 'popularity'
    })
    
    return relatedProducts
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  // Get related products
  const categoryIds = product.categories?.map(cat => cat.id) || []
  const relatedProducts = await getRelatedProducts(product.id, categoryIds)

  return (
    <ClientLayout>
      <SingleProductPage 
        product={product} 
        relatedProducts={relatedProducts}
      />
    </ClientLayout>
  )
}

// Generate static params for better performance (optional)
export async function generateStaticParams() {
  try {
    // Get popular products for static generation
    const products = await woocommerceApi.getProducts({
      per_page: 50,
      orderby: 'popularity'
    })

    return products.map((product) => ({
      slug: product.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}
