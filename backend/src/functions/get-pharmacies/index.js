// Get pharmacies with medicine in stock
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // Get medicine name from path parameters
    const medicineName = event.pathParameters?.medicineName;

    if (!medicineName || medicineName.trim() === '') {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        body: JSON.stringify({ error: "Medicine name is required" })
      };
    }

    const searchTerm = medicineName.trim().toLowerCase();

    // Scan the Inventory table with a filter for case-insensitive partial match on medicine_name
    const scanParams = {
      TableName: process.env.INVENTORY_TABLE,
      FilterExpression: "contains(#medicine_name, :searchTerm)",
      ExpressionAttributeNames: {
        "#medicine_name": "medicine_name"
      },
      ExpressionAttributeValues: {
        ":searchTerm": searchTerm
      }
    };

    // Add pagination if limit is provided
    if (event.queryStringParameters && event.queryStringParameters.limit) {
      scanParams.Limit = parseInt(event.queryStringParameters.limit);
    }
    if (event.queryStringParameters && event.queryStringParameters.exclusiveStartKey) {
      scanParams.ExclusiveStartKey = JSON.parse(event.queryStringParameters.exclusiveStartKey);
    }

    const scanResponse = await docClient.send(new ScanCommand(scanParams));
    const items = scanResponse.Items || [];

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
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify({
        count: enrichedItems.length,
        items: enrichedItems,
        lastEvaluatedKey: scanResponse.LastEvaluatedKey
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