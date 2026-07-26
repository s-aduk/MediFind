import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB Client
const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "Inventory";

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // 1. Parse body
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { drugName, maxPrice } = body;

    // 2. Scan DynamoDB for matching medicine_name
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "contains(#name, :searchName)",
      ExpressionAttributeNames: {
        "#name": "medicine_name",
      },
      ExpressionAttributeValues: {
        ":searchName": drugName,
      },
    });

    const dbResult = await docClient.send(command);
    let items = dbResult.Items || [];

    // Optional: Filter by maxPrice in memory
    if (maxPrice) {
      items = items.filter((item) => item.price <= maxPrice);
    }

    // 3. Return HTTP response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({
        success: true,
        count: items.length,
        results: items,
      }),
    };
  } catch (error) {
    console.error("Error executing search:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        message: "Internal server error during drug search.",
        error: error.message,
      }),
    };
  }
};