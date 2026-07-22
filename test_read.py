import boto3

print("Connecting to AWS DynamoDB...")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

inventory_table = dynamodb.Table("Inventory")

print("Scanning Inventory table...")
response = inventory_table.scan()
items = response.get("Items", [])

print(f"\nFound {len(items)} items in Inventory:\n")

if not items:
    print(
        "⚠️ The table is EMPTY! You need to run 'python seed_data.py' to add data."
    )
else:
    for item in items:
        med = item.get("medicine_name", "N/A")
        pharm = item.get("pharmacy_id", "N/A")
        qty = item.get("quantity", 0)
        print(f" - Medicine: {med:<15} | Pharmacy: {pharm} | Qty: {qty}")

print("\nDone!")