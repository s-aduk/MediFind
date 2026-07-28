import { useState } from 'react';
import { searchMedicines } from '@/lib/api';
import { ArrowRight, MapPin, Pill, Rx } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await searchMedicines(query.trim());
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              MediFind
            </h1>
            <div className="flex items-center space-x-4">
              <button
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                onClick={() => {/* Profile dropdown */}
              >
                <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M20 21V20a8 8 0 00-16 0v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        {/* Hero/Search Section */}
        <section className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Find Your Medicine<br/>
              <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Search across hundreds of pharmacies to find the best prices and availability for your medications
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-xl shadow-md p-6 mb-12"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter medicine name (e.g., paracetamol, amoxicillin)..."
                className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1"
              >
                {loading ? 'Searching...' : 'Search Medicines'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Results Section */}
          {!loading && results.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {results.length} Pharmacies Found
                </h2>
                <p className="text-sm text-gray-500">
                  Showing results for "{query}"
                </p>
              </div>

              <div className="space-y-4">
                {results.map((pharm, index) => (
                  <div
                    key={pharm.pharmacyId || pharm.pharmacy_id || index}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                            {pharm.name || pharm.pharmacyName || 'Pharmacy'}
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Verified
                            </span>
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                            {pharm.distance?.toFixed(1) + ' km'} || 'Nearby'
                          </span>
                        </div>
                      </div>

                      {pharm.address && (
                        <p className="text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-2 text-green-500" /> {pharm.address}
                        </p>
                      )}

                      <div className="grid gap-4 mt-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <Pill className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Price</p>
                            <p className="text-lg font-bold text-gray-900">
                              ${pharm.price?.toFixed(2) || 'Price on request'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <Rx className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Stock</p>
                            <p className="text-lg font-bold">
                              {pharm.stock ?? pharm.quantity > 0 ? (
                                <span className="text-green-600">{pharm.stock ?? pharm.quantity} in stock</span>
                              ) : (
                                <span className="text-red-600">Out of stock</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 01-2-2h2a2 2 0 002 2v2a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Last Updated</p>
                            <p className="text-sm text-gray-500">
                              {new Date(pharm.last_updated || pharm.updated_at || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            // This would normally trigger the order flow
                            alert('Order functionality would be triggered here for: ' + (pharm.name || pharm.pharmacyName));
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                        >
                          Order Now
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  }
                ))}
              </div>
            </>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && query && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
                <Rx className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                No pharmacies found for "{query}"
              </p>
              <p className="text-gray-600 mb-6">
                Try checking the spelling or searching for a different medication
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setQuery('')}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  New Search
                </button>
                <button
                  onClick={() => {
                    // Suggest popular medicines
                    setQuery('paracetamol');
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-400 text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
                >
                  Try Paracetamol
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} MediFind. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm">
              <a href="#" className="text-gray-600 hover:text-green-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-green-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 hover:text-green-600 transition-colors">
                Help Center
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}