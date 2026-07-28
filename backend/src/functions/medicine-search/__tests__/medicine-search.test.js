// __tests__/medicine-search.test.js

// The mock must be wired up before the module under test is required, since
// index.js constructs its DynamoDB client once at module load time.
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend }))
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({ send: mockSend }))
  },
  ScanCommand: jest.fn((params) => params),
  GetCommand: jest.fn((params) => params)
}));

const { handler } = require('../index');

describe('Medicine Search Lambda', () => {
  beforeEach(() => {
    process.env.INVENTORY_TABLE = 'test-inventory-table';
    process.env.PHARMACIES_TABLE = 'test-pharmacies-table';

    mockSend.mockReset();
    // Default: any pharmacy-enrichment lookup beyond the initial scan resolves
    // to "not found" unless a test overrides it with mockResolvedValueOnce.
    mockSend.mockResolvedValue({});
  });

  it('should return 400 for missing query parameter', async () => {
    const event = {
      queryStringParameters: {}
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });

  it('should return 400 for too short query parameter', async () => {
    const event = {
      queryStringParameters: {
        q: 'a'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });

  it('should return 200 with empty results for no matches', async () => {
    const event = {
      queryStringParameters: {
        q: 'nonexistentmedicine'
      }
    };

    mockSend.mockResolvedValueOnce({
      Items: [],
      Count: 0
    });

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.count).toBe(0);
    expect(body.items).toEqual([]);
    expect(body.searchTerm).toBe('nonexistentmedicine');
  });

  it('should return 200 with results when medicines are found', async () => {
    const event = {
      queryStringParameters: {
        q: 'paracetamol'
      }
    };

    const mockItems = [
      { medicine_name: 'paracetamol', pharmacy_id: 'PHARMACY_01', quantity: 100 },
      { medicine_name: 'paracetamol', pharmacy_id: 'PHARMACY_02', quantity: 50 }
    ];

    mockSend.mockResolvedValueOnce({
      Items: mockItems,
      Count: mockItems.length
    });
    // Subsequent calls are per-item pharmacy enrichment lookups, which fall
    // back to the default {} (no Item) set in beforeEach.

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.count).toBe(2);
    expect(body.items).toHaveLength(2);
    expect(body.searchTerm).toBe('paracetamol');
  });

  it('should enrich results with pharmacy details when available', async () => {
    const event = {
      queryStringParameters: {
        q: 'paracetamol'
      }
    };

    mockSend.mockResolvedValueOnce({
      Items: [
        { medicine_name: 'paracetamol', pharmacy_id: 'PHARMACY_01', quantity: 100 }
      ],
      Count: 1
    });
    mockSend.mockResolvedValueOnce({
      Item: { pharmacy_id: 'PHARMACY_01', name: 'Meds Pharmacy', address: '123 Main St' }
    });

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items[0].pharmacy).toEqual({
      pharmacy_id: 'PHARMACY_01',
      name: 'Meds Pharmacy',
      address: '123 Main St'
    });
  });

  it('should return 500 on internal error', async () => {
    const event = {
      queryStringParameters: {
        q: 'paracetamol'
      }
    };

    mockSend.mockReset();
    mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });
});
