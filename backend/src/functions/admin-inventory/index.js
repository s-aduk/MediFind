// Admin inventory management - CRUD operations for inventory
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Common CORS headers
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

// Helper to check admin authorization
function checkAdminAuth(event) {
  const role = event.requestContext?.authorizer?.role;
  return role === 'admin';
}

// Helper to parse composite key from path
function parseInventoryPath(path) {
  // Path format: /admin/inventory/{medicineName}/{pharmacyId}
  const match = path.match(/\/admin\/inventory\/([^\/]+)\/([^\/]+)$/);
  if (match) {
    return { medicineName: decodeURIComponent(match[1]), pharmacyId: decodeURIComponent(match[2]) };
  }
  return null;
}

exports.handler = async (event) => {
  try {
    // Check admin authorization for all admin endpoints
    if (!checkAdminAuth(event)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Admin access required" })
      };
    }

    const httpMethod = event.httpMethod;
    const path = event.path;
    const queryStringParameters = event.queryStringParameters || {};
    const pathParameters = event.pathParameters || {};

    // Route based on HTTP method and path
    if (httpMethod === 'GET' && path === '/admin/inventory') {
      // Get inventory items (with optional filtering via query params)
      return await getInventory(queryStringParameters);
    } else if (httpMethod === 'GET' && path.includes('/admin/inventory/')) {
      // Get specific inventory item by composite key in path
      const keys = parseInventoryPath(path);
      if (keys) {
        return await getInventoryItem(keys.medicineName, keys.pharmacyId);
      }
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid inventory path. Use /admin/inventory/{medicineName}/{pharmacyId}" })
      };
    } else if (httpMethod === 'POST' && path === '/admin/inventory') {
      // Create new inventory item
      return await createInventoryItem(event.body);
    } else if (httpMethod === 'PUT' && path.includes('/admin/inventory/')) {
      // Update existing inventory item (composite key in path)
      const keys = parseInventoryPath(path);
      if (keys) {
        return await updateInventoryItem(keys.medicineName, keys.pharmacyId, event.body);
      }
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid inventory path. Use /admin/inventory/{medicineName}/{pharmacyId}" })
      };
    } else if (httpMethod === 'DELETE' && path.includes('/admin/inventory/')) {
      // Delete existing inventory item (composite key in path)
      const keys = parseInventoryPath(path);
      if (keys) {
        return await deleteInventoryItem(keys.medicineName, keys.pharmacyId);
      }
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid inventory path. Use /admin/inventory/{medicineName}/{pharmacyId}" })
      };
    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }
  } catch (error) {
    console.error('Error processing request:', error);

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

// Get inventory items with filtering
async function getInventory(queryParams) {
  try {
    const limit = parseInt(queryParams.limit) || 50;
    const exclusiveStartKey = queryParams.exclusiveStartKey ? JSON.parse(queryParams.exclusiveStartKey) : undefined;

    let scanParams = {
      TableName: process.env.INVENTORY_TABLE,
      Limit: limit
    };

    if (exclusiveStartKey) {
      scanParams.ExclusiveStartKey = exclusiveStartKey;
    }

    // Build filter expression from query parameters
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    let exprIndex = 0;

    // Filter by medicine_name
    if (queryParams.medicineName) {
      filterExpressions.push('#medicine_name = :medicineName');
      expressionAttributeNames['#medicine_name'] = 'medicine_name';
      expressionAttributeValues[`:medicineName${exprIndex}`] = queryParams.medicineName.toLowerCase();
      exprIndex++;
    }

    // Filter by pharmacy_id
    if (queryParams.pharmacyId) {
      filterExpressions.push('#pharmacy_id = :pharmacyId');
      expressionAttributeNames['#pharmacy_id'] = 'pharmacy_id';
      expressionAttributeValues[`:pharmacyId${exprIndex}`] = queryParams.pharmacyId;
      exprIndex++;
    }

    // Filter by minimum quantity
    if (queryParams.minQuantity !== undefined) {
      filterExpressions.push('#qty >= :minQuantity');
      expressionAttributeNames['#qty'] = 'quantity';
      expressionAttributeValues[`:minQuantity${exprIndex}`] = parseInt(queryParams.minQuantity);
      exprIndex++;
    }

    // Filter by maximum quantity
    if (queryParams.maxQuantity !== undefined) {
      filterExpressions.push('#qty <= :maxQuantity');
      expressionAttributeNames['#qty'] = 'quantity';
      expressionAttributeValues[`:maxQuantity${exprIndex}`] = parseInt(queryParams.maxQuantity);
      exprIndex++;
    }

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    const scanResponse = await docClient.send(new ScanCommand(scanParams));

    // Enrich each item with pharmacy details
    const enrichedItems = await Promise.all(
      (scanResponse.Items || []).map(async (item) => {
        try {
          if (item.pharmacy_id) {
            const pharmacyResponse = await docClient.send(
              new GetCommand({
                TableName: process.env.PHARMACIES_TABLE,
                Key: { pharmacy_id: item.pharmacy_id }
              })
            );

            if (pharmacyResponse.Item) {
              item.pharmacy = pharmacyResponse.Item;
            }
          }
        } catch (error) {
          console.warn(`Failed to enrich inventory item ${item.medicine_name}@${item.pharmacy_id}:`, error);
        }
        return item;
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        count: enrichedItems.length,
        items: enrichedItems,
        lastEvaluatedKey: scanResponse.LastEvaluatedKey
      })
    };
  } catch (error) {
    console.error('Error getting inventory:', error);
    throw error;
  }
}

// Get specific inventory item by composite key
async function getInventoryItem(medicineName, pharmacyId) {
  try {
    const response = await docClient.send(
      new GetCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: medicineName.toLowerCase(),
          pharmacy_id: pharmacyId
        }
      })
    );

    if (!response.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Inventory item not found" })
      };
    }

    // Enrich with pharmacy details
    const item = response.Item;
    if (item.pharmacy_id) {
      const pharmacyResponse = await docClient.send(
        new GetCommand({
          TableName: process.env.PHARMACIES_TABLE,
          Key: { pharmacy_id: item.pharmacy_id }
        })
      );
      if (pharmacyResponse.Item) {
        item.pharmacy = pharmacyResponse.Item;
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(item)
    };
  } catch (error) {
    console.error('Error getting inventory item:', error);
    throw error;
  }
}

// Create new inventory item
async function createInventoryItem(body) {
  try {
    let inventoryData;
    try {
      inventoryData = JSON.parse(body);
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
      if (inventoryData[field] === undefined) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Missing required field: ${field}` })
        };
      }
    }

    // Validate quantity
    if (!Number.isInteger(inventoryData.quantity) || inventoryData.quantity < 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Quantity must be a non-negative integer" })
      };
    }

    // Check if the medicine exists at this pharmacy already (to avoid duplicates)
    const existingItem = await docClient.send(
      new GetCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: inventoryData.medicineName.toLowerCase(),
          pharmacy_id: inventoryData.pharmacyId
        }
      })
    );

    if (existingItem.Item) {
      return {
        statusCode: 409, // Conflict
        headers: corsHeaders,
        body: JSON.stringify({ error: "Inventory item already exists for this medicine and pharmacy" })
      };
    }

    // Create new inventory item
    const timestamp = new Date().toISOString();
    const newItem = {
      medicine_name: inventoryData.medicineName.toLowerCase(),
      pharmacy_id: inventoryData.pharmacyId,
      quantity: inventoryData.quantity,
      last_updated: timestamp,
      created_at: timestamp,
      // Optional fields
      price: inventoryData.price || null,
      threshold: inventoryData.threshold || null // for low stock alerts
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.INVENTORY_TABLE,
        Item: newItem
      })
    );

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Inventory item created successfully",
        item: newItem
      })
    };
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
}

// Update existing inventory item
async function updateInventoryItem(medicineName, pharmacyId, body) {
  try {
    let updateData;
    try {
      updateData = JSON.parse(body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    // Check if the item exists
    const existingItem = await docClient.send(
      new GetCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: medicineName.toLowerCase(),
          pharmacy_id: pharmacyId
        }
      })
    );

    if (!existingItem.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Inventory item not found" })
      };
    }

    // Build update expression
    const updateExpressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    let exprIndex = 0;

    const updatableFields = ['quantity', 'price', 'threshold'];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        updateExpressionParts.push(`#${field} = :${field}${exprIndex}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}${exprIndex}`] = updateData[field];
        exprIndex++;
      }
    }

    // Always update the last_updated timestamp
    updateExpressionParts.push('#last_updated = :last_updated');
    expressionAttributeNames['#last_updated'] = 'last_updated';
    expressionAttributeValues[':last_updated'] = new Date().toISOString();

    if (updateExpressionParts.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "No valid fields to update" })
      };
    }

    const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

    await docClient.send(
      new UpdateCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: medicineName.toLowerCase(),
          pharmacy_id: pharmacyId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    // Get updated item
    const updatedItem = await docClient.send(
      new GetCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: medicineName.toLowerCase(),
          pharmacy_id: pharmacyId
        }
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Inventory item updated successfully",
        item: updatedItem.Item
      })
    };
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
}

// Delete inventory item
async function deleteInventoryItem(medicineName, pharmacyId) {
  try {
    // Check if item exists
    const existingItem = await docClient.send(
      new GetCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: medicineName.toLowerCase(),
          pharmacy_id: pharmacyId
        }
      })
    );

    if (!existingItem.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Inventory item not found" })
      };
    }

    // Delete the item
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          medicine_name: medicineName.toLowerCase(),
          pharmacy_id: pharmacyId
        }
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Inventory item deleted successfully",
        medicineName,
        pharmacyId
      })
    };
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}