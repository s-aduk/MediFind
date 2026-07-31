# 04: Database Seeding Procedure

## When to Use
- Initial environment setup (dev, staging, production)
- Resetting sample data after development cycles
- Setting up demo environments

## Prerequisites
- AWS CLI configured with appropriate permissions for the target environment
- Python >= 3.9
- `boto3` installed (`pip install boto3`)
- Access to the target environment's DynamoDB tables

## Safety Considerations
**This procedure WRITES data to DynamoDB tables.**
- Always verify you're targeting the correct environment (check `AWS_REGION`/`ENVIRONMENT_NAME` before running)
- Running this against a production stack with real data will overwrite any of its own sample records if they happen to already exist there (same primary keys) - it will not touch unrelated data, but don't run it against production casually

## Environment Setup
The script reads its target from environment variables, not CLI flags:
```bash
export ENVIRONMENT_NAME=dev       # must match the EnvironmentName you deployed with - default is 'dev'
export AWS_REGION=us-east-1       # must match your deploy region - default is 'us-east-1'
```
Table names are derived as `${ENVIRONMENT_NAME}-pharmacies` and `${ENVIRONMENT_NAME}-inventory` - if these don't match what you actually deployed, you'll get a `ResourceNotFoundException`. Check with:
```bash
aws cloudformation describe-stacks --stack-name <your-stack> \
  --query "Stacks[0].Outputs[?OutputKey=='PharmaciesTableName' || OutputKey=='InventoryTableName']"
```

## Seeding Script Location
`backend/seed_data.py`

## What It Seeds
1. **Pharmacies**: 5 sample pharmacies (`PHARMACY_01` through `PHARMACY_05`) with name, phone, and address
2. **Inventory**: 20 rows across **10 medicines**, 2 pharmacies each, with realistic prices and a deliberate mix of stock levels (including a couple at 0 and a couple in single digits, so the UI's in-stock/low-stock/out-of-stock states have something to show)

## Step-by-Step Procedure

### 1. Verify environment target
```bash
aws sts get-caller-identity --profile $AWS_PROFILE

aws dynamodb list-tables --profile $AWS_PROFILE \
  --query "TableNames[?contains(@, '${ENVIRONMENT_NAME}-pharmacies') || contains(@, '${ENVIRONMENT_NAME}-inventory')]"
```

### 2. Run the seeding script
```bash
cd backend
python3 seed_data.py
```
Output confirms how many pharmacies/inventory rows/distinct medicines were written.

### 3. Verify results
```bash
aws dynamodb scan --table-name ${ENVIRONMENT_NAME}-pharmacies --select COUNT --profile $AWS_PROFILE
aws dynamodb scan --table-name ${ENVIRONMENT_NAME}-inventory --select COUNT --profile $AWS_PROFILE

aws dynamodb get-item \
    --table-name ${ENVIRONMENT_NAME}-pharmacies \
    --key '{"pharmacy_id":{"S":"PHARMACY_01"}}' \
    --profile $AWS_PROFILE

aws dynamodb get-item \
    --table-name ${ENVIRONMENT_NAME}-inventory \
    --key '{"medicine_name":{"S":"paracetamol"},"pharmacy_id":{"S":"PHARMACY_01"}}' \
    --profile $AWS_PROFILE
```

## Current Seed Data (as of the last update to `seed_data.py`)

**Pharmacies**: PHARMACY_01 (Meds Pharmacy), PHARMACY_02 (Health Chemist), PHARMACY_03 (Life Pharmacy), PHARMACY_04 (Metro Meds), PHARMACY_05 (Apex Chemist)

**Inventory** (medicine | pharmacy | quantity | price):
| Medicine | Pharmacy | Qty | Price |
|---|---|---|---|
| penicillin | PHARMACY_01 | 50 | $8.50 |
| penicillin | PHARMACY_02 | 12 | $9.00 |
| paracetamol | PHARMACY_01 | 100 | $3.25 |
| paracetamol | PHARMACY_03 | 0 (out of stock) | $3.50 |
| ibuprofen | PHARMACY_02 | 30 | $4.75 |
| ibuprofen | PHARMACY_04 | 25 | $4.50 |
| cetirizine | PHARMACY_03 | 15 | $6.00 |
| cetirizine | PHARMACY_05 | 40 | $5.75 |
| metformin | PHARMACY_04 | 60 | $7.25 |
| metformin | PHARMACY_05 | 5 | $7.60 |
| amoxicillin | PHARMACY_01 | 45 | $10.20 |
| amoxicillin | PHARMACY_03 | 8 | $10.80 |
| omeprazole | PHARMACY_02 | 22 | $12.00 |
| omeprazole | PHARMACY_05 | 0 (out of stock) | $12.50 |
| atorvastatin | PHARMACY_01 | 33 | $14.90 |
| atorvastatin | PHARMACY_04 | 18 | $15.25 |
| azithromycin | PHARMACY_02 | 6 | $18.00 |
| azithromycin | PHARMACY_03 | 27 | $17.50 |
| loratadine | PHARMACY_04 | 50 | $5.10 |
| loratadine | PHARMACY_05 | 14 | $5.40 |

This table will go stale if `seed_data.py` is edited again without updating this doc - treat it as a snapshot, and check the actual file if in doubt.

## Customizing Seed Data
1. Edit `backend/seed_data.py`
2. `medicine_name` should be lowercase - the search/lookup Lambdas do a case-sensitive substring match against pre-lowercased query terms, so mixed-case medicine names in seed data won't be found correctly
3. **Price values must go through `Decimal(str(value))`, not a raw Python float.** boto3's DynamoDB client rejects native floats outright (`TypeError: Float types are not supported`). The script already handles this via a conversion loop after the inventory list - if you add new items, they'll be covered automatically as long as they go through that same list

## Troubleshooting

### AccessDeniedException
Check IAM permissions for the profile - needs `dynamodb:BatchWriteItem`/`dynamodb:PutItem` on the target tables.

### ResourceNotFoundException
Table names don't match. Most likely cause: `ENVIRONMENT_NAME` doesn't match what you actually deployed with. Check the stack outputs (see step 1 above) rather than guessing.

### TypeError: Float types are not supported
You added a new numeric field without converting it through `Decimal(str(...))` first. See "Customizing Seed Data" above.

## Idempotency
Running the script multiple times is **safe and idempotent** for this data - every item uses a fixed, deterministic primary key (`pharmacy_id`, or `medicine_name`+`pharmacy_id`), and DynamoDB's `PutItem` overwrites by primary key rather than inserting a new row. Re-running won't create duplicates; it'll just rewrite the same items with the same values.

## Related
- `01-deploy-to-staging.md` / `02-deploy-to-production.md`: deploy the infrastructure this script writes into
- `FIXES.md`: history of what's changed in `seed_data.py` and why (originally had only 5 medicines and no prices; also originally crashed on the float/Decimal issue described above before it was caught and fixed)
