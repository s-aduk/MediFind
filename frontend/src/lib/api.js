// Use the environment variable (or fallback to hardcoded for testing)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://to23iirip3.execute-api.eu-north-1.amazonaws.com/Prod/';

console.log('🔧 API_BASE:', API_BASE);

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
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
    console.log('🔍 Searching with URL:', url.toString());
    url.searchParams.append('q', query.trim());
    const response = await fetch(url);
    return handleResponse(response);
  } catch (error) {
    console.error('searchMedicines error:', error);
    throw new Error('Failed to search medicines: ' + error.message);
  }
};

// 2. Get Pharmacies with stock for a medicine
export const getPharmaciesForMedicine = async (medicineId) => {
  if (!API_BASE) {
    throw new Error('API_BASE is not defined');
  }
  try {
    const url= new URL("pharmacies", API_BASE)
    url.searchParams.append('medicineId', medicineId);
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

// 4. Admin: Register Pharmacy
export const registerPharmacy = async (pharmacyData) => {
  const url = new URL("admin/pharmacy", API_BASE);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pharmacyData),
  });
  return handleResponse(response);
};

// 5. Admin: Update Inventory
export const updateInventory = async (inventoryData) => {
  const url = new URL("admin/inventory", API_BASE);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inventoryData),
  });
  return handleResponse(response);
};