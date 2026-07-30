'use client';

import { useState } from 'react';
import { searchMedicines } from '../lib/api';
import { ArrowRight, MapPin, Pill, PillBottle, Loader2 } from 'lucide-react';

function stockTone(count) {
  if (count <= 0) return { bar: 'bg-brick', text: 'text-brick', label: 'Out of stock' };
  if (count < 10) return { bar: 'bg-clay', text: 'text-clay', label: `${count} in stock` };
  return { bar: 'bg-pine', text: 'text-pine', label: `${count} in stock` };
}

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
    <div className="space-y-8">
      {/* Search Form - capsule shaped */}
      <form onSubmit={handleSearch}>
        <div className="flex items-center bg-white rounded-full border border-pine-soft shadow-card p-1.5 pl-6 focus-within:border-pine transition-colors">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a medicine, e.g. paracetamol"
            onKeyPress={handleKeyPress}
            aria-label="Search medicine name"
            className="flex-1 min-w-0 py-3 bg-transparent focus:outline-none placeholder:text-ink-soft/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 bg-pine text-ivory px-6 py-3 rounded-full font-medium hover:bg-pine-light transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Searching
              </>
            ) : (
              <>
                Search
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex justify-center py-10" role="status" aria-label="Searching">
          <Loader2 className="h-6 w-6 text-pine animate-spin" aria-hidden="true" />
        </div>
      )}

      {/* Results Section */}
      {!loading && results.length > 0 && (
        <>
          <div className="flex justify-between items-baseline">
            <h2 className="font-display text-xl font-medium text-pine">
              {results.length} {results.length === 1 ? 'pharmacy' : 'pharmacies'} found
            </h2>
            <p className="font-mono text-xs text-ink-soft">
              &quot;{query}&quot;
            </p>
          </div>

          <div className="space-y-4">
            {results.map((pharm, index) => {
              const stockCount = pharm.stock ?? pharm.quantity ?? 0;
              const tone = stockTone(stockCount);
              return (
                <div
                  key={pharm.pharmacyId || pharm.pharmacy_id || index}
                  className="relative flex overflow-hidden bg-white rounded-2xl shadow-card hover:shadow-lifted transition-shadow border border-pine-soft/60"
                >
                  {/* Stock gauge - color is always paired with a text label, never used alone */}
                  <div className={`w-1.5 shrink-0 ${tone.bar}`} aria-hidden="true" />

                  <div className="flex-1 p-5">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div>
                        <h3 className="font-display text-lg font-medium text-pine">
                          {pharm.pharmacy?.name || 'Pharmacy'}
                        </h3>
                        {pharm.pharmacy?.address && (
                          <p className="text-sm text-ink-soft flex items-center gap-1.5 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-clay shrink-0" aria-hidden="true" />
                            {pharm.pharmacy.address}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-xs px-3 py-1 rounded-full bg-mist text-pine">
                        {pharm.distance ? pharm.distance.toFixed(1) + ' km' : 'Nearby'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2.5 p-3 bg-ivory-dim rounded-xl">
                        <Pill className="h-4 w-4 text-clay shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-xs text-ink-soft">Price</p>
                          <p className="font-mono text-sm font-medium text-ink">
                            {pharm.price ? `$${pharm.price.toFixed(2)}` : 'On request'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 bg-ivory-dim rounded-xl">
                        <PillBottle className={`h-4 w-4 shrink-0 ${tone.text}`} aria-hidden="true" />
                        <div>
                          <p className="text-xs text-ink-soft">Stock</p>
                          <p className={`font-mono text-sm font-medium ${tone.text}`}>{tone.label}</p>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2.5 p-3 bg-ivory-dim rounded-xl">
                        <svg className="h-4 w-4 text-sage shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 01-2-2h2a2 2 0 002 2v2a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-ink-soft">Updated</p>
                          <p className="text-sm text-ink">
                            {pharm.last_updated || pharm.updated_at
                              ? new Date(pharm.last_updated || pharm.updated_at).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectMedicine(pharm)}
                      className="w-full sm:w-auto bg-pine text-ivory px-6 py-2.5 rounded-full font-medium hover:bg-pine-light transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      Order now
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-14">
          <div className="w-16 h-16 mx-auto mb-5 bg-mist rounded-full flex items-center justify-center">
            <PillBottle className="h-7 w-7 text-sage" aria-hidden="true" />
          </div>
          <h3 className="font-display text-lg font-medium text-pine mb-2">
            No pharmacies found for &quot;{query}&quot;
          </h3>
          <p className="text-ink-soft mb-5">
            Try checking the spelling or searching for a different medication.
          </p>
          <button
            onClick={() => setQuery('')}
            className="font-mono text-xs uppercase tracking-widest text-pine hover:text-pine-light transition-colors"
          >
            New search
          </button>
        </div>
      )}
    </div>
  );
}
