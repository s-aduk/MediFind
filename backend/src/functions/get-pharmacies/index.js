// Get pharmacies with medicine in stock
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Common CORS headers
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,OPTIONS"
};

exports.handler = async (event) => {
  try {
    // Get medicine name from path parameters
    const medicineName = event.pathParameters?.medicineName;

    if (!medicineName || medicineName.trim() === '') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Medicine name is required" })
      };
    }

    const searchTerm = medicineName.trim().toLowerCase();

    // Query the Inventory table using GSI_MedicineName for efficient lookup
    const queryParams = {
      TableName: process.env.INVENTORY_TABLE,
      IndexName: 'GSI_MedicineName',
      KeyConditionExpression: 'medicine_name = :searchTerm',
      ExpressionAttributeValues: {
        ':searchTerm': searchTerm
      }
    };

    // Add pagination if limit is provided
    if (event.queryStringParameters && event.queryStringParameters.limit) {
      queryParams.Limit = parseInt(event.queryStringParameters.limit);
    }
    if (event.queryStringParameters && event.queryStringParameters.exclusiveStartKey) {
      queryParams.ExclusiveStartKey = JSON.parse(event.queryStringParameters.exclusiveStartKey);
    }

    const queryResponse = await docClient.send(new QueryCommand(queryParams));
    const items = queryResponse.Items || [];

    // Enrich items with pharmacy and medicine details
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
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
        lastEvaluatedKey: queryResponse.LastEvaluatedKey
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