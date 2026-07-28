// Use the environment variable (or fallback to hardcoded for testing)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://to23iirip3.execute-api.eu-north-1.amazonaws.com/Prod/';

if (typeof window !== 'undefined') {
  console.log('🔧 API_BASE:', API_BASE);
}

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// 1. Search Medicines
export const searchMedicines = async (query) => {
  if (!API_BASE) {
    throw new Error('API_BASE is not defined');
  }
  try {
    const url = new URL("search", API_BASE);
    if (typeof window !== 'undefined') {
      console.log('🔍 Searching with URL:', url.toString());
    }
    url.searchParams.append('q', query.trim());
    const response = await fetch(url);
    return handleResponse(response);
  } catch (error) {
    console.error('searchMedicines error:', error);
    throw new Error('Failed to search medicines: ' + error.message);
  }
};

// 2. Get Pharmacies with stock for a medicine
export const getPharmaciesForMedicine = async (medicineName) => {
  if (!API_BASE) {
    throw new Error('API_BASE is not defined');
  }
  try {
    // Backend expects path parameter: /pharmacies/{medicineName}
    const url = new URL("pharmacies/" + encodeURIComponent(medicineName), API_BASE);
    const response = await fetch(url);
    return handleResponse(response);
  } catch (error) {
    console.error('getPharmaciesForMedicine error:', error);
    throw new Error('Failed to fetch pharmacies: ' + error.message);
  }
};

// 3. Place Order (requires authentication)
export const placeOrder = async (orderData, idToken) => {
  if (!API_BASE) {
    throw new Error('API_BASE is not defined');
  }
  if (!idToken) {
    throw new Error('Missing authentication token');
  }
  try {
    const url = new URL("orders", API_BASE);
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

// 4. Admin: Register Pharmacy (requires admin auth)
export const registerPharmacy = async (pharmacyData, idToken) => {
  if (!idToken) {
    throw new Error('Missing authentication token');
  }
  const url = new URL("admin/pharmacies", API_BASE);
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

// 5. Admin: Update Inventory (requires admin auth)
export const updateInventory = async (inventoryData, idToken) => {
  if (!idToken) {
    throw new Error('Missing authentication token');
  }
  const url = new URL("admin/inventory", API_BASE);
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