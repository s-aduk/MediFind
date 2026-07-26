import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto"; // Built into Node.js 14.x+

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // 1. Generate a clean, unique orderId
    // Generates something like: "ORD-a1b2c3d4"
    const generatedOrderId = `ORD-${randomUUID().substring(0, 8)}`;

    // 2. Build the item object
    const newInventoryItem = {
      pharmacyId: body.pharmacyId || "PHARM-101", // Your Primary Key
      orderId: generatedOrderId,                  // Your new regular field!
      medicineName: body.medicineName || "Aspirin",
      quantity: body.quantity || 1,
      updatedAt: new Date().toISOString()
    };

    // 3. Write/Update the item in your DynamoDB table
    const command = new PutCommand({
      TableName: "Inventory", // Your table name
      Item: newInventoryItem
    });

    await docClient.send(command);

    // 4. Return the complete saved record back to the frontend
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Order updated successfully!",
        data: newInventoryItem // Frontend receives the actual orderId!
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
};