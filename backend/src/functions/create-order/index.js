// Create a new medicine order
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, TransactWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Common CORS headers
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

// Helper to check authentication
function checkAuth(event) {
  const userId = event.requestContext?.authorizer?.sub;
  return userId;
}

exports.handler = async (event) => {
  try {
    // Check authentication
    const userId = checkAuth(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Authentication required" })
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    // Validate required fields
        const requiredFields = ['medicineName', 'pharmacyId', 'quantity'];
        for (const field of requiredFields) {
          if (!body[field]) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: `Missing required field: ${field}` })
            };
          }
        }

        const { userId, medicineName, pharmacyId, quantity } = body;

            // Get authenticated user ID from authorizer context
            const orderUserId = event.requestContext?.authorizer?.sub || userId;

        // Use authenticated user ID instead of request body
        const orderUserId = userId;

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Quantity must be a positive integer" })
      };
    }

    // Verify user exists (using authenticated user ID)
        const userResponse = await docClient.send(
          new GetCommand({
            TableName: process.env.USERS_TABLE,
            Key: { user_id: orderUserId }
          })
        );

    if (!userResponse.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "User not found" })
      };
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
        headers: corsHeaders,
        body: JSON.stringify({ error: "Pharmacy not found" })
      };
    }

    const medicineKey = medicineName.toLowerCase();

    // Check inventory availability
        const inventoryResponse = await docClient.send(
          new GetCommand({
            TableName: process.env.INVENTORY_TABLE,
            Key: {
              medicine_name: medicineKey,
              pharmacy_id: pharmacyId
            }
          })
        );

    if (!inventoryResponse.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Medicine not available at this pharmacy" })
      };
    }

    const inventoryItem = inventoryResponse.Item;
    const availableQuantity = inventoryItem.quantity || 0;

    if (availableQuantity < quantity) {
      return {
        statusCode: 400,
        headers: corsHeaders,
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
          user_id: orderUserId,
          medicine_name: medicineName,
          pharmacy_id: pharmacyId,
          quantity: quantity,
          status: 'PENDING',
          created_at: timestamp,
          updated_at: timestamp
        };

    // Use TransactWriteItems for atomic order creation and inventory update
    const transactParams = {
      TransactItems: [
        {
          Put: {
            TableName: process.env.ORDERS_TABLE,
            Item: newOrder,
            ConditionExpression: 'attribute_not_exists(order_id)'
          }
        },
        {
          Update: {
            TableName: process.env.INVENTORY_TABLE,
            Key: {
              medicine_name: medicineKey,
              pharmacy_id: pharmacyId
            },
            UpdateExpression: "SET quantity = quantity - :qty, last_updated = :timestamp",
            ConditionExpression: "quantity >= :qty",
            ExpressionAttributeValues: {
              ":qty": quantity,
              ":timestamp": timestamp
            }
          }
        }
      ]
    };

    await docClient.send(new TransactWriteCommand(transactParams));

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Order created successfully",
        order: newOrder
      })
    };
  } catch (error) {
    console.error('Error processing request:', error);

    // Handle specific DynamoDB errors
    if (error.name === 'TransactionCanceledException') {
      const cancellationReasons = error.CancellationReasons || [];
      for (const reason of cancellationReasons) {
        if (reason.Code === 'ConditionalCheckFailed') {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Insufficient stock or order already exists. Please try again.'
            })
          };
        }
      }
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};