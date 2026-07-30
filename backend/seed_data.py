import os
from decimal import Decimal
import boto3

# Set ENVIRONMENT_NAME to match the EnvironmentName parameter used at deploy
# time (default 'dev'), and AWS_REGION/AWS_DEFAULT_REGION to your deploy region.
ENVIRONMENT_NAME = os.environ.get("ENVIRONMENT_NAME", "dev")
REGION = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))

dynamodb = boto3.resource("dynamodb", region_name=REGION)

# 1. Seed Pharmacies
pharmacies_table = dynamodb.Table(f"{ENVIRONMENT_NAME}-pharmacies")
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

# 2. Seed Inventory - 10 common medicines, each stocked at 2 pharmacies with a
# mix of stock levels (including a couple at 0/low, to show off the
# in-stock / low-stock / out-of-stock states in the UI) and a price so
# results don't all show "On request".
inventory_table = dynamodb.Table(f"{ENVIRONMENT_NAME}-inventory")
inventory = [
    {"medicine_name": "penicillin", "pharmacy_id": "PHARMACY_01", "quantity": 50, "price": 8.50, "last_updated": "2026-07-22T08:00:00Z"},
    {"medicine_name": "penicillin", "pharmacy_id": "PHARMACY_02", "quantity": 12, "price": 9.00, "last_updated": "2026-07-22T09:30:00Z"},

    {"medicine_name": "paracetamol", "pharmacy_id": "PHARMACY_01", "quantity": 100, "price": 3.25, "last_updated": "2026-07-22T07:15:00Z"},
    {"medicine_name": "paracetamol", "pharmacy_id": "PHARMACY_03", "quantity": 0, "price": 3.50, "last_updated": "2026-07-21T18:00:00Z"},

    {"medicine_name": "ibuprofen", "pharmacy_id": "PHARMACY_02", "quantity": 30, "price": 4.75, "last_updated": "2026-07-22T06:00:00Z"},
    {"medicine_name": "ibuprofen", "pharmacy_id": "PHARMACY_04", "quantity": 25, "price": 4.50, "last_updated": "2026-07-22T10:00:00Z"},

    {"medicine_name": "cetirizine", "pharmacy_id": "PHARMACY_03", "quantity": 15, "price": 6.00, "last_updated": "2026-07-22T05:45:00Z"},
    {"medicine_name": "cetirizine", "pharmacy_id": "PHARMACY_05", "quantity": 40, "price": 5.75, "last_updated": "2026-07-22T08:20:00Z"},

    {"medicine_name": "metformin", "pharmacy_id": "PHARMACY_04", "quantity": 60, "price": 7.25, "last_updated": "2026-07-22T09:00:00Z"},
    {"medicine_name": "metformin", "pharmacy_id": "PHARMACY_05", "quantity": 5, "price": 7.60, "last_updated": "2026-07-22T10:15:00Z"},

    {"medicine_name": "amoxicillin", "pharmacy_id": "PHARMACY_01", "quantity": 45, "price": 10.20, "last_updated": "2026-07-22T08:40:00Z"},
    {"medicine_name": "amoxicillin", "pharmacy_id": "PHARMACY_03", "quantity": 8, "price": 10.80, "last_updated": "2026-07-22T09:10:00Z"},

    {"medicine_name": "omeprazole", "pharmacy_id": "PHARMACY_02", "quantity": 22, "price": 12.00, "last_updated": "2026-07-22T07:50:00Z"},
    {"medicine_name": "omeprazole", "pharmacy_id": "PHARMACY_05", "quantity": 0, "price": 12.50, "last_updated": "2026-07-21T17:30:00Z"},

    {"medicine_name": "atorvastatin", "pharmacy_id": "PHARMACY_01", "quantity": 33, "price": 14.90, "last_updated": "2026-07-22T06:20:00Z"},
    {"medicine_name": "atorvastatin", "pharmacy_id": "PHARMACY_04", "quantity": 18, "price": 15.25, "last_updated": "2026-07-22T09:45:00Z"},

    {"medicine_name": "azithromycin", "pharmacy_id": "PHARMACY_02", "quantity": 6, "price": 18.00, "last_updated": "2026-07-22T08:05:00Z"},
    {"medicine_name": "azithromycin", "pharmacy_id": "PHARMACY_03", "quantity": 27, "price": 17.50, "last_updated": "2026-07-22T10:30:00Z"},

    {"medicine_name": "loratadine", "pharmacy_id": "PHARMACY_04", "quantity": 50, "price": 5.10, "last_updated": "2026-07-22T07:00:00Z"},
    {"medicine_name": "loratadine", "pharmacy_id": "PHARMACY_05", "quantity": 14, "price": 5.40, "last_updated": "2026-07-22T09:55:00Z"},
]

# DynamoDB (via boto3) rejects native Python floats outright - it requires
# Decimal for all numeric values. Convert via str() first to avoid binary
# float imprecision (Decimal(5.1) != Decimal("5.1")).
for item in inventory:
    item["price"] = Decimal(str(item["price"]))

print("Seeding Inventory...")
with inventory_table.batch_writer() as batch:
    for item in inventory:
        batch.put_item(Item=item)

print(f"Done! Seeded {len(pharmacies)} pharmacies and {len(inventory)} inventory "
      f"records across {len(set(i['medicine_name'] for i in inventory))} medicines. "
      f"Check your DynamoDB Console.")
