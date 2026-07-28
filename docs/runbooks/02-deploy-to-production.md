# 02: Deploy to Production Environment

## When to Use
Deploying verified changes from staging to production after passing all tests, security reviews, and stakeholder approvals.

## Prerequisites
- All prerequisites from 01-deploy-to-staging.md
- Successful deployment to staging environment with smoke tests passed
- Approved change management ticket (if required by your organization)
- Maintenance window scheduled and communicated (if applicable)
- Rollback plan reviewed and approved

## Environment Variables
Set these in your shell or use a `.env.production` file:
```bash
export AWS_PROFILE=mediFind-production
export AWS_REGION=us-east-1
export STACK_NAME=medifind-production
export S3_BUCKET=medifind-deployments-production
```

## Deployment Steps
Follow the same steps as in 01-deploy-to-staging.md with these production-specific changes:

### 1. Pre-Deployment Checks
- Ensure staging deployment has been running successfully for at least 1 hour
- Run any required security scans (SAST, DAST, dependency checks)
- Verify disaster recovery backups are current
- Confirm on-call engineer is available during and after deployment

### 2. Package and Deploy Backend Infrastructure
Use the same commands as staging but with production parameters:
```bash
cd infrastructure
sam validate
sam build

sam deploy \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
    --parameter-overrides EnvironmentName=prod \
    --resolve-s3 \
    --no-confirm-changeset \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --no-fail-on-empty-changeset \
    --tags Environment=prod Team=medifind
```

### 3. Production-Specific Notes
- Use `EnvironmentName=prod` (allowed values are `dev`, `staging`, or `prod`)
- Review API Gateway CORS settings before go-live
- AlarmNotificationEmail=set to your operations team distribution list
- Consider enabling provisioned concurrency for critical Lambda functions
- Consider enabling DynamoDB auto-scaling with higher maximum capacity

### 4. Frontend Deployment
Same as staging but to production S3 bucket/CloudFront distribution:
```bash
aws s3 sync frontend/.next s3://medifind-frontend-production._your_account_id_.us-east-1/ \
    --delete \
    --profile $AWS_PROFILE \
    --region $AWS_REGION

# Invalidate production CloudFront
aws cloudfront create-invalidation \
    --distribution-id EABCDEFGHIJKL_PROD \
    --paths "/*" \
    --profile $AWS_PROFILE
```

### 5. Database Operations
- Generally avoid seeding data in production unless initializing new environment
- If data migration is needed, use precise update scripts rather than bulk seeding
- Always back up DynamoDB tables before making destructive changes
```bash
# Example backup command (run before data modifications)
aws dynamodb create-backup \
    --table-name Pharmacies \
    --backup-name medifind-pharmacies-backup-$(date +%Y%m%d-%H%M%S) \
    --profile $AWS_PROFILE
```

## Post-Deployment Verification (Extended)

### 1. Stack Validation
Same as staging, but also check for any drift:
```bash
aws cloudformation detect-stack-drift \
    --stack-name $STACK_NAME \
    --profile $AWS_PROFILE
```

### 2. Synthetic Transaction Monitoring
Run critical user journeys:
```bash
# 1. User registration flow
# 2. Medicine search and results
# 3. Pharmacy selection
# 4. Order placement (with test payment method if applicable)
# 5. Order history retrieval

# Example order placement test (use test credentials)
curl -X POST "$API_URL/orders" \
    -H "Authorization: Bearer $TEST_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"medicine_id": "paracetamol", "pharmacy_id": "PHARMACY_01", "quantity": 2}' | jq .
```

### 3. Performance Validation
- Check CloudWatch metrics for latency spikes
- Verify error rates remain below thresholds (<1% for 5xx, <5% for 4xx)
- Confirm Cache hit ratios if API caching is enabled
- Review Lambda invocation duration and concurrency metrics

### 4. Security Validation
- Verify WAF is blocking expected threats (check WAF logs)
- Confirm SSL certificates are valid and not expiring soon
- Check that CORS restrictions are properly enforced
- Validate that sensitive data is not exposed in logs or error messages

## Rollback Procedure (Production-Specific)
Production rollbacks require extra caution due to potential data changes:

### 1. Identify Last Known Good Deployment
```bash
# Get deployment history
aws cloudformation list-stack-resources \
    --stack-name $STACK_NAME \
    --profile $AWS_PROFILE

# Or check StackEvents for last UPDATE_COMPLETE before current operation
```

### 2. Rollback Strategy Options
**Option A: Fast Rollback (if no data schema changes)**
```bash
# Re-deploy previous known good template
aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file:///path/to/previous/packaged.yaml \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION \
    --profile $AWS_PROFILE
```

**Option B: Database-Aware Rollback**
If schema changes were made:
1. Temporarily halt writes (if possible via feature flag)
2. Restore DynamoDB from backup if data was corrupted
3. Deploy previous code version
4. Resume writes after validation

**Option C: Forward Fix**
Sometimes safer to fix issue forward rather than rollback:
1. Deploy hotfix Lambda functions
2. Use API Gateway canary deployments to route % traffic to fixed version
3. Monitor and gradually increase traffic to fixed version

### 3. Communication During Rollback
- Update status page immediately
- Notify stakeholders via established channels
- Document incident for post-mortem

## Post-Rollback Verification
Same verification steps as initial deployment, focusing on:
- Restored functionality
- Data integrity (if applicable)
- Performance baselines

## Lessons Learned and Documentation
After any production deployment (successful or requiring rollback):
1. Update runbooks with any discoveries
2. Add items to retrospective meeting agenda
3. Update Architecture Decision Records if assumptions were invalidated
4. Create Jira tickets for any technical debt discovered

