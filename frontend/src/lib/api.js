// Use the environment variable (or fallback to hardcoded for local testing)
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://to23iirip3.execute-api.eu-north-1.amazonaws.com/Prod/';

// Ensure a trailing slash so `new URL(path, API_BASE)` appends rather than
// replacing the last path segment (e.g. the API Gateway stage name).
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE : `${RAW_API_BASE}/`;

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

const buildUrl = (path, searchParams) => {
  const url = new URL(path, API_BASE);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  return url;
};

// 1. Search Medicines
// Returns { count, items, searchTerm }
export const searchMedicines = async (query) => {
  try {
    const url = buildUrl('search', { q: query.trim() });
    const response = await fetch(url);
    return handleResponse(response);
  } catch (error) {
    console.error('searchMedicines error:', error);
    throw new Error('Failed to search medicines: ' + error.message);
  }
};

// 2. Get pharmacies with a medicine in stock
// Backend route is GET /pharmacies/{medicineName} (path parameter, not query string)
// Returns { count, items, lastEvaluatedKey }
export const getPharmaciesForMedicine = async (medicineName) => {
  try {
    const url = buildUrl(`pharmacies/${encodeURIComponent(medicineName)}`);
    const response = await fetch(url);
    return handleResponse(response);
  } catch (error) {
    console.error('getPharmaciesForMedicine error:', error);
    throw new Error('Failed to fetch pharmacies: ' + error.message);
  }
};

// 3. Place Order (requires authentication)
export const placeOrder = async (orderData, idToken) => {
  if (!idToken) {
    throw new Error('Missing authentication token');
  }
  try {
    const url = buildUrl('orders');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('placeOrder error:', error);
    throw new Error('Failed to place order: ' + error.message);
  }
};

// 4. Admin: Register Pharmacy (requires authentication)
// Backend route is POST /admin/pharmacies (plural)
export const registerPharmacy = async (pharmacyData, idToken) => {
  if (!idToken) {
    throw new Error('Missing authentication token');
  }
  const url = buildUrl('admin/pharmacies');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(pharmacyData),
  });
  return handleResponse(response);
};

// 5. Admin: Update Inventory (requires authentication)
export const updateInventory = async (inventoryData, idToken) => {
  if (!idToken) {
    throw new Error('Missing authentication token');
  }
  const url = buildUrl('admin/inventory');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(inventoryData),
  });
  return handleResponse(response);
};
