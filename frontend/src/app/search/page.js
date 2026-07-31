'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, ArrowRight } from 'lucide-react';
import SearchMedicine from '../../components/SearchMedicine';
import Logo from '../../components/Logo';
import ThemeToggle from '../../components/ThemeToggle';
import { placeOrder } from '../../lib/api';
import { isAuthenticated, getIdToken, signOut } from '../../lib/auth';

export default function SearchPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    // Reading auth state from localStorage on mount - this can only run on
    // the client, so a one-time effect + setState is the correct pattern
    // here rather than an anti-pattern the lint rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthed(isAuthenticated());
  }, []);

  const handleSelectMedicine = (item) => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/search');
      return;
    }
    setOrderError('');
    setOrderSuccess('');
    setOrderQuantity(1);
    setSelectedItem(item);
  };

  const handleConfirmOrder = async () => {
    if (!selectedItem) return;
    setOrderLoading(true);
    setOrderError('');
    try {
      const idToken = getIdToken();
      const result = await placeOrder(
        {
          medicineName: selectedItem.medicine_name,
          pharmacyId: selectedItem.pharmacy_id,
          quantity: Number(orderQuantity),
        },
        idToken
      );
      setOrderSuccess(`Order placed! Order ID: ${result.order?.order_id || ''}`);
      setSelectedItem(null);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setAuthed(false);
  };

  return (
    <main className="min-h-screen bg-ivory">
      <header className="border-b border-pine-soft/60 bg-ivory/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo href="/" markClassName="h-6 w-6" />
          <div className="flex items-center gap-4">
            {authed ? (
              <button
                onClick={handleSignOut}
                className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-pine transition-colors"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => router.push('/login?redirect=/search')}
                className="font-mono text-xs uppercase tracking-widest text-pine hover:text-pine-light transition-colors"
              >
                Sign in
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <AnimatePresence>
          {orderSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-pine-soft border-l-4 border-pine text-pine p-4 rounded-r-lg overflow-hidden"
              role="status"
            >
              <p className="font-medium">{orderSuccess}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <SearchMedicine onSelectMedicine={handleSelectMedicine} />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="glass-panel rounded-2xl shadow-lifted max-w-sm w-full p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-clay mb-1.5">Confirm order</p>
                  <h2 className="font-display text-xl font-medium text-pine">{selectedItem.medicine_name}</h2>
                  <p className="text-ink-soft text-sm mt-1">
                    from {selectedItem.pharmacy?.name || 'this pharmacy'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  aria-label="Close"
                  className="shrink-0 p-1.5 rounded-full text-ink-soft hover:bg-ivory-dim hover:text-pine transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-ink mb-2">
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedItem.quantity || undefined}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-ivory-dim border border-pine-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-pine focus:border-pine font-mono text-ink"
                />
              </div>

              {orderError && (
                <div className="bg-brick-soft border-l-4 border-brick text-brick p-3 text-sm rounded-r-lg" role="alert">
                  {orderError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 px-4 py-2.5 rounded-full border border-pine-soft text-ink hover:bg-ivory-dim transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: orderLoading ? 1 : 1.02 }}
                  whileTap={{ scale: orderLoading ? 1 : 0.97 }}
                  onClick={handleConfirmOrder}
                  disabled={orderLoading}
                  className="flex-1 px-4 py-2.5 rounded-full bg-pine text-ivory font-medium hover:bg-pine-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {orderLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Placing...
                    </>
                  ) : (
                    <>
                      Place order
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
