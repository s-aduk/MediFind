// Medicine search Lambda - search for medicines in inventory
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Environment variables
const INVENTORY_TABLE = process.env.INVENTORY_TABLE;
const PHARMACIES_TABLE = process.env.PHARMACIES_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

// Common CORS headers
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,OPTIONS"
};

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

    if (event.path === '/health') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ status: 'ok' })
      };
    }

    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const medicineName = queryParams.q || queryParams.medicineName || queryParams.medicineId || '';

    // Validate input
    if (!medicineName || typeof medicineName !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing or invalid query parameter. Provide "q" parameter for medicine name.'
        })
      };
    }

    // Trim and validate medicine name
    const searchTerm = medicineName.trim();
    if (searchTerm.length < 2) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Medicine name must be at least 2 characters long.'
        })
      };
    }

    // Query the Inventory table using GSI_MedicineName for case-insensitive prefix match
    // We query for exact match on lowercased medicine_name, then filter for contains if needed
    // For partial match, we'll use Query with begins_with on the GSI
    const queryParams = {
      TableName: INVENTORY_TABLE,
      IndexName: 'GSI_MedicineName',
      KeyConditionExpression: 'medicine_name = :medicineName',
      ExpressionAttributeValues: {
        ':medicineName': searchTerm.toLowerCase()
      }
    };

    // Add pagination if limit is provided
    if (queryParams.limit) {
      queryParams.Limit = parseInt(queryParams.limit);
    }
    if (queryParams.exclusiveStartKey) {
      queryParams.ExclusiveStartKey = JSON.parse(queryParams.exclusiveStartKey);
    }

    const response = await docClient.send(new QueryCommand(queryParams));
    const items = response.Items || [];

    // If no exact match, we could do a broader search, but for now return exact matches
    // Enrich results with pharmacy information
    const enrichedResults = await Promise.all(
      items.map(async (item) => {
        try {
          // Get pharmacy details if pharmacy_id exists
          if (item.pharmacy_id && PHARMACIES_TABLE) {
            const pharmacyResponse = await docClient.send(
              new GetCommand({
                TableName: PHARMACIES_TABLE,
                Key: { pharmacy_id: item.pharmacy_id }
              })
            );

            if (pharmacyResponse.Item) {
              return {
                ...item,
                pharmacy: pharmacyResponse.Item
              };
            }
          }
          return item;
        } catch (error) {
          console.warn(`Failed to fetch pharmacy for item ${item.medicine_name}:`, error);
          return item; // Return item without pharmacy info if fetch fails
        }
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        count: enrichedResults.length,
        items: enrichedResults,
        searchTerm: searchTerm
      })
    };
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