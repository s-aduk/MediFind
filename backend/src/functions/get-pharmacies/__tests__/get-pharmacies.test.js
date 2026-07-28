// __tests__/get-pharmacies.test.js
const { handler } = require('../index');

// Mock the DynamoDB client
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

// Mock the AWS SDK clients
jest.mock("@aws-sdk/client-dynamodb");
jest.mock("@aws-sdk/lib-dynamodb");

describe('Get Pharmacies Lambda', () => {
  const mockSend = jest.fn();

  beforeEach(() => {
    process.env.INVENTORY_TABLE = 'test-inventory-table';
    process.env.PHARMACIES_TABLE = 'test-pharmacies-table';
    process.env.USERS_TABLE = 'test-users-table';

    // Clear all mocks before each test
    mockSend.mockReset();
    DynamoDBClient.mockImplementation(() => {
      return {
        send: mockSend
      };
    });
    DynamoDBDocumentClient.from = jest.fn().mockReturnValue({
      send: mockSend
    });
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

    // Mock the DynamoDB scan response
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

    // Mock the DynamoDB scan response with some items
    const mockItems = [
      {
        medicine_name: 'paracetamol',
        pharmacy_id: 'PHARMACY_01',
        quantity: 100
      },
      {
        medicine_name: 'paracetamol',
        pharmacy_id: 'PHARMACY_02',
        quantity: 50
      }
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

    // Mock the DynamoDB scan to throw an error
    mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });
});