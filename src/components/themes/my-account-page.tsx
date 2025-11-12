'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  Settings, 
  LogOut, 
  Eye, 
  Download,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Star,
  MessageCircle,
  RotateCcw,
  ArrowRight,
  Calendar,
  MapPinIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { useCart } from '@/contexts/cart-context'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { Order, CustomerAddress } from '@/types'
import { cn, formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

interface MyAccountPageProps {
  className?: string
}

export function MyAccountPage({ className }: MyAccountPageProps) {
  const { user, isAuthenticated, logout, updateProfile } = useAuth()
  const { getWishlistItems, removeFromWishlist, getWishlistCount } = useWishlist()
  const { addToCart, loadingStates } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingBilling, setEditingBilling] = useState(false)
  const [editingShipping, setEditingShipping] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  })

  const [billingForm, setBillingForm] = useState<CustomerAddress>(
    user?.billing || {
      first_name: '',
      last_name: '',
      company: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'US',
      email: '',
      phone: '',
    }
  )

  const [shippingForm, setShippingForm] = useState<CustomerAddress>(
    user?.shipping || {
      first_name: '',
      last_name: '',
      company: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'US',
    }
  )

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      })
      setBillingForm(user.billing)
      setShippingForm(user.shipping)
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { orders: fetchedOrders } = await woocommerceApi.getOrders(user.id, {
        per_page: 20,
        orderby: 'date',
        order: 'desc',
      })
      setOrders(fetchedOrders)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      await updateProfile(profileForm)
      setEditingProfile(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleBillingUpdate = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      await updateProfile({ billing: billingForm })
      setEditingBilling(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update billing address')
    } finally {
      setLoading(false)
    }
  }

  const handleShippingUpdate = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      await updateProfile({ shipping: shippingForm })
      setEditingShipping(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update shipping address')
    } finally {
      setLoading(false)
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'processing':
        return 'text-blue-600'
      case 'on-hold':
        return 'text-orange-600'
      case 'cancelled':
        return 'text-red-600'
      case 'refunded':
        return 'text-gray-600'
      case 'pending':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Delivered'
      case 'processing':
        return 'Shipped'
      case 'on-hold':
        return 'On Hold'
      case 'cancelled':
        return 'Cancelled'
      case 'refunded':
        return 'Refunded'
      case 'pending':
        return 'Order Confirmed'
      default:
        return 'Processing'
    }
  }

  const getDeliveryDate = (orderDate: string, status: string) => {
    const date = new Date(orderDate)
    if (status === 'completed') {
      return format(date, 'MMM dd, yyyy')
    } else if (status === 'processing') {
      date.setDate(date.getDate() + 3) // Add 3 days for delivery
      return format(date, 'MMM dd')
    }
    return null
  }

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <div className="text-center py-16">
          <User className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600 mb-8">
            You need to be logged in to access your account.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Log In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">Register</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600">
          Welcome back, {user?.first_name} {user?.last_name}!
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="logout" onClick={logout}>Logout</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <User className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">Account Details</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {user?.first_name} {user?.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {user?.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Member since:</strong> {user?.date_created && format(new Date(user.date_created), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <ShoppingBag className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold">Recent Orders</h3>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Total orders placed</p>
                {orders.length > 0 && orders[0]?.date_created && (
                  <p className="text-sm text-gray-600">
                    Last order: {format(new Date(orders[0].date_created), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Settings className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Edit Addresses
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders" className="mt-8">
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your orders...</p>
              </div>
            ) : orders.length > 0 ? (
              orders.filter(order => order && order.id).map((order) => {
                const orderDate = order.date_created ? format(new Date(order.date_created), 'dd MMM yyyy') : 'Date not available'
                const orderTotal = order.total ? parseFloat(order.total).toFixed(2) : '0.00'
                const orderStatus = order.status || 'pending'
                const statusText = getOrderStatusText(orderStatus)
                const deliveryDate = getDeliveryDate(order.date_created || '', orderStatus)
                
                return (
                  <motion.div 
                    key={order.id} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Order Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-600">Order placed</p>
                            <p className="font-medium text-gray-900">{orderDate}</p>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-medium text-gray-900">${orderTotal}</p>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <div>
                            <p className="text-sm text-gray-600">Ship to</p>
                            <p className="font-medium text-gray-900 truncate max-w-32">
                              {order.shipping?.first_name} {order.shipping?.last_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">ORDER # {order.number || order.id}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button variant="outline" size="sm" className="text-xs">
                              View order details
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs">
                              Invoice
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.line_items && order.line_items.length > 0 && (
                      <div className="p-4">
                        {order.line_items.map((item, index) => (
                          <div key={item.id || index} className="flex items-start space-x-4 py-4 border-b border-gray-100 last:border-b-0">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                {item.image?.src ? (
                                  <Image
                                    src={item.image.src}
                                    alt={item.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                                {item.name}
                              </h4>
                              {item.sku && (
                                <p className="text-sm text-gray-500 mb-2">SKU: {item.sku}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                <span>Qty: {item.quantity}</span>
                                <span>•</span>
                                <span className="font-medium text-gray-900">${parseFloat(item.total || '0').toFixed(2)}</span>
                              </div>
                              
                              {/* Status and Delivery Info */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    orderStatus === 'completed' ? 'bg-green-500' :
                                    orderStatus === 'processing' ? 'bg-blue-500' :
                                    orderStatus === 'cancelled' ? 'bg-red-500' :
                                    'bg-orange-500'
                                  }`}></div>
                                  <span className={`text-sm font-medium ${getOrderStatusColor(orderStatus)}`}>
                                    {statusText}
                                  </span>
                                  {deliveryDate && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-sm text-gray-600">
                                        {orderStatus === 'completed' ? 'Delivered on' : 'Expected by'} {deliveryDate}
                                      </span>
                                    </>
                                  )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2">
                                  {orderStatus === 'completed' && (
                                    <>
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <Star className="h-3 w-3 mr-1" />
                                        Rate & Review
                                      </Button>
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        Return
                                      </Button>
                                    </>
                                  )}
                                  {orderStatus === 'processing' && (
                                    <Button variant="outline" size="sm" className="text-xs">
                                      <Truck className="h-3 w-3 mr-1" />
                                      Track
                                    </Button>
                                  )}
                                  {orderStatus === 'cancelled' && (
                                    <Button variant="outline" size="sm" className="text-xs">
                                      <ShoppingBag className="h-3 w-3 mr-1" />
                                      Buy Again
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Order Summary Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                Delivered to {order.shipping?.city}, {order.shipping?.state}
                              </span>
                              {order.payment_method_title && (
                                <>
                                  <span>•</span>
                                  <span>Paid via {order.payment_method_title}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                                Need help?
                              </Button>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })
            ) : (
              <div className="bg-white rounded-lg p-12 text-center shadow-sm">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Looks like you haven't made your choice yet. Go ahead, explore our products and find something you like.
                </p>
                <Link href="/shop">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Addresses */}
        <TabsContent value="addresses" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Billing Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Billing Address</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingBilling(!editingBilling)}
                >
                  {editingBilling ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>

              {editingBilling ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing_first_name">First Name</Label>
                      <Input
                        id="billing_first_name"
                        value={billingForm.first_name}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_last_name">Last Name</Label>
                      <Input
                        id="billing_last_name"
                        value={billingForm.last_name}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billing_company">Company</Label>
                    <Input
                      id="billing_company"
                      value={billingForm.company}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_address_1">Address Line 1</Label>
                    <Input
                      id="billing_address_1"
                      value={billingForm.address_1}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, address_1: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_address_2">Address Line 2</Label>
                    <Input
                      id="billing_address_2"
                      value={billingForm.address_2}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, address_2: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing_city">City</Label>
                      <Input
                        id="billing_city"
                        value={billingForm.city}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_state">State</Label>
                      <Input
                        id="billing_state"
                        value={billingForm.state}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing_postcode">ZIP Code</Label>
                      <Input
                        id="billing_postcode"
                        value={billingForm.postcode}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, postcode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_country">Country</Label>
                      <select
                        id="billing_country"
                        value={billingForm.country}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing_phone">Phone</Label>
                      <Input
                        id="billing_phone"
                        value={billingForm.phone || ''}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_email">Email</Label>
                      <Input
                        id="billing_email"
                        value={billingForm.email || ''}
                        onChange={(e) => setBillingForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleBillingUpdate} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Address
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{billingForm.first_name} {billingForm.last_name}</p>
                  {billingForm.company && <p>{billingForm.company}</p>}
                  <p>{billingForm.address_1}</p>
                  {billingForm.address_2 && <p>{billingForm.address_2}</p>}
                  <p>{billingForm.city}, {billingForm.state} {billingForm.postcode}</p>
                  <p>{billingForm.country}</p>
                  {billingForm.phone && <p>Phone: {billingForm.phone}</p>}
                  {billingForm.email && <p>Email: {billingForm.email}</p>}
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Shipping Address</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingShipping(!editingShipping)}
                >
                  {editingShipping ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>

              {editingShipping ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipping_first_name">First Name</Label>
                      <Input
                        id="shipping_first_name"
                        value={shippingForm.first_name}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping_last_name">Last Name</Label>
                      <Input
                        id="shipping_last_name"
                        value={shippingForm.last_name}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shipping_company">Company</Label>
                    <Input
                      id="shipping_company"
                      value={shippingForm.company}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_address_1">Address Line 1</Label>
                    <Input
                      id="shipping_address_1"
                      value={shippingForm.address_1}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, address_1: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_address_2">Address Line 2</Label>
                    <Input
                      id="shipping_address_2"
                      value={shippingForm.address_2}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, address_2: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipping_city">City</Label>
                      <Input
                        id="shipping_city"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping_state">State</Label>
                      <Input
                        id="shipping_state"
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipping_postcode">ZIP Code</Label>
                      <Input
                        id="shipping_postcode"
                        value={shippingForm.postcode}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, postcode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping_country">Country</Label>
                      <select
                        id="shipping_country"
                        value={shippingForm.country}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleShippingUpdate} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Address
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{shippingForm.first_name} {shippingForm.last_name}</p>
                  {shippingForm.company && <p>{shippingForm.company}</p>}
                  <p>{shippingForm.address_1}</p>
                  {shippingForm.address_2 && <p>{shippingForm.address_2}</p>}
                  <p>{shippingForm.city}, {shippingForm.state} {shippingForm.postcode}</p>
                  <p>{shippingForm.country}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile" className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Profile Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProfile(!editingProfile)}
              >
                {editingProfile ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </div>

            {editingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <Button onClick={handleProfileUpdate} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="text-gray-900">{user?.first_name} {user?.last_name}</p>
                </div>
                <div>
                  <Label>Email Address</Label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <p className="text-gray-900">
                    {user?.date_created ? format(new Date(user.date_created), 'MMMM dd, yyyy') : 'Date not available'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Wishlist */}
        <TabsContent value="wishlist" className="mt-8">
          {(() => {
            const wishlistItems = getWishlistItems()
            const wishlistCount = getWishlistCount()
            
            if (wishlistCount === 0) {
              return (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your Wishlist is Empty</h3>
                  <p className="text-gray-600 mb-4">
                    Save your favorite products to your wishlist for easy access later.
                  </p>
                  <Link href="/shop">
                    <Button>Browse Products</Button>
                  </Link>
                </div>
              )
            }

            return (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">My Wishlist</h3>
                    <Badge variant="secondary">{wishlistCount} items</Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {/* Product Image */}
                        <div className="aspect-square relative overflow-hidden bg-gray-100">
                          {item.product.images && item.product.images.length > 0 ? (
                            <Image
                              src={item.product.images[0].src}
                              alt={item.product.images[0].alt || item.product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingBag className="h-16 w-16" />
                            </div>
                          )}
                          
                          {/* Remove from wishlist button */}
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                            title="Remove from wishlist"
                          >
                            <X className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <Link href={`/product/${item.product.slug}`}>
                            <h4 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                              {item.product.name}
                            </h4>
                          </Link>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {item.product.on_sale && item.product.sale_price ? (
                                <>
                                  <span className="text-lg font-semibold text-red-600">
                                    {formatPrice(parseFloat(item.product.sale_price))}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(parseFloat(item.product.regular_price))}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-semibold text-gray-900">
                                  {formatPrice(item.product.price)}
                                </span>
                              )}
                            </div>
                            
                            {item.product.on_sale && (
                              <Badge variant="destructive" className="text-xs">
                                Sale
                              </Badge>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <Button
                            onClick={() => addToCart(item.product, 1)}
                            disabled={loadingStates.addingToCart || item.product.stock_status !== 'instock'}
                            className="w-full"
                            size="sm"
                          >
                            {loadingStates.addingToCart ? (
                              'Adding...'
                            ) : item.product.stock_status !== 'instock' ? (
                              'Out of Stock'
                            ) : (
                              'Add to Cart'
                            )}
                          </Button>
                          
                          {/* Added date */}
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Added {format(new Date(item.addedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* View Full Wishlist Link */}
                  <div className="mt-6 text-center">
                    <Link href="/wishlist">
                      <Button variant="outline">
                        <Heart className="h-4 w-4 mr-2" />
                        View Full Wishlist
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
