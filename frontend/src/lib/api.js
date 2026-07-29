// API Client with timeout, retry, and token refresh support

// Require API URL from environment - no production default
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL;

if (!RAW_API_BASE) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Please create a .env.local file with your API Gateway URL.'
  );
}

// Ensure trailing slash for proper URL resolution
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE : `${RAW_API_BASE}/`;

// Default timeout for all requests (15 seconds)
const DEFAULT_TIMEOUT_MS = 15000;

// Maximum retry attempts for failed requests
const MAX_RETRIES = 3;

// Retry delay base (exponential backoff)
const RETRY_BASE_DELAY_MS = 1000;

// Helper to create fetch with timeout using AbortController
const fetchWithTimeout = (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  })
    .then((response) => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond');
      }
      throw error;
    });
};

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
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// Helper to build URL with search params
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

// Sleep utility for retry delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generic fetch with retry logic
const fetchWithRetry = async (fetchFn, retries = MAX_RETRIES) => {
  try {
    return await fetchFn();
  } catch (error) {
    // Don't retry on 4xx errors (except 429 Too Many Requests)
    if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
      throw error;
    }

    if (retries > 0) {
      const delay = RETRY_BASE_DELAY_MS * (MAX_RETRIES - retries + 1);
      await sleep(delay);
      return fetchWithRetry(fetchFn, retries - 1);
    }
    throw error;
  }
};

// Create timeout controller for requests
const createTimeoutController = (timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
};

// Dynamic imports to avoid circular dependencies
let authModule = null;
const getAuthModule = async () => {
  if (!authModule) {
    authModule = await import('./auth');
  }
  return authModule;
};

// 1. Search Medicines (public, no auth)
// Returns { count, items, searchTerm }
export const searchMedicines = async (query) => {
  const url = buildUrl('search', { q: query.trim() });
  return fetchWithRetry(async () => {
    const response = await fetchWithTimeout(url);
    return handleResponse(response);
  });
};

// 2. Get pharmacies with a medicine in stock (public, no auth)
// Backend route is GET /pharmacies/{medicineName} (path parameter)
// Returns { count, items, lastEvaluatedKey }
export const getPharmaciesForMedicine = async (medicineName) => {
  const url = buildUrl(`pharmacies/${encodeURIComponent(medicineName)}`);
  return fetchWithRetry(async () => {
    const response = await fetchWithTimeout(url);
    return handleResponse(response);
  });
};

// 3. Place Order (requires authentication)
export const placeOrder = async (orderData) => {
  const auth = await getAuthModule();
  const getValidIdToken = auth.getValidIdToken;

  const attemptRequest = async (token) => {
    const url = buildUrl('orders');
    const { controller, timeoutId } = createTimeoutController();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Get initial token
  let token = await getValidIdToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  try {
    return await attemptRequest(token);
  } catch (error) {
    // If 401, try to refresh token and retry once
    if (error.status === 401) {
      console.log('Token expired, attempting refresh...');
      try {
        const newToken = await getValidIdToken();
        if (newToken && newToken !== token) {
          return await attemptRequest(newToken);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    console.error('placeOrder error:', error);
    throw new Error('Failed to place order: ' + error.message);
  }
};

// 4. Admin: Register Pharmacy (requires authentication)
export const registerPharmacy = async (pharmacyData) => {
  const auth = await getAuthModule();
  const getValidIdToken = auth.getValidIdToken;

  const attemptRequest = async (token) => {
    const url = buildUrl('admin/pharmacies');
    const { controller, timeoutId } = createTimeoutController();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pharmacyData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  let token = await getValidIdToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  try {
    return await attemptRequest(token);
  } catch (error) {
    if (error.status === 401) {
      console.log('Token expired, attempting refresh...');
      try {
        const newToken = await getValidIdToken();
        if (newToken && newToken !== token) {
          return await attemptRequest(newToken);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    console.error('registerPharmacy error:', error);
    throw new Error('Failed to register pharmacy: ' + error.message);
  }
};

// 5. Admin: Update Inventory (requires authentication)
export const updateInventory = async (inventoryData) => {
  const auth = await getAuthModule();
  const getValidIdToken = auth.getValidIdToken;

  const attemptRequest = async (token) => {
    const url = buildUrl('admin/inventory');
    const { controller, timeoutId } = createTimeoutController();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inventoryData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  let token = await getValidIdToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  try {
    return await attemptRequest(token);
  } catch (error) {
    if (error.status === 401) {
      console.log('Token expired, attempting refresh...');
      try {
        const newToken = await getValidIdToken();
        if (newToken && newToken !== token) {
          return await attemptRequest(newToken);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    console.error('updateInventory error:', error);
    throw new Error('Failed to update inventory: ' + error.message);
  }
};