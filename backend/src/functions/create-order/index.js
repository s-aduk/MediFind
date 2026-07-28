// Create a new medicine order
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    // Validate required fields (userId comes from the authenticated caller,
    // not the request body, so it can't be spoofed)
    const requiredFields = ['medicineName', 'pharmacyId', 'quantity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
          },
          body: JSON.stringify({ error: `Missing required field: ${field}` })
        };
      }
    }

    const userId = event.requestContext?.authorizer?.userId;
    const userEmail = event.requestContext?.authorizer?.email;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        body: JSON.stringify({ error: "Unable to determine authenticated user" })
      };
    }

    const { medicineName, pharmacyId, quantity } = body;

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        body: JSON.stringify({ error: "Quantity must be a positive integer" })
      };
    }

    // Look up the caller's profile in the Users table, auto-provisioning a
    // minimal record on first order since Cognito sign-up doesn't currently
    // sync into this table.
    let userResponse = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { user_id: userId }
      })
    );

    if (!userResponse.Item) {
      const newUser = {
        user_id: userId,
        email: userEmail || '',
        created_at: new Date().toISOString()
      };
      await docClient.send(
        new PutCommand({
          TableName: process.env.USERS_TABLE,
          Item: newUser
        })
      );
      userResponse = { Item: newUser };
    }

    // Verify pharmacy exists
    const pharmacyResponse = await docClient.send(
      new GetCommand({
        TableName: process.env.PHARMACIES_TABLE,
        Key: { pharmacy_id: pharmacyId }
      })
    );

    if (!pharmacyResponse.Item) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        body: JSON.stringify({ error: "Pharmacy not found" })
      };
    }

    // Check inventory availability
    const inventoryResponse = await docClient.send(
      new GetCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: medicineName.toLowerCase(),
          pharmacy_id: pharmacyId
        }
      }
    ));

    if (!inventoryResponse.Item) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        body: JSON.stringify({ error: "Medicine not available at this pharmacy" })
      };
    }

    const inventoryItem = inventoryResponse.Item;
    const availableQuantity = inventoryItem.quantity || 0;

    if (availableQuantity < quantity) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        body: JSON.stringify({
          error: `Insufficient stock. Only ${availableQuantity} units available.`
        })
      };
    }

    // Create order
    const orderId = uuidv4();
    const timestamp = new Date().toISOString();

    const newOrder = {
      order_id: orderId,
      user_id: userId,
      medicine_name: medicineName,
      pharmacy_id: pharmacyId,
      quantity: quantity,
      status: 'PENDING',
      created_at: timestamp,
      updated_at: timestamp
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.ORDERS_TABLE,
        Item: newOrder
      })
    );

    // Update inventory (decrease quantity), guarding against concurrent orders
    // overselling stock by requiring sufficient quantity at write time.
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.INVENTORY_TABLE,
          Key: {
            medicine_name: medicineName.toLowerCase(),
            pharmacy_id: pharmacyId
          },
          UpdateExpression: "SET quantity = quantity - :qty, last_updated = :timestamp",
          ConditionExpression: "quantity >= :qty",
          ExpressionAttributeValues: {
            ":qty": quantity,
            ":timestamp": timestamp
          }
        })
      );
    } catch (updateError) {
      if (updateError.name === 'ConditionalCheckFailedException') {
        // Stock was taken by a concurrent order; roll back the order we just created.
        await docClient.send(
          new DeleteCommand({
            TableName: process.env.ORDERS_TABLE,
            Key: { order_id: orderId }
          })
        );
        return {
          statusCode: 409,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
          },
          body: JSON.stringify({ error: "Insufficient stock - it may have just been claimed by another order." })
        };
      }
      throw updateError;
    }

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
      },
      body: JSON.stringify({
        message: "Order created successfully",
        order: newOrder
      })
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};