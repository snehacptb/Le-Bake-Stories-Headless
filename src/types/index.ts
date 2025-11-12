// WordPress & WooCommerce Types
export interface SiteInfo {
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
}

export interface WordPressPost {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  ping_status: string
  sticky: boolean
  template: string
  format: string
  meta: any[]
  categories: number[]
  tags: number[]
  acf?: any
  _links: any
}

export interface WordPressPage {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  ping_status: string
  template: string
  parent: number
  menu_order: number
  acf?: any
  _links: any
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      id: number
      source_url: string
      alt_text: string
      media_details: {
        width: number
        height: number
      }
    }>
  }
}

export interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  permalink: string
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  type: 'simple' | 'grouped' | 'external' | 'variable'
  status: 'draft' | 'pending' | 'private' | 'publish'
  featured: boolean
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden'
  description: string
  short_description: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  date_on_sale_from: string | null
  date_on_sale_from_gmt: string | null
  date_on_sale_to: string | null
  date_on_sale_to_gmt: string | null
  on_sale: boolean
  purchasable: boolean
  total_sales: number
  virtual: boolean
  downloadable: boolean
  downloads: any[]
  download_limit: number
  download_expiry: number
  external_url: string
  button_text: string
  tax_status: 'taxable' | 'shipping' | 'none'
  tax_class: string
  manage_stock: boolean
  stock_quantity: number | null
  backorders: 'no' | 'notify' | 'yes'
  backorders_allowed: boolean
  backordered: boolean
  low_stock_amount: number | null
  sold_individually: boolean
  weight: string
  dimensions: {
    length: string
    width: string
    height: string
  }
  shipping_required: boolean
  shipping_taxable: boolean
  shipping_class: string
  shipping_class_id: number
  reviews_allowed: boolean
  average_rating: string
  rating_count: number
  upsell_ids: number[]
  cross_sell_ids: number[]
  parent_id: number
  purchase_note: string
  categories: ProductCategory[]
  tags: ProductTag[]
  images: ProductImage[]
  attributes: ProductAttribute[]
  default_attributes: any[]
  variations: number[]
  grouped_products: number[]
  menu_order: number
  price_html: string
  related_ids: number[]
  meta_data: any[]
  stock_status: 'instock' | 'outofstock' | 'onbackorder'
  has_options: boolean
  _links: any
}

export interface ProductCategory {
  id: number
  name: string
  slug: string
}

export interface ProductTag {
  id: number
  name: string
  slug: string
}

export interface ProductImage {
  id: number
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  src: string
  name: string
  alt: string
}

export interface ProductAttribute {
  id: number
  name: string
  position: number
  visible: boolean
  variation: boolean
  options: string[]
}

export interface CartItem {
  key: string
  id: number
  quantity: number
  name: string
  price: number
  image: string
  slug: string
}

export interface Customer {
  id: number
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  email: string
  first_name: string
  last_name: string
  role: string
  username: string
  billing: CustomerAddress
  shipping: CustomerAddress
  is_paying_customer: boolean
  avatar_url: string
  meta_data: any[]
  _links: any
}

export interface CustomerAddress {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  state: string
  postcode: string
  country: string
  email?: string
  phone?: string
}

export interface Order {
  id: number
  parent_id: number
  status: string
  currency: string
  version: string
  prices_include_tax: boolean
  date_created: string
  date_modified: string
  discount_total: string
  discount_tax: string
  shipping_total: string
  shipping_tax: string
  cart_tax: string
  total: string
  total_tax: string
  customer_id: number
  order_key: string
  billing: CustomerAddress
  shipping: CustomerAddress
  payment_method: string
  payment_method_title: string
  transaction_id: string
  customer_ip_address: string
  customer_user_agent: string
  created_via: string
  customer_note: string
  date_completed: string | null
  date_paid: string | null
  cart_hash: string
  number: string
  meta_data: any[]
  line_items: OrderLineItem[]
  tax_lines: any[]
  shipping_lines: any[]
  fee_lines: any[]
  coupon_lines: any[]
  refunds: any[]
  payment_url: string
  is_editable: boolean
  needs_payment: boolean
  needs_processing: boolean
  date_created_gmt: string
  date_modified_gmt: string
  date_completed_gmt: string | null
  date_paid_gmt: string | null
  currency_symbol: string
  _links: any
}

export interface OrderLineItem {
  id: number
  name: string
  product_id: number
  variation_id: number
  quantity: number
  tax_class: string
  subtotal: string
  subtotal_tax: string
  total: string
  total_tax: string
  taxes: any[]
  meta_data: any[]
  sku: string
  price: number
  image: {
    id: string
    src: string
  }
  parent_name: string | null
}

// UI Component Types
export interface NavigationItem {
  label: string
  href: string
  children?: NavigationItem[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface SEOData {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
}

// API Response Types
export interface APIResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Product Filters
export interface ProductFilters {
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  onSale?: boolean
  featured?: boolean
  inStock?: boolean
  rating?: number
}

// Form Types
export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface ContactFormSubmissionResponse {
  success: boolean
  message: string
  data?: any
}

// Testimonial Types
export interface Testimonial {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  ping_status: string
  sticky: boolean
  template: string
  format: string
  meta: any[]
  categories: number[]
  tags: number[]
  acf?: {
    role?: string
    [key: string]: any
  }
  _links: any
  // Processed fields for easier access
  name?: string
  role?: string
  comment?: string
  avatar?: string
}

export interface CheckoutFormData {
  billing: CustomerAddress
  shipping: CustomerAddress
  paymentMethod: string
  orderNotes?: string
}

// Coupon Types
export interface WooCommerceCoupon {
  id: number
  code: string
  amount: string
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product'
  description: string
  date_expires: string | null
  date_expires_gmt: string | null
  usage_count: number
  individual_use: boolean
  product_ids: number[]
  excluded_product_ids: number[]
  usage_limit: number | null
  usage_limit_per_user: number | null
  limit_usage_to_x_items: number | null
  free_shipping: boolean
  product_categories: number[]
  excluded_product_categories: number[]
  exclude_sale_items: boolean
  minimum_amount: string
  maximum_amount: string
  email_restrictions: string[]
  used_by: string[]
  meta_data: any[]
  _links: any
}

export interface AppliedCoupon {
  code: string
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product'
  amount: string
  discount_total: number
  discount_tax: number
}

export interface CouponValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
  coupon?: WooCommerceCoupon
}

export interface CartTotals {
  subtotal: number
  discountTotal: number
  taxTotal: number
  shippingTotal: number
  total: number
}

// Filter Types
export interface ProductFilters {
  category?: string
  tag?: string
  minPrice?: number
  maxPrice?: number
  onSale?: boolean
  featured?: boolean
  search?: string
  sortBy?: 'date' | 'price' | 'popularity' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

// Banner Types
export interface BannerButton {
  text: string
  link: string
}

export interface BannerImage {
  full: string
  large: string
  medium: string
  thumbnail: string
  alt: string
}

export interface Banner {
  id: number
  subtitle: string
  title: string
  button1: BannerButton
  button2: BannerButton
  image: BannerImage
  order: number
  status: 'active' | 'inactive'
}
