'use client';

import { useState } from 'react';
import { searchMedicines } from '../lib/api';
import { ArrowRight, PillBottle } from 'lucide-react';
import PharmacyCard from './PharmacyCard';

export default function SearchMedicine({ onSelectMedicine }) {
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
      setResults(data.items || []);
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
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter medicine name (e.g., paracetamol, amoxicillin)..."
            onKeyPress={handleKeyPress}
            className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                Searching...
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              </>
            ) : (
              <>
                Search Medicines
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Results Section */}
      {!loading && results.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {results.length} Pharmacies Found
            </h2>
            <p className="text-sm text-gray-500">
              Showing results for "{query}"
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {results.map((pharm, index) => (
              <PharmacyCard
                key={pharm.pharmacyId || pharm.pharmacy_id || index}
                pharmacy={pharm}
                medicineName={query}
                onOrder={onSelectMedicine}
                showMedicineName={false}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <PillBottle className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            No pharmacies found for "{query}"
          </h3>
          <p className="text-gray-600 mb-4">
            Try checking the spelling or searching for a different medication
          </p>
          <button
            onClick={() => setQuery('')}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm"
          >
            New Search
          </button>
        </div>
      )}
    </div>
  );
}