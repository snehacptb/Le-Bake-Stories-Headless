/**
 * Cache Types and Interfaces
 * Defines the structure for cached WordPress and WooCommerce data
 */

export interface CachedSiteInfo {
  title: string
  description: string
  logo: {
    url: string
    width: number
    height: number
    alt: string
  } | null
  siteIcon: {
    url: string
    width: number
    height: number
    alt: string
  } | null
  lastUpdated: string
}

export interface CachedMenu {
  id: number
  name: string
  slug: string
  location: string
  items: CachedMenuItem[]
  lastUpdated: string
}

export interface CachedMenuItem {
  id: number
  title: string
  url: string
  target: string
  parent: number
  order: number
  children?: CachedMenuItem[]
}

export interface CachedProduct {
  id: number
  name: string
  slug: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  featured: boolean
  status: string
  short_description: string
  description: string
  images: Array<{
    id: number
    src: string
    alt: string
    name: string
  }>
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  attributes: Array<{
    id: number
    name: string
    options: string[]
  }>
  variations: Array<{
    id: number
    price: string
    regular_price: string
    sale_price: string
    on_sale: boolean
    attributes: Array<{
      id: number
      name: string
      option: string
    }>
  }>
  stock_status: string
  stock_quantity: number | null
  lastUpdated: string
}

export interface CachedProductCategory {
  id: number
  name: string
  slug: string
  description: string
  parent: number
  count: number
  image: {
    id: number
    src: string
    alt: string
  } | null
  lastUpdated: string
}

export interface CachedPage {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  status: string
  parent: number
  menu_order: number
  lastUpdated: string
}

export interface CachedPost {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  status: string
  date: string
  modified: string
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  featured_media: {
    id: number
    src: string
    alt: string
  } | null
  lastUpdated: string
}

export interface CacheMetadata {
  lastFullRefresh: string
  lastPartialRefresh: string
  totalItems: number
  version: string
  checksum: string
}

export interface CacheConfig {
  enableCaching: boolean
  cacheExpiry: number // in minutes
  enableWebhooks: boolean
  webhookSecret: string
  autoRefresh: boolean
  refreshInterval: number // in minutes
}

export interface WebhookPayload {
  action: 'created' | 'updated' | 'deleted' | 'test'
  type: 'product' | 'category' | 'page' | 'post' | 'menu' | 'test'
  id: number
  data?: any
  timestamp?: string
}

export interface CacheStats {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  lastRefresh: string
  memoryUsage: number
  hitRate: number
}
