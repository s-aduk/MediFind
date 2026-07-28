# 04: Database Seeding Procedure

## When to Use
- Initial environment setup (dev, staging, production)
- Resetting test data after development cycles
- Populating reference data (medicines, pharmacy locations)
- Recovering from data loss scenarios
- Setting up demo environments for presentations or training

## Prerequisites
- AWS CLI configured with appropriate permissions for the target environment
- Python 3.8+ installed
- `boto3` library installed (`pip install boto3`)
- Access to DynamoDB tables in the target environment
- Understanding of the data model (PK/SK structure, GSIs)

## Safety Considerations
⚠️ **IMPORTANT**: This procedure will WRITE data to DynamoDB tables.
- **Never** run against production without explicit approval
- Always verify you're targeting the correct environment (check AWS_PROFILE)
- Consider using DynamoDB Local or a dedicated dev/test environment for development work
- For production reseeding, coordinate with product team as this may affect live data

## Environment Setup
Set these variables based on your target environment:
```bash
# For Development
export AWS_PROFILE=mediFind-dev
export AWS_REGION=us-east-1

# For Staging  
export AWS_PROFILE=mediFind-staging
export AWS_REGION=us-east-1

# For Production (USE WITH EXTREME CAUTION)
# export AWS_PROFILE=mediFind-production
# export AWS_REGION=us-east-1
```

## Seeding Script Location
The seeding script is located at: `backend/seed_data.py`

## Seeding Process Overview
The script seeds two main entities:
1. **Pharmacies**: 5 sample pharmacies with contact information
2. **Inventory**: Medicine stock levels across the pharmacies (10 medicine-pharmacy combinations)

## Step-by-Step Procedure

### 1. Verify Environment Target
```bash
# Check which AWS profile/configuration you're using
aws sts get-caller-identity --profile $AWS_PROFILE

# List tables to confirm you can access the right environment
aws dynamodb list-tables --profile $AWS_PROFILE --query "TableNames[?contains(@, 'Pharmacies') || contains(@, 'Inventory')]"
```

### 2. Optional: Clear Existing Data (Dev/Staging Only)
⚠️ **Only do this in development or staging environments!**

```bash
# WARNING: This DELETEs ALL data from the tables
# Only run if you explicitly want to start fresh

# Clear Pharmacies table
aws dynamodb scan \
    --table-name Pharmacies \
    --profile $AWS_PROFILE \
    --query "Items[].pharmacy_id" \
    --output text |
while read pharmacy_id; do
    if [ -n "$pharmacy_id" ]; then
        aws dynamodb delete-item \
            --table-name Pharmacies \
            --key '{"pharmacy_id":{"S":"'$pharmacy_id'"}}' \
            --profile $AWS_PROFILE
    fi
done

# Clear Inventory table  
aws dynamodb scan \
    --table-name Inventory \
    --profile $AWS_PROFILE \
    --query "Items[].medicine_name,Items[].pharmacy_id" \
    --output text |
while read medicine_name pharmacy_id; do
    if [ -n "$medicine_name" ] && [ -n "$pharmacy_id" ]; then
        aws dynamodb delete-item \
            --table-name Inventory \
            --key '{"medicine_name":{"S":"'$medicine_name'"},"pharmacy_id":{"S":"'$pharmacy_id'"}}' \
            --profile $AWS_PROFILE
    fi
done
```

### 3. Run the Seeding Script
```bash
cd backend
python seed_data.py
```

### 4. Verify Seeding Results
```bash
# Check pharmacy count
aws dynamodb scan \
    --table-name Pharmacies \
    --select COUNT \
    --profile $AWS_PROFILE

# Check inventory count
aws dynamodb scan \
    --table-name Inventory \
    --select COUNT \
    --profile $AWS_PROFILE

# Sample data verification
echo "Sample Pharmacy Data:"
aws dynamodb get-item \
    --table-name Pharmacies \
    --key '{"pharmacy_id":{"S":"PHARMACY_01"}}' \
    --profile $AWS_PROFILE

echo "Sample Inventory Data:"
aws dynamodb get-item \
    --table-name Inventory \
    --key '{"medicine_name":{"S":"paracetamol"},"pharmacy_id":{"S":"PHARMACY_01"}}' \
    --profile $AWS_PROFILE
```

## Seeding Script Details
The `backend/seed_data.py` script contains hardcoded sample data:

**Pharmacies Sample Data:**
- PHARMACY_01: Meds Pharmacy, Nairobi
- PHARMACY_02: Health Chemist, Westlands  
- PHARMACY_03: Life Pharmacy, Kilimani
- PHARMACY_04: Metro Meds, Eastleigh
- PHARMACY_05: Apex Chemist, Upperhill

**Inventory Sample Data:**
- Penicillin: 50 units @ PHARMACY_01, 12 units @ PHARMACY_02
- Paracetamol: 100 units @ PHARMACY_01, 0 units @ PHARMACY_03 (out of stock)
- Ibuprofen: 30 units @ PHARMACY_02, 25 units @ PHARMACY_04
- Cetirizine: 15 units @ PHARMACY_03, 40 units @ PHARMACY_05
- Metformin: 60 units @ PHARMACY_04, 5 units @ PHARMACY_05

## Customizing Seed Data
To modify the seed data:
1. Edit `backend/seed_data.py`
2. Modify the `pharmacies` and `inventory` arrays
3. Ensure medicine names match what your search functionality expects
4. Consider adding more realistic data patterns for testing

## Automation Options
For regular seeding needs, consider:
1. **CI/CD Integration**: Add a seeding step to your deployment pipeline for dev/staging
2. **Lambda Function**: Create a Lambda function that can be invoked on demand
3. **Step Functions Orchestration**: For complex seeding with dependencies
4. **EventBridge Scheduling**: For periodic data refresh scenarios

## Troubleshooting

### Issue: AccessDeniedException
**Symptom**: User is not authorized to perform: dynamodb:BatchWriteItem on resource:
**Solution**: 
- Check IAM permissions for the AWS profile being used
- Ensure the role/user has `dynamodb:BatchWriteItem`, `dynamodb:PutItem` on the target tables
- Verify you're using the correct AWS_PROFILE

### Issue: ResourceNotFoundException
**Symptom**: Cannot do operations on a non-existent table
**Solution**:
- Verify table names match those in your CloudFormation stack
- Check that you're targeting the correct region/environment
- Ensure infrastructure has been deployed successfully

### Issue: ProvisionedThroughputExceededException
**Symptom**: Throughput exceeds the provisioned capacity for the table
**Solution**:
- For development/staging: Consider switching to on-demand billing mode temporarily
- For production: Check if auto-scaling is configured properly
- Reduce batch size in the seeding script if needed
- Retry with exponential backoff

### Issue: ValidationError
**Symptom**: Invalid key(s) provided
**Solution**:
- Verify your table's key schema matches what the script expects
- Check that you're providing all required key attributes
- Look at the actual table description: `aws dynamodb describe-table`

## Best Practices
1. **Environment Verification**: Always double-check AWS_PROFILE before running
2. **Idempotency**: The current script is NOT idempotent - running twice will create duplicates
3. **Data Backups**: Consider backing up existing data before seeding in non-dev environments
4. **Version Control**: Keep seed data in version control to track what data represents which application version
5. **Realistic Data**: For performance testing, consider using tools to generate larger, more realistic datasets
6. **Clean Up**: Have a procedure to remove test data when no longer needed

## Related Runbooks
- 01-deploy-to-staging.md: Deploys infrastructure that this script interacts with
- 02-deploy-to-production.md: Production deployment considerations
- 05-view-logs.md: How to check CloudWatch logs if seeding fails
- 06-troubleshoot-lambda-timeouts.md: Related to DynamoDB performance issues
