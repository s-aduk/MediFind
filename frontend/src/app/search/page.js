'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchMedicine from '../../components/SearchMedicine';
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
      <header className="border-b border-pine-soft bg-ivory/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-semibold text-pine tracking-tight">
            MediFind
          </Link>
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
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {orderSuccess && (
          <div className="bg-pine-soft border-l-4 border-pine text-pine p-4 rounded-r-lg" role="status">
            <p className="font-medium">{orderSuccess}</p>
          </div>
        )}

        <SearchMedicine onSelectMedicine={handleSelectMedicine} />
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-lifted max-w-sm w-full p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-clay mb-1.5">Confirm order</p>
              <h2 className="font-display text-xl font-medium text-pine">
                {selectedItem.medicine_name}
              </h2>
              <p className="text-ink-soft text-sm mt-1">
                from {selectedItem.pharmacy?.name || 'this pharmacy'}
              </p>
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
                className="w-full px-4 py-2.5 bg-ivory-dim border border-pine-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-pine focus:border-pine font-mono"
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
              <button
                onClick={handleConfirmOrder}
                disabled={orderLoading}
                className="flex-1 px-4 py-2.5 rounded-full bg-pine text-ivory font-medium hover:bg-pine-light transition-colors disabled:opacity-60"
              >
                {orderLoading ? 'Placing...' : 'Place order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
