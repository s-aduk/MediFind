import { useEffect, useState } from 'react';
import { getPharmaciesForMedicine } from '../lib/api';

export default function PharmaciesList({ medicineId, onOrder }) {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!medicineId) return;

    const fetchPharmacies = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPharmaciesForMedicine(medicineId);
        setPharmacies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, [medicineId]);

  if (loading) return <p>Loading pharmacies...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">Pharmacies with Stock</h2>
      {pharmacies.length === 0 ? (
        <p>No pharmacies have this medicine in stock.</p>
      ) : (
        <ul>
          {pharmacies.map((pharm) => (
            <li key={pharm.pharmacyId} className="border p-3 mb-2 rounded">
              <h3 className="font-bold">{pharm.name}</h3>
              <p>{pharm.address}</p>
              <p>Price: ${pharm.price}</p>
              <p>Stock: {pharm.stock} units</p>
              <button
                onClick={() => onOrder(pharm.pharmacyId)}
                className="bg-blue-500 text-white p-2 rounded mt-2"
              >
                Order Now
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}