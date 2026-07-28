'use client';

import { useEffect, useState } from 'react';
import { getPharmaciesForMedicine } from '../lib/api';
import { ArrowRight, MapPin, Pill, PillBottle } from 'lucide-react';

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
            <PillBottle className="h-6 w-6 text-green-400" />
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
              <div
                key={pId}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 py-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      {pharm.pharmacy?.name || 'Pharmacy'}
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Verified
                      </span>
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                      {pharm.distance ? pharm.distance.toFixed(1) + ' km' : 'Nearby'}
                    </span>
                  </div>
                </div>

                {pharm.pharmacy?.address && (
                  <p className="text-gray-600 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-green-500" /> {pharm.pharmacy.address}
                  </p>
                )}

                <div className="grid gap-3 mt-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Pill className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Price</p>
                      <p className="text-lg font-bold text-gray-900">
                        {pharm.price ? `$${pharm.price.toFixed(2)}` : 'Price on request'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <PillBottle className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Stock</p>
                      <p className="text-lg font-bold">
                        {(pharm.stock ?? pharm.quantity ?? 0) > 0 ? (
                          <span className="text-green-600">{pharm.stock ?? pharm.quantity} in stock</span>
                        ) : (
                          <span className="text-red-600">Out of stock</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 01-2-2h2a2 2 0 002 2v2a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-500">
                        {pharm.last_updated || pharm.updated_at
                          ? new Date(pharm.last_updated || pharm.updated_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => onOrder(pharm)}
                    className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2 text-sm"
                  >
                    Place Order
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
