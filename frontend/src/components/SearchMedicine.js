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
        {results.map((item) => (
          <li key={item.medicineId} className="border p-3 mb-2 rounded">
            <h3 className="font-bold">{item.name}</h3>
            <p>Generic: {item.genericName}</p>
            <p>Strength: {item.strength}</p>
            <button
              onClick={() => onSelectMedicine(item.medicineId)}
              className="bg-green-500 text-white p-1 rounded mt-2"
            >
              View Pharmacies
            </button>
          </li>
        ))}
      </ul>

      {results.length === 0 && !loading && query && (
        <p className="mt-2">No medicines found.</p>
      )}
    </div>
  );
}