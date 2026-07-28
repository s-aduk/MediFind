// Medicine search Lambda - search for medicines in inventory
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Environment variables
const INVENTORY_TABLE = process.env.INVENTORY_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const medicineName = queryParams.q || queryParams.medicineName || queryParams.medicineId || '';

    // Validate input
    if (!medicineName || typeof medicineName !== 'string') {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        body: JSON.stringify({
          error: 'Medicine name must be at least 2 characters long.'
        })
      };
    }

    // Scan the Inventory table with a filter for case-insensitive partial match
    const scanParams = {
      TableName: INVENTORY_TABLE,
      FilterExpression: "contains(lower(#medicine_name), :searchTerm)",
      ExpressionAttributeNames: {
        "#medicine_name": "medicine_name"
      },
      ExpressionAttributeValues: {
        ":searchTerm": searchTerm.toLowerCase()
      }
    };

    // Add pagination if limit is provided
    if (queryParams.limit) {
      scanParams.Limit = parseInt(queryParams.limit);
    }
    if (queryParams.exclusiveStartKey) {
      scanParams.ExclusiveStartKey = JSON.parse(queryParams.exclusiveStartKey);
    }

    const response = await docClient.send(new ScanCommand(scanParams));
    const items = response.Items || [];

    // Enrich results with pharmacy information if needed
    const enrichedResults = await Promise.all(
      items.map(async (item) => {
        try {
          // Get pharmacy details if pharmacy_id exists
          if (item.pharmacy_id) {
            const pharmacyResponse = await docClient.send(
              new GetCommand({
                TableName: USERS_TABLE,
                Key: { user_id: item.pharmacy_id }
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};