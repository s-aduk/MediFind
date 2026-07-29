'use client';

import { useEffect, useState } from 'react';
import { getPharmaciesForMedicine } from '../lib/api';
import PharmacyCard from './PharmacyCard';

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
        setPharmacies(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Pharmacies with {medicineName || 'this medicine'} in Stock
      </h2>

      {pharmacies.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-900 mb-2">
            No pharmacies have this medicine in stock
          </p>
          <p className="text-gray-600">
            Try searching for a different medicine or check back later
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {pharmacies.map((pharm, index) => {
            const pId = pharm.pharmacyId || pharm.pharmacy_id || index;
            return (
              <PharmacyCard
                key={pId}
                pharmacy={pharm}
                medicineName={medicineName}
                onOrder={onOrder}
                showMedicineName={false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}