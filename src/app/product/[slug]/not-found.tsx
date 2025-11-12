import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingBag, ArrowLeft, Search } from 'lucide-react'

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Product Not Found
            </h1>
            <p className="text-gray-600">
              Sorry, the product you're looking for doesn't exist or has been removed.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" variant="themes">
              <Link href="/shop">
                <Search className="h-4 w-4 mr-2" />
                Browse All Products
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-themes-blue-600 hover:text-themes-blue-700">Contact us</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
