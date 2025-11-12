import { ClientLayout } from '@/components/themes/client-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ContactForm from '@/components/ContactForm'
import { 
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare
} from 'lucide-react'

export default function ContactPage() {
  return (
    <ClientLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 md:mb-6 bg-white/20 text-white border-white/30">
            Contact Us
          </Badge>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Get In Touch
          </h1>
          
          <p className="text-base md:text-xl lg:text-2xl text-blue-100 mb-6 md:mb-8 max-w-3xl mx-auto px-4">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
                Send us a Message
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>

              <ContactForm />
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
                Contact Information
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
                Reach out to us through any of these channels. We're here to help!
              </p>

              <div className="space-y-4 md:space-y-6">
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2.5 md:p-3 rounded-full mr-3 md:mr-4 flex-shrink-0">
                        <Mail className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base md:text-lg mb-1">Email Us</h3>
                        <p className="text-sm md:text-base text-gray-600 mb-2">Send us an email anytime</p>
                        <a href="mailto:contact@example.com" className="text-sm md:text-base text-blue-600 hover:text-blue-800 break-all">
                          contact@example.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-green-100 p-3 rounded-full mr-4">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                        <p className="text-gray-600 mb-2">Mon-Fri 9AM-6PM EST</p>
                        <a href="tel:+15551234567" className="text-blue-600 hover:text-blue-800">
                          +1 (555) 123-4567
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-purple-100 p-3 rounded-full mr-4">
                        <MapPin className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                        <p className="text-gray-600 mb-2">Our office location</p>
                        <address className="text-gray-700 not-italic">
                          123 Main Street<br />
                          Suite 100<br />
                          City, State 12345
                        </address>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-orange-100 p-3 rounded-full mr-4">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Business Hours</h3>
                        <div className="text-gray-600 space-y-1">
                          <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                          <p>Saturday: 10:00 AM - 4:00 PM</p>
                          <p>Sunday: Closed</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
            {[
              {
                question: "How quickly do you respond to inquiries?",
                answer: "We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly."
              },
              {
                question: "What's the best way to reach you?",
                answer: "Email is usually the best way to reach us for detailed inquiries. For immediate assistance, feel free to call during business hours."
              },
              {
                question: "Do you offer consultations?",
                answer: "Yes, we offer consultations. Please contact us to discuss your needs and we'll schedule a time that works for both of us."
              },
              {
                question: "Can I visit your office?",
                answer: "Absolutely! We welcome visitors during business hours. We recommend calling ahead to ensure someone is available to meet with you."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <MessageSquare className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 text-blue-200" />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            Still Have Questions?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Don't hesitate to reach out. We're here to help and would love to hear from you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Send Email
            </Button>
            
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 w-full sm:w-auto">
              <Phone className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Call Now
            </Button>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
