'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ArrowRight, Loader2, PillBottle, Sparkles } from 'lucide-react';
import { searchMedicines } from '../lib/api';
import PharmacyCard, { PharmacyCardSkeleton, listContainerVariants } from './PharmacyCard';

const QUICK_FILTERS = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine'];

export default function SearchMedicine({ onSelectMedicine }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const typingTimeout = useRef(null);

  const runSearch = async (term) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const data = await searchMedicines(trimmed);
      setResults(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setIsTyping(false), 600);
  };

  const handleQuickFilter = (term) => {
    setQuery(term);
    runSearch(term);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError('');
    setHasSearched(false);
  };

  return (
    <div className="space-y-8">
      {/* Search Form - ambient glow capsule */}
      <div className="relative">
        <div className="ambient-glow" aria-hidden="true" />
        <form onSubmit={handleSearch}>
          <div className="flex items-center glass-panel rounded-full shadow-card p-1.5 pl-5 focus-within:ring-2 focus-within:ring-pine/40 transition-shadow">
            <Search className="h-4.5 w-4.5 text-sage shrink-0 mr-2" aria-hidden="true" />

            <input
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Search a medicine, e.g. paracetamol"
              aria-label="Search medicine name"
              className="flex-1 min-w-0 py-3 bg-transparent focus:outline-none placeholder:text-ink-soft/60"
            />

            {/* Live typing indicator */}
            <AnimatePresence>
              {isTyping && query && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="hidden sm:inline-flex items-center gap-1 mr-2 font-mono text-[11px] text-sage"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-sage breathing-dot" aria-hidden="true" />
                  typing
                </motion.span>
              )}
            </AnimatePresence>

            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="shrink-0 p-2 rounded-full text-ink-soft hover:bg-ivory-dim hover:text-pine transition-colors"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
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
            </motion.button>
          </div>
        </form>

        {/* Quick-filter chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-ink-soft mr-1">
            <Sparkles className="h-3 w-3 text-clay" aria-hidden="true" />
            Try
          </span>
          {QUICK_FILTERS.map((term) => (
            <motion.button
              key={term}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleQuickFilter(term)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                query === term
                  ? 'bg-pine text-ivory border-pine'
                  : 'bg-ivory-dim border-pine-soft text-ink-soft hover:text-pine hover:border-pine/40'
              }`}
            >
              {term}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Skeleton loading state */}
      {loading && !error && (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
          role="status"
          aria-label="Searching for pharmacies"
        >
          {[0, 1, 2].map((i) => (
            <PharmacyCardSkeleton key={i} index={i} />
          ))}
        </motion.div>
      )}

      {/* Results Section */}
      {!loading && results.length > 0 && (
        <>
          <div className="flex justify-between items-baseline">
            <h2 className="font-display text-xl font-medium text-pine">
              {results.length} {results.length === 1 ? 'pharmacy' : 'pharmacies'} found
            </h2>
            <p className="font-mono text-xs text-ink-soft">&quot;{query}&quot;</p>
          </div>

          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            layout
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {results.map((pharm, index) => (
                <PharmacyCard
                  key={pharm.pharmacyId || pharm.pharmacy_id || index}
                  pharmacy={pharm}
                  onAction={onSelectMedicine}
                  actionLabel="Order now"
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Empty State */}
      {!loading && hasSearched && results.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-14"
        >
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
            onClick={handleClear}
            className="font-mono text-xs uppercase tracking-widest text-pine hover:text-pine-light transition-colors"
          >
            New search
          </button>
        </motion.div>
      )}
    </div>
  );
}
