// __tests__/create-order.test.js

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend }))
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({ send: mockSend }))
  },
  PutCommand: jest.fn((params) => ({ __type: 'Put', ...params })),
  GetCommand: jest.fn((params) => ({ __type: 'Get', ...params })),
  QueryCommand: jest.fn((params) => ({ __type: 'Query', ...params })),
  UpdateCommand: jest.fn((params) => ({ __type: 'Update', ...params })),
  DeleteCommand: jest.fn((params) => ({ __type: 'Delete', ...params }))
}));

jest.mock('uuid', () => ({ v4: () => 'test-order-id' }));

const { handler } = require('../index');

const authedEvent = (body) => ({
  body: JSON.stringify(body),
  requestContext: {
    authorizer: {
      userId: 'test-user-id',
      email: 'test@example.com'
    }
  }
});

describe('Create Order Lambda', () => {
  beforeEach(() => {
    process.env.USERS_TABLE = 'test-users-table';
    process.env.PHARMACIES_TABLE = 'test-pharmacies-table';
    process.env.INVENTORY_TABLE = 'test-inventory-table';
    process.env.ORDERS_TABLE = 'test-orders-table';
    mockSend.mockReset();
  });

  it('should return 400 for invalid JSON body', async () => {
    const response = await handler({ body: '{not json', requestContext: {} });
    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for missing required fields', async () => {
    const response = await handler(authedEvent({ medicineName: 'paracetamol' }));
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toMatch(/pharmacyId/);
  });

  it('should return 401 when the authorizer context has no userId', async () => {
    const event = {
      body: JSON.stringify({ medicineName: 'paracetamol', pharmacyId: 'PHARMACY_01', quantity: 1 }),
      requestContext: {}
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(401);
  });

  it('should return 400 for a non-positive quantity', async () => {
    const response = await handler(
      authedEvent({ medicineName: 'paracetamol', pharmacyId: 'PHARMACY_01', quantity: 0 })
    );
    expect(response.statusCode).toBe(400);
  });

  it('should auto-provision the user record and create an order on success', async () => {
    mockSend
      .mockResolvedValueOnce({}) // GetCommand user - not found
      .mockResolvedValueOnce({}) // PutCommand new user
      .mockResolvedValueOnce({ Item: { pharmacy_id: 'PHARMACY_01', name: 'Test Pharmacy' } }) // pharmacy exists
      .mockResolvedValueOnce({ Item: { medicine_name: 'paracetamol', pharmacy_id: 'PHARMACY_01', quantity: 10 } }) // inventory
      .mockResolvedValueOnce({}) // PutCommand order
      .mockResolvedValueOnce({}); // UpdateCommand inventory decrement

    const response = await handler(
      authedEvent({ medicineName: 'paracetamol', pharmacyId: 'PHARMACY_01', quantity: 2 })
    );

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.order.user_id).toBe('test-user-id');
    expect(body.order.quantity).toBe(2);
    expect(body.order.status).toBe('PENDING');
  });

  it('should return 404 when the pharmacy does not exist', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: { user_id: 'test-user-id' } }) // user exists
      .mockResolvedValueOnce({}); // pharmacy not found

    const response = await handler(
      authedEvent({ medicineName: 'paracetamol', pharmacyId: 'GHOST_PHARMACY', quantity: 1 })
    );

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toMatch(/Pharmacy/);
  });

  it('should return 400 when requested quantity exceeds stock', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: { user_id: 'test-user-id' } })
      .mockResolvedValueOnce({ Item: { pharmacy_id: 'PHARMACY_01' } })
      .mockResolvedValueOnce({ Item: { medicine_name: 'paracetamol', pharmacy_id: 'PHARMACY_01', quantity: 1 } });

    const response = await handler(
      authedEvent({ medicineName: 'paracetamol', pharmacyId: 'PHARMACY_01', quantity: 5 })
    );

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toMatch(/Insufficient stock/);
  });

  it('should return 409 and roll back the order if stock is claimed concurrently', async () => {
    const conditionalError = new Error('The conditional request failed');
    conditionalError.name = 'ConditionalCheckFailedException';

    mockSend
      .mockResolvedValueOnce({ Item: { user_id: 'test-user-id' } })
      .mockResolvedValueOnce({ Item: { pharmacy_id: 'PHARMACY_01' } })
      .mockResolvedValueOnce({ Item: { medicine_name: 'paracetamol', pharmacy_id: 'PHARMACY_01', quantity: 5 } })
      .mockResolvedValueOnce({}) // order Put
      .mockRejectedValueOnce(conditionalError) // inventory Update fails
      .mockResolvedValueOnce({}); // order Delete rollback

    const response = await handler(
      authedEvent({ medicineName: 'paracetamol', pharmacyId: 'PHARMACY_01', quantity: 2 })
    );

    expect(response.statusCode).toBe(409);
    expect(mockSend).toHaveBeenCalledTimes(6);
  });
});
