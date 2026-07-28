// Admin inventory management - CRUD operations for inventory
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const httpMethod = event.httpMethod;
    const path = event.path;
    const queryStringParameters = event.queryStringParameters || {};
    const pathParameters = event.pathParameters || {};

    // Route based on HTTP method and path
    if (httpMethod === 'GET' && path.includes('/admin/inventory')) {
      // Get inventory items (with optional filtering)
      return await getInventory(queryStringParameters);
    } else if (httpMethod === 'GET' && path.includes('/admin/inventory/') && pathParameters.inventoryId) {
      // Get specific inventory item (by composite key: medicine_name and pharmacy_id)
      // Note: We expect the path to be /admin/inventory/{medicineName}/{pharmacyId}
      // But API Gateway doesn't naturally support two path parameters in one variable easily.
      // Alternative: use query parameters or change the path structure.
      // For simplicity, let's assume we pass medicineName and pharmacyId as query parameters for GET by ID.
      // Actually, let's change the approach: we'll use query parameters for filtering in GET /admin/inventory
      // and for getting a specific item we'll require both medicineName and pharmacyId in query string.
      // However, to keep the API consistent, let's handle the GET by ID via query parameters in the same endpoint.
      // So we'll treat /admin/inventory as a collection endpoint that supports filtering by medicineName and pharmacyId.
      // Therefore, we don't need a separate GET by ID path. Instead, we'll use query parameters.
      // But the requirement might be to get a specific inventory item by its composite key.
      // Let's adjust: we'll support getting a specific item by providing both medicineName and pharmacyId in query string.
      // If the path has an ID, we'll treat it as a medicineName and expect pharmacyId in query string? That's messy.
      // Let's reconsider the API design for the admin inventory:
      //   GET /admin/inventory -> list with filters (medicineName, pharmacyId, etc.)
      //   GET /admin/inventory/{medicineName}/{pharmacyId} -> get specific item (if we want to support this)
      //   POST /admin/inventory -> create
      //   PUT /admin/inventory/{medicineName}/{pharmacyId} -> update
      //   DELETE /admin/inventory/{medicineName}/{pharmacyId} -> delete
      //
      // However, note that the API Gateway path parameter for a composite key is tricky because we have two parts.
      // We can use a single path parameter that encodes both, or use two path parameters by defining the path as:
      //   /admin/inventory/{medicineName}/{pharmacyId}
      // But then we have to define two path parameters in the API Gateway.
      //
      // Given the complexity, and to keep it simple, let's stick to using query parameters for filtering and getting a specific item.
      // We'll change the requirement: to get a specific inventory item, the client must provide both medicineName and pharmacyId as query parameters.
      // So we'll only have one endpoint: GET /admin/inventory (with query parameters for filtering and getting one item)
      //
      // But wait, the original SAM template we wrote for AdminInventoryFunction had:
      //   Path: /admin/inventory
      //   Method: ANY
      // So it's a single endpoint for all methods. We'll have to handle the different methods and use query parameters for filtering and identification.
      //
      // Therefore, we don't need to handle the path with ID. We'll only use the base path /admin/inventory and use:
      //   GET: list or get one (if medicineName and pharmacyId are provided in query string)
      //   POST: create
      //   PUT: update (requires medicineName and pharmacyId in query string to identify the item)
      //   DELETE: delete (requires medicineName and pharmacyId in query string to identify the item)
      //
      // Let's adjust the logic accordingly.

      // Since we are in the GET branch and the path is exactly /admin/inventory (no extra path), we'll use query parameters.
      // If there are additional path segments, we'll treat it as an error for now.
      if (Object.keys(pathParameters).length === 0) {
        return await getInventory(queryStringParameters);
      } else {
        // If there are path parameters, we don't have a handler for that yet.
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
          },
          body: JSON.stringify({ error: "Invalid URL" })
        };
      }
    } else if (httpMethod === 'POST' && path === '/admin/inventory') {
      // Create new inventory item
      return await createInventoryItem(event.body);
    } else if (httpMethod === 'PUT' && path === '/admin/inventory') {
      // Update existing inventory item (requires medicineName and pharmacyId in query string)
      return await updateInventoryItem(queryStringParameters, event.body);
    } else if (httpMethod === 'DELETE' && path === '/admin/inventory') {
      // Delete existing inventory item (requires medicineName and pharmacyId in query string)
      return await deleteInventoryItem(queryStringParameters);
    } else {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
      },
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
      filterExpressions.join(' AND ');
      // Note: We are using a reserved word 'quantity', so we use an alias.
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

    // Enrich each item with pharmacy and medicine details (optional)
    const enrichedItems = await Promise.all(
      (scanResponse.Items || []).map(async (item) => {
        try {
          // Get pharmacy details
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
          // Note: medicine details might be stored elsewhere, but for now we just have the name.
          // If we had a medicines table, we could join here.
        } catch (error) {
          console.warn(`Failed to enrich inventory item ${item.medicine_name}@${item.pharmacy_id}:`, error);
          // Continue without enrichment
        }
        return item;
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
      },
      body: JSON.stringify({
        count: enrichedItems.length,
        items: enrichedItems,
        lastEvaluatedKey: scanResponse.LastEvaluatedKey
      })
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    // Validate required fields
    const requiredFields = ['medicineName', 'pharmacyId', 'quantity'];
    for (const field of requiredFields) {
      if (inventoryData[field] === undefined) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
          },
          body: JSON.stringify({ error: `Missing required field: ${field}` })
        };
      }
    }

    // Validate quantity
    if (!Number.isInteger(inventoryData.quantity) || inventoryData.quantity < 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
      },
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
async function updateInventoryItem(queryParams, body) {
  try {
    // Get the keys from query string
    const medicineName = queryParams.medicineName;
    const pharmacyId = queryParams.pharmacyId;

    if (!medicineName || !pharmacyId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        body: JSON.stringify({ error: "Both medicineName and pharmacyId are required as query parameters for update" })
      };
    }

    let updateData;
    try {
      updateData = JSON.parse(body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
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
        // Additional validation for quantity
        if (field === 'quantity' && (!Number.isInteger(updateData[field]) || updateData[field] < 0)) {
          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
            },
            body: JSON.stringify({ error: "Quantity must be a non-negative integer" })
          };
        }
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
      },
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
async function deleteInventoryItem(queryParams) {
  try {
    // Get the keys from query string
    const medicineName = queryParams.medicineName;
    const pharmacyId = queryParams.pharmacyId;

    if (!medicineName || !pharmacyId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        body: JSON.stringify({ error: "Both medicineName and pharmacyId are required as query parameters for delete" })
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
      },
      body: JSON.stringify({
        message: "Inventory item deleted successfully",
        medicineName: medicineName,
        pharmacyId: pharmacyId
      })
    };
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}