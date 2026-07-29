import { searchMedicines, getPharmaciesForMedicine, placeOrder } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variable
    process.env.NEXT_PUBLIC_API_URL = 'https://test-api.example.com/Prod/';
  });

  describe('searchMedicines', () => {
    it('calls API with correct query parameter', async () => {
      const mockResponse = { items: [], count: 0 };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchMedicines('paracetamol');

      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/Prod/search?q=paracetamol',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('trims query before sending', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [], count: 0 }),
      });

      await searchMedicines('  amoxicillin  ');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=amoxicillin'),
        expect.anything()
      );
    });

    it('throws error on HTTP error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
        statusText: 'Internal Server Error',
      });

      await expect(searchMedicines('test')).rejects.toThrow('Internal server error');
    });

    it('throws error on network failure', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(searchMedicines('test')).rejects.toThrow('Failed to search medicines');
    });
  });

  describe('getPharmaciesForMedicine', () => {
    it('calls API with encoded medicine name', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [], count: 0 }),
      });

      await getPharmaciesForMedicine('Tylenol Extra Strength');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('pharmacies/Tylenol%20Extra%20Strength'),
        expect.anything()
      );
    });
  });

  describe('placeOrder', () => {
    const mockToken = 'mock-id-token';

    it('calls API with auth header', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ order: { order_id: '123' } }),
      });

      await placeOrder(
        { medicineName: 'Paracetamol', pharmacyId: 'pharm1', quantity: 2 },
        mockToken
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/Prod/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify({ medicineName: 'Paracetamol', pharmacyId: 'pharm1', quantity: 2 }),
        })
      );
    });

    it('throws error if no token provided', async () => {
      await expect(placeOrder({ medicineName: 'Test', pharmacyId: '1', quantity: 1 }, null))
        .rejects.toThrow('Missing authentication token');
    });
  });
});