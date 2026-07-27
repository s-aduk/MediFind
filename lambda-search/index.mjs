import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    // 1. Get search term passed from React query string (e.g., ?medicineName=paracetamol)
    const medicineName = 
      event.queryStringParameters?.medicineName || 
      event.queryStringParameters?.medicineId || 
      "";

    const command = new ScanCommand({
      TableName: "Inventory"
    });

    // 2. Scan all items from DynamoDB Inventory
    const response = await docClient.send(command);
    let items = response.Items || [];

    // 3. Filter items in Node.js (case-insensitive search)
    if (medicineName) {
      const searchLower = medicineName.toLowerCase();
      items = items.filter(item => {
        const medName = item.medicineName || item.medicine_name || "";
        return medName.toLowerCase().includes(searchLower);
      });
    }

    // 4. Return matching items (including price, pharmacy_id, quantity) to React
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(items)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
};