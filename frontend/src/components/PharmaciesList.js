'use client';

import { useEffect, useState } from 'react';
import { getPharmaciesForMedicine } from '../lib/api';
import { ArrowRight, MapPin, Pill, PillBottle, Loader2 } from 'lucide-react';

function stockTone(count) {
  if (count <= 0) return { bar: 'bg-brick', text: 'text-brick', label: 'Out of stock' };
  if (count < 10) return { bar: 'bg-clay', text: 'text-clay', label: `${count} in stock` };
  return { bar: 'bg-pine', text: 'text-pine', label: `${count} in stock` };
}

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
      <div className="flex justify-center py-10" role="status" aria-label="Loading pharmacies">
        <Loader2 className="h-6 w-6 text-pine animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="font-display text-xl font-medium text-pine mb-5">
        Pharmacies with {medicineName || 'this medicine'} in stock
      </h2>

      {pharmacies.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 mx-auto mb-4 bg-mist rounded-full flex items-center justify-center">
            <PillBottle className="h-6 w-6 text-sage" aria-hidden="true" />
          </div>
          <p className="font-display text-lg font-medium text-pine mb-2">
            No pharmacies have this medicine in stock
          </p>
          <p className="text-ink-soft">
            Try searching for a different medicine or check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pharmacies.map((pharm, index) => {
            const pId = pharm.pharmacyId || pharm.pharmacy_id || index;
            const stockCount = pharm.stock ?? pharm.quantity ?? 0;
            const tone = stockTone(stockCount);
            return (
              <div
                key={pId}
                className="relative flex overflow-hidden bg-white rounded-2xl shadow-card hover:shadow-lifted transition-shadow border border-pine-soft/60"
              >
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
                    onClick={() => onOrder(pharm)}
                    className="w-full sm:w-auto bg-pine text-ivory px-6 py-2.5 rounded-full font-medium hover:bg-pine-light transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    Place order
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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
