'use client';

import { ArrowRight, MapPin, Pill, PillBottle } from 'lucide-react';

export default function PharmacyCard({ pharmacy, medicineName, onOrder }) {
  const { pharmacy: pharmacyInfo = {}, price, stock, quantity, distance, last_updated, updated_at } = pharmacy;

  const availableStock = stock ?? quantity ?? 0;
  const isInStock = availableStock > 0;
  const priceDisplay = price ? `$${price.toFixed(2)}` : 'Price on request';
  const lastUpdated = last_updated || updated_at;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 py-4">
      <div className="flex justify-between items-start mb-3 px-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {pharmacyInfo.name || 'Pharmacy'}
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Verified
            </span>
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
            {distance ? `${distance.toFixed(1)} km` : 'Nearby'}
          </span>
        </div>
      </div>

      {pharmacyInfo.address && (
        <p className="text-gray-600 mb-2 px-4 flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-green-500" /> {pharmacyInfo.address}
        </p>
      )}

      <div className="grid gap-3 px-4 mt-3">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <Pill className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Price</p>
            <p className="text-lg font-bold text-gray-900">{priceDisplay}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <PillBottle className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Stock</p>
            <p className="text-lg font-bold">
              {isInStock ? (
                <span className="text-green-600">{availableStock} in stock</span>
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
              {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 px-4">
        <button
          onClick={() => onOrder(pharmacy)}
          disabled={!isInStock}
          className={`w-full px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2 text-sm ${
            isInStock
              ? 'bg-gradient-to-r from-green-600 to-green-400 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isInStock ? 'Order Now' : 'Out of Stock'}
          <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
}