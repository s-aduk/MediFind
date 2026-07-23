import boto3

# Initialize DynamoDB resource
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")  # Adjust region if needed

# 1. Seed Pharmacies
pharmacies_table = dynamodb.Table("Pharmacies")
pharmacies = [
    {
        "pharmacy_id": "PHARMACY_01",
        "name": "Meds Pharmacy",
        "phone": "+254-700-111222",
        "address": "123 Main St, Building 2",
    },
    {
        "pharmacy_id": "PHARMACY_02",
        "name": "Health Chemist",
        "phone": "+254-700-333444",
        "address": "45 Plaza Rd, Westlands",
    },
    {
        "pharmacy_id": "PHARMACY_03",
        "name": "Life Pharmacy",
        "phone": "+254-700-555666",
        "address": "88 Station Ave, Kilimani",
    },
    {
        "pharmacy_id": "PHARMACY_04",
        "name": "Metro Meds",
        "phone": "+254-700-777888",
        "address": "12 Market St, Eastleigh",
    },
    {
        "pharmacy_id": "PHARMACY_05",
        "name": "Apex Chemist",
        "phone": "+254-700-999000",
        "address": "500 Highway Mall, Upperhill",
    },
]

print("Seeding Pharmacies...")
with pharmacies_table.batch_writer() as batch:
    for p in pharmacies:
        batch.put_item(Item=p)

# 2. Seed Inventory (10 Medicines linked across the 5 Pharmacies)
inventory_table = dynamodb.Table("Inventory")
inventory = [
    {
        "medicine_name": "penicillin",
        "pharmacy_id": "PHARMACY_01",
        "quantity": 50,
        "last_updated": "2026-07-22T08:00:00Z",
    },
    {
        "medicine_name": "penicillin",
        "pharmacy_id": "PHARMACY_02",
        "quantity": 12,
        "last_updated": "2026-07-22T09:30:00Z",
    },
    {
        "medicine_name": "paracetamol",
        "pharmacy_id": "PHARMACY_01",
        "quantity": 100,
        "last_updated": "2026-07-22T07:15:00Z",
    },
    {
        "medicine_name": "paracetamol",
        "pharmacy_id": "PHARMACY_03",
        "quantity": 0,
        "last_updated": "2026-07-21T18:00:00Z",
    },
    {
        "medicine_name": "ibuprofen",
        "pharmacy_id": "PHARMACY_02",
        "quantity": 30,
        "last_updated": "2026-07-22T06:00:00Z",
    },
    {
        "medicine_name": "ibuprofen",
        "pharmacy_id": "PHARMACY_04",
        "quantity": 25,
        "last_updated": "2026-07-22T10:00:00Z",
    },
    {
        "medicine_name": "cetirizine",
        "pharmacy_id": "PHARMACY_03",
        "quantity": 15,
        "last_updated": "2026-07-22T05:45:00Z",
    },
    {
        "medicine_name": "cetirizine",
        "pharmacy_id": "PHARMACY_05",
        "quantity": 40,
        "last_updated": "2026-07-22T08:20:00Z",
    },
    {
        "medicine_name": "metformin",
        "pharmacy_id": "PHARMACY_04",
        "quantity": 60,
        "last_updated": "2026-07-22T09:00:00Z",
    },
    {
        "medicine_name": "metformin",
        "pharmacy_id": "PHARMACY_05",
        "quantity": 5,
        "last_updated": "2026-07-22T10:15:00Z",
    },
]

print("Seeding Inventory...")
with inventory_table.batch_writer() as batch:
    for item in inventory:
        batch.put_item(Item=item)

print("Done! Check your DynamoDB Console.")