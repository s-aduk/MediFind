import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900">
              Find the Medicine You Need<br />
              <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-3">Search Medicines</h3>
              <p className="text-gray-600">Enter the name of the medicine you&apos;re looking for and see real-time availability</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-3">Find Nearby Pharmacies</h3>
              <p className="text-gray-600">See which pharmacies have your medication in stock, along with prices and distances</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                </svg>
              </div>
              <h3 className="font-semibold mb-3">Place Your Order</h3>
              <p className="text-gray-600">Securely order your medicine with just a few clicks and get it delivered or ready for pickup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-green-100">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to find your medicine?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Search across hundreds of pharmacies to find the best prices and availability for your medications
            </p>
            <Link href="/search" className="inline-block bg-gradient-to-r from-green-600 to-green-400 text-white px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1">
              Start Searching <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}