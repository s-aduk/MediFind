# 01: Deploy to Staging Environment

## When to Use
Deploying new features, bug fixes, or infrastructure changes to the staging environment for testing before production release.

## Prerequisites
- AWS CLI v2 installed and configured
- AWS SAM CLI installed
- Access to AWS account with sufficient permissions (CloudFormation, Lambda, API Gateway, DynamoDB, Cognito, IAM)
- Git repository with latest changes from `main` branch
- SSH agent forwarding if using private npm/yarn registries

## Environment Variables
Set these in your shell or use a `.env.staging` file:
```bash
export AWS_PROFILE=mediFind-staging
export AWS_REGION=us-east-1
export STACK_NAME=medifind-staging
export S3_BUCKET=medifind-deployments-staging
```

## Deployment Steps

### 1. Deploy Backend Infrastructure (AWS SAM)
```bash
cd infrastructure
# Validate the SAM template
sam validate

# Deploy using guided mode (first time) or saved config
sam deploy --guided \
    --stack-name $STACK_NAME \
    --profile $AWS_PROFILE \
    --region $AWS_REGION
```

For subsequent deployments, use saved configuration:
```bash
sam deploy --stack-name $STACK_NAME --profile $AWS_PROFILE --no-fail-on-empty-changeset
```

### 2. Frontend Deployment (AWS Amplify Hosting)

**Frontend is deployed automatically via Amplify on git push.** No manual steps required.

Ensure your repository is connected to Amplify Console:
- Branch `staging` → Amplify app `medifind-staging`
- Push to `staging` branch triggers auto-deploy
- Preview URLs generated for every PR

### 3. Update Environment Variables in Amplify Console (if needed)
If stack outputs changed (API URL, Cognito IDs), update in Amplify Console:
1. Go to Amplify Console → App → Environment variables
2. Update:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
   - `NEXT_PUBLIC_COGNITO_CLIENT_ID`
   - `NEXT_PUBLIC_COGNITO_REGION`

### 4. Run Database Migrations/Seed Data (if schema changed)
```bash
cd ../backend
python seed_data.py --environment staging
```

## Post-Deployment Verification

### 1. Check Stack Status
```bash
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].StackStatus' \
    --profile $AWS_PROFILE
```

### 2. Test API Endpoints
```bash
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text \
    --profile $AWS_PROFILE)

# Test health endpoint
curl -s "$API_URL/health" | jq .

# Test medicine search
curl -s "$API_URL/medicine/search?q=paracetamol" | jq .
```

### 3. Verify Frontend Deployment
- Visit https://staging.medifind.example.com
- Check console for errors
- Test user authentication flow
- Test medicine search functionality

## Rollback Procedure
If issues are detected:
```bash
# Identify previous successful deployment
aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
    --query "StackSummaries[?StackName==\`$STACK_NAME\`].StackId" \
    --profile $AWS_PROFILE

# Or use AWS Console to initiate rollback to previous stack version
# Alternatively, re-deploy the last known good packaged.yaml
```

## Troubleshooting
- **Deployment fails with "AccessDenied"**: Check IAM permissions for the user/role
- **Template validation errors**: Run `sam validate` locally and fix template issues
- **Lambda timeout after deploy**: Check CloudWatch logs for function errors
- **API Gateway 502 errors**: Ensure Lambda execution role has proper DynamoDB permissions
- **Frontend build fails**: Check Node.js version compatibility and clear .next/cache

## Cleanup
Remove temporary packaged files:
```bash
rm -f infrastructure/packaged.yaml
```
