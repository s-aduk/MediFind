'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">MediFind</h1>
          {authed ? (
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => router.push('/login?redirect=/search')}
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {orderSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4" role="status">
            <p className="font-medium">{orderSuccess}</p>
          </div>
        )}

        <SearchMedicine onSelectMedicine={handleSelectMedicine} />
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Confirm Order</h2>
            <p className="text-gray-600">
              {selectedItem.medicine_name} from{' '}
              {selectedItem.pharmacy?.name || 'this pharmacy'}
            </p>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={selectedItem.quantity || undefined}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>

            {orderError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm" role="alert">
                {orderError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={orderLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-400 text-white font-medium hover:opacity-90"
              >
                {orderLoading ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
