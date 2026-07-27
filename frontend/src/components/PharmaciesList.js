import { useEffect, useState } from 'react';
import { getPharmaciesForMedicine } from '../lib/api';

export default function PharmaciesList({ medicineId, medicineName, onOrder }) {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Support either prop name passed from parent
  const searchTerm = medicineName || medicineId;

  useEffect(() => {
    if (!searchTerm) return;

    const fetchPharmacies = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPharmaciesForMedicine(searchTerm);
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
      )}
    </div>
  );
}