'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Truck, CreditCard, Download, ArrowRight, Home, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { woocommerceApi } from '@/lib/woocommerce-api'
import { Order } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

interface OrderConfirmationPageProps {
  orderId: string
  className?: string
}

export function OrderConfirmationPage({ orderId, className }: OrderConfirmationPageProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Parse orderId to number
      const orderIdNum = parseInt(orderId)
      if (isNaN(orderIdNum)) {
        throw new Error('Invalid order ID')
      }
      
      const orderData = await woocommerceApi.getOrder(orderIdNum)
      setOrder(orderData)
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'processing':
        return 'Processing'
      case 'on-hold':
        return 'On Hold'
      case 'pending':
        return 'Pending Payment'
      case 'cancelled':
        return 'Cancelled'
      case 'refunded':
        return 'Refunded'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (loading) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-red-800 mb-4">Order Not Found</h2>
              <p className="text-red-600 mb-8">
                {error || 'We could not find the order you are looking for.'}
              </p>
              <div className="space-x-4">
                <Link href="/shop">
                  <Button>Continue Shopping</Button>
                </Link>
                <Link href="/my-account/orders">
                  <Button variant="outline">View All Orders</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-800 mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-green-600 text-lg">
              Your order has been successfully placed and is being processed.
            </p>
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
        >
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order #{order.number}
                </h2>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-600">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.date_created).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-medium">{order.payment_method_title}</p>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Order Items */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.line_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${item.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Total & Actions */}
          <div className="space-y-6">
            {/* Order Total */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Total</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${order.total}</span>
                </div>
                {order.shipping_total && parseFloat(order.shipping_total) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>${order.shipping_total}</span>
                  </div>
                )}
                {order.total_tax && parseFloat(order.total_tax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>${order.total_tax}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${order.total}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment confirmation sent to your email
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  Order is being prepared for shipment
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="h-4 w-4 mr-2" />
                  You'll receive tracking info soon
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/my-account" className="block">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  View Order Details
                </Button>
              </Link>
              <Link href="/shop" className="block">
                <Button className="w-full">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full" variant="ghost">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Shipping & Billing Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Shipping Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">
                {order.shipping.first_name} {order.shipping.last_name}
              </p>
              {order.shipping.company && <p>{order.shipping.company}</p>}
              <p>{order.shipping.address_1}</p>
              {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
              <p>
                {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
              </p>
              <p>{order.shipping.country}</p>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Billing Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">
                {order.billing.first_name} {order.billing.last_name}
              </p>
              {order.billing.company && <p>{order.billing.company}</p>}
              <p>{order.billing.address_1}</p>
              {order.billing.address_2 && <p>{order.billing.address_2}</p>}
              <p>
                {order.billing.city}, {order.billing.state} {order.billing.postcode}
              </p>
              <p>{order.billing.country}</p>
              <p className="pt-2">
                <span className="font-medium">Email:</span> {order.billing.email}
              </p>
              {order.billing.phone && (
                <p>
                  <span className="font-medium">Phone:</span> {order.billing.phone}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
