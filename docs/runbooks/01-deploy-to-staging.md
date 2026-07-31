# 01: Deploy to Staging Environment

## When to Use
Deploying new features, bug fixes, or infrastructure changes to a staging stack for testing before production.

## Prerequisites
- AWS CLI v2 installed and configured
- AWS SAM CLI installed
- Access to AWS account with sufficient permissions (CloudFormation, Lambda, API Gateway, DynamoDB, Cognito, IAM)
- Git repository with latest changes from `main` branch

## Environment Variables
```bash
export AWS_PROFILE=medifind-staging
export AWS_REGION=us-east-1
export STACK_NAME=medifind-staging
```

There's no separate S3 deployment-artifacts bucket variable needed for a normal `sam deploy --guided` flow - SAM manages its own bucket automatically. Only set one up manually if you're deliberately using `sam package`/`sam deploy --template-file` instead (see note in step 2).

## Deployment Steps

### 1. Validate and build the backend
```bash
cd infrastructure
cfn-lint template.yaml   # catches most template mistakes before you spend a deploy cycle on them
sam build
```

### 2. Deploy
```bash
sam deploy \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        EnvironmentName=staging \
        AdminPassword='<a strong temporary password>' \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --no-fail-on-empty-changeset
```

The real parameter names are `EnvironmentName`, `DynamoDbBillingMode`, `AdminEmail`, `AdminPassword`, `ApiStageName`, `EnableApiCache`, `ApiCacheTtlInSeconds`, `ApiCacheSize`. There is no `EnableWAF` or `LoggingLevel` parameter - if you see either referenced elsewhere, it's stale. `AdminPassword` has no default and is required, but note it's currently not consumed by any actual resource (CloudFormation can't natively set a Cognito user's password) - you still have to supply something for the deploy to proceed.

(If you specifically need `sam package` + a separate template-file deploy for a CI system, that's a valid alternative to `sam deploy --guided`, but requires a real S3 bucket you've created and referenced correctly - don't assume one exists.)

### 3. Frontend

There is no S3+CloudFront frontend deployment set up for this project. The recommended approach is AWS Amplify Hosting - see `MEDIFIND-LOCAL-DEPLOYMENT-GUIDE.md` section 3. `.github/workflows/deploy.yml` attempts an S3 sync of `frontend/.next`, but that doesn't correctly serve a Next.js app using client components and dynamic routes, and is broken for other reasons too (see `README.md` Known Issues) - don't use it as-is.

### 4. Seed data (first-time environment setup, or to reset sample data)
```bash
cd ../backend
export ENVIRONMENT_NAME=staging
export AWS_REGION=us-east-1
python3 seed_data.py
```
See `04-database-seeding.md` for details.

## Post-Deployment Verification

### 1. Check stack status
```bash
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].StackStatus' \
    --profile $AWS_PROFILE
```

### 2. Test API endpoints
```bash
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text \
    --profile $AWS_PROFILE)

curl -s "${API_URL}/search?q=paracetamol" | jq .
```
There is no `/health` endpoint. The search route is `/search`, not `/medicine/search`.

### 3. Verify frontend deployment
- Visit your Amplify Hosting URL (or wherever you've actually deployed the frontend to)
- Check browser console for errors
- Test sign-up / email verification / sign-in
- Test medicine search end-to-end

## Rollback
See `03-rollback-procedure.md`. Short version: if the stack creation itself failed, CloudFormation already auto-rolled-back and deleted everything it created - delete the failed stack and retry. If an update to an already-working stack failed, CloudFormation already rolled back to the previous working state automatically; no manual action needed unless it lands in `UPDATE_ROLLBACK_FAILED`.

## Troubleshooting
- **Deployment fails with "AccessDenied"**: check IAM permissions for the profile/role you're using
- **Template validation errors**: run `cfn-lint template.yaml` and `sam validate` locally and fix before retrying
- **`sam build` succeeds but Lambdas fail at invoke with "handler not found"**: check `CodeUri` paths in `template.yaml` are `../backend/src/functions/...` (relative to `infrastructure/`) - this exact bug happened before and silently produced empty deploy packages; see `FIXES.md`
- **API Gateway 502/500 errors**: check CloudWatch logs for the specific Lambda; also check the Lambda's IAM policy actually grants the DynamoDB actions it's trying to use
- **Frontend build fails**: check Node.js version (target 20.x+ locally, Lambda runtime is 22.x) and clear `.next`/`node_modules` and reinstall
