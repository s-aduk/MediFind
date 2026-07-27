import { useState } from 'react';
import { searchMedicines } from '../lib/api';

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
      const data = await searchMedicines(query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a medicine..."
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded ml-2"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <ul className="mt-4">
        {pharmacies.map((pharm, index) => {
          const pId = pharm.pharmacyId || pharm.pharmacy_id || index;
          return (
            <li key={pId} className="border p-3 mb-2 rounded">
              <h3 className="font-bold">{pharm.name || pharm.pharmacyName || 'Pharmacy'}</h3>
              {pharm.address && <p>{pharm.address}</p>}
              {pharm.price !== undefined && <p>Price: ${pharm.price}</p>}
              <p>Stock: {pharm.stock ?? pharm.quantity ?? 'Available'} units</p>
              <button
                onClick={() => onOrder(pharm)}
                className="bg-blue-500 text-white p-2 rounded mt-2"
              >
                Order Now
              </button>
            </li>
          );
        })}
      </ul>

      {results.length === 0 && !loading && query && (
        <p className="mt-2">No medicines found.</p>
      )}
    </div>
  );
}