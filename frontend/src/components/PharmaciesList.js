'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PillBottle, Pill } from 'lucide-react';
import { getPharmaciesForMedicine } from '../lib/api';
import PharmacyCard, { PharmacyCardSkeleton, listContainerVariants } from './PharmacyCard';

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

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-pine-soft shrink-0">
          <Pill className="h-4 w-4 text-pine" aria-hidden="true" />
        </span>
        <h2 className="font-display text-xl font-medium text-pine">
          Pharmacies with {medicineName || 'this medicine'} in stock
        </h2>
      </div>

      {error && (
        <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {loading && !error && (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
          role="status"
          aria-label="Loading pharmacies"
        >
          {[0, 1, 2].map((i) => (
            <PharmacyCardSkeleton key={i} index={i} />
          ))}
        </motion.div>
      )}

      {!loading && !error && pharmacies.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
          <div className="w-14 h-14 mx-auto mb-4 bg-mist rounded-full flex items-center justify-center">
            <PillBottle className="h-6 w-6 text-sage" aria-hidden="true" />
          </div>
          <p className="font-display text-lg font-medium text-pine mb-2">
            No pharmacies have this medicine in stock
          </p>
          <p className="text-ink-soft">Try searching for a different medicine or check back later.</p>
        </motion.div>
      )}

      {!loading && !error && pharmacies.length > 0 && (
        <motion.div
          key={searchTerm}
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          layout
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {pharmacies.map((pharm, index) => (
              <PharmacyCard
                key={pharm.pharmacyId || pharm.pharmacy_id || index}
                pharmacy={pharm}
                onAction={onOrder}
                actionLabel="Place order"
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
