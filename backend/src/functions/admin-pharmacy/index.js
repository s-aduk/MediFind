// Admin pharmacy management - CRUD operations for pharmacies
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
    if (httpMethod === 'GET' && path.includes('/admin/pharmacies')) {
      // Get all pharmacies or search
      return await getPharmacies(queryStringParameters);
    } else if (httpMethod === 'GET' && path.includes('/admin/pharmacies/') && pathParameters.pharmacyId) {
      // Get specific pharmacy
      return await getPharmacy(pathParameters.pharmacyId);
    } else if (httpMethod === 'POST' && path === '/admin/pharmacies') {
      // Create new pharmacy
      return await createPharmacy(event.body);
    } else if (httpMethod === 'PUT' && path.includes('/admin/pharmacies/') && pathParameters.pharmacyId) {
      // Update existing pharmacy
      return await updatePharmacy(pathParameters.pharmacyId, event.body);
    } else if (httpMethod === 'DELETE' && path.includes('/admin/pharmacies/') && pathParameters.pharmacyId) {
      // Delete pharmacy
      return await deletePharmacy(pathParameters.pharmacyId);
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

// Get all pharmacies with optional filtering
async function getPharmacies(queryParams) {
  try {
    const limit = parseInt(queryParams.limit) || 50;
    const exclusiveStartKey = queryParams.exclusiveStartKey ? JSON.parse(queryParams.exclusiveStartKey) : undefined;

    let scanParams = {
      TableName: process.env.PHARMACIES_TABLE,
      Limit: limit
    };

    if (exclusiveStartKey) {
      scanParams.ExclusiveStartKey = exclusiveStartKey;
    }

    // Add filtering if query parameters provided
    if (queryParams.name || queryParams.city) {
      const filterExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      let exprIndex = 0;

      if (queryParams.name) {
        filterExpressions.push('contains(#name, :name)');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[`:name${exprIndex}`] = queryParams.name;
        exprIndex++;
      }

      if (queryParams.city) {
        filterExpressions.push('contains(#city, :city)');
        expressionAttributeNames['#city'] = 'address';
        expressionAttributeValues[`:city${exprIndex}`] = queryParams.city;
        exprIndex++;
      }

      if (filterExpressions.length > 0) {
        scanParams.FilterExpression = filterExpressions.join(' AND ');
        scanParams.ExpressionAttributeNames = expressionAttributeNames;
        scanParams.ExpressionAttributeValues = expressionAttributeValues;
      }
    }

    const scanResponse = await docClient.send(new ScanCommand(scanParams));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        count: scanResponse.Count,
        items: scanResponse.Items || [],
        lastEvaluatedKey: scanResponse.LastEvaluatedKey
      })
    };
  } catch (error) {
    console.error('Error getting pharmacies:', error);
    throw error;
  }
}

// Get specific pharmacy by ID
async function getPharmacy(pharmacyId) {
  try {
    if (!pharmacyId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Pharmacy ID is required" })
      };
    }

    const response = await docClient.send(
      new GetCommand({
        TableName: process.env.PHARMACIES_TABLE,
        Key: { pharmacy_id: pharmacyId }
      })
    );

    if (!response.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Pharmacy not found" })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response.Item)
    };
  } catch (error) {
    console.error('Error getting pharmacy:', error);
    throw error;
  }
}

// Create new pharmacy
async function createPharmacy(body) {
  try {
    let pharmacyData;
    try {
      pharmacyData = JSON.parse(body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    // Validate required fields
    const requiredFields = ['name', 'address', 'phone'];
    for (const field of requiredFields) {
      if (!pharmacyData[field]) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Missing required field: ${field}` })
        };
      }
    }

    const pharmacyId = `PHARM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const newPharmacy = {
      pharmacy_id: pharmacyId,
      name: pharmacyData.name,
      address: pharmacyData.address,
      phone: pharmacyData.phone,
      email: pharmacyData.email || '',
      website: pharmacyData.website || '',
      latitude: pharmacyData.latitude || null,
      longitude: pharmacyData.longitude || null,
      is_active: pharmacyData.is_active !== undefined ? pharmacyData.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.PHARMACIES_TABLE,
        Item: newPharmacy
      })
    );

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Pharmacy created successfully",
        pharmacy: newPharmacy
      })
    };
  } catch (error) {
    console.error('Error creating pharmacy:', error);
    throw error;
  }
}

// Update existing pharmacy
async function updatePharmacy(pharmacyId, body) {
  try {
    if (!pharmacyId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Pharmacy ID is required" })
      };
    }

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

    // Check if pharmacy exists
    const existingPharmacy = await docClient.send(
      new GetCommand({
        TableName: process.env.PHARMACIES_TABLE,
        Key: { pharmacy_id: pharmacyId }
      })
    );

    if (!existingPharmacy.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Pharmacy not found" })
      };
    }

    // Build update expression
    const updateExpressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    let exprIndex = 0;

    const updatableFields = ['name', 'address', 'phone', 'email', 'website', 'latitude', 'longitude', 'is_active'];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        updateExpressionParts.push(`#${field} = :${field}${exprIndex}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}${exprIndex}`] = updateData[field];
        exprIndex++;
      }
    }

    // Always update the updated_at timestamp
    updateExpressionParts.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();

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
        TableName: process.env.PHARMACIES_TABLE,
        Key: { pharmacy_id: pharmacyId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    // Get updated item
    const updatedPharmacy = await docClient.send(
      new GetCommand({
        TableName: process.env.PHARMACIES_TABLE,
        Key: { pharmacy_id: pharmacyId }
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Pharmacy updated successfully",
        pharmacy: updatedPharmacy.Item
      })
    };
  } catch (error) {
    console.error('Error updating pharmacy:', error);
    throw error;
  }
}

// Delete pharmacy
async function deletePharmacy(pharmacyId) {
  try {
    if (!pharmacyId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Pharmacy ID is required" })
      };
    }

    // Check if pharmacy exists
    const existingPharmacy = await docClient.send(
      new GetCommand({
        TableName: process.env.PHARMACIES_TABLE,
        Key: { pharmacy_id: pharmacyId }
      })
    );

    if (!existingPharmacy.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Pharmacy not found" })
      };
    }

    // Delete the pharmacy
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.PHARMACIES_TABLE,
        Key: { pharmacy_id: pharmacyId }
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Pharmacy deleted successfully",
        pharmacyId: pharmacyId
      })
    };
  } catch (error) {
    console.error('Error deleting pharmacy:', error);
    throw error;
  }
}