// __tests__/get-pharmacies.test.js

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

describe('Get Pharmacies Lambda', () => {
  beforeEach(() => {
    process.env.INVENTORY_TABLE = 'test-inventory-table';
    process.env.PHARMACIES_TABLE = 'test-pharmacies-table';

    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('should return 400 for missing medicineName parameter', async () => {
    const event = {
      pathParameters: {
        medicineName: ''
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });

  it('should return 200 with empty results for no matches', async () => {
    const event = {
      pathParameters: {
        medicineName: 'nonexistentmedicine'
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
  });

  it('should return 200 with results when pharmacies are found', async () => {
    const event = {
      pathParameters: {
        medicineName: 'paracetamol'
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

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.count).toBe(2);
    expect(body.items).toHaveLength(2);
  });

  it('should return 500 on internal error', async () => {
    const event = {
      pathParameters: {
        medicineName: 'paracetamol'
      }
    };

    mockSend.mockReset();
    mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });
});
