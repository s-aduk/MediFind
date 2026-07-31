# MediFind - Deployment Guide (Backend on SAM, Frontend on Amplify)

This walks through deploying MediFind from your local machine to AWS: backend via AWS SAM, frontend via AWS Amplify Hosting.

> **Note on frontend hosting:** this guide recommends Amplify Hosting because it's the most straightforward way to host a Next.js app with client components and dynamic routes on AWS. As of writing, this project has never actually been connected to Amplify Hosting - there's no existing app/branch to point at. You'll be setting this up for the first time, not reconnecting something that already exists. Also note: `.github/workflows/deploy.yml` exists in this repo and tries to deploy the frontend a different way (syncing the raw `.next` build output to S3), which does not work correctly for this kind of app and directly conflicts with the approach below. Don't run that workflow until it's fixed or removed - see `README.md`'s Known Issues.

---

## 1. Prerequisites

- AWS CLI v2 installed and configured
- AWS SAM CLI installed
- Node.js >= 20.x locally (Lambda runtime is 22.x)
- Python >= 3.9 with `boto3` installed (for seeding data)
- An AWS profile with sufficient permissions (CloudFormation, Lambda, API Gateway, DynamoDB, Cognito, IAM)

Check you have a working profile:
```bash
aws configure list-profiles
```

---

## 2. Deploy the Backend (AWS SAM)

### 2.1 Set environment variables
```bash
export AWS_PROFILE=medifind-staging
export AWS_REGION=us-east-1
export STACK_NAME=medifind-staging
```

### 2.2 Build
```bash
cd infrastructure
sam build
```

### 2.3 Deploy (guided, first time only)
```bash
sam deploy --guided
```

You'll be prompted for the template's actual parameters:

| Prompt | What to do |
|---|---|
| Stack Name | e.g. `medifind-staging` |
| AWS Region | `us-east-1` |
| Parameter: `EnvironmentName` | `dev` / `staging` / `prod` - this becomes part of every resource name (e.g. `<EnvironmentName>-pharmacies`) |
| Parameter: `DynamoDbBillingMode` | Accept default (`PAY_PER_REQUEST`) |
| Parameter: `AdminEmail` | Accept default or set your own - currently unused by any resource (see note below) |
| Parameter: `AdminPassword` | **Required, no default.** Type a strong temp password (hidden input, `NoEcho`). Currently unused by any resource - CloudFormation genuinely cannot set a Cognito user's password natively, so nothing consumes this parameter yet. You still have to supply something for `sam deploy` to proceed. |
| Parameter: `ApiStageName` | Accept default (`prod`) unless you want a different stage name |
| Parameter: `EnableApiCache` | Accept default (`false`) - turning this on provisions a billed-per-hour API Gateway cache cluster, not free-tier eligible even at rest |
| Parameter: `ApiCacheTtlInSeconds` / `ApiCacheSize` | Only relevant if you enabled the cache above |
| Confirm changes before deploy? | **Y** |
| Allow SAM CLI IAM role creation? | **Y** (required - Lambda roles, Cognito, etc. need creating) |
| Disable rollback? | **N** (keep rollback on failure) |
| Per-function "authorization not defined" prompts | Read each one - confirm the JWT authorizer is actually gating the write endpoints (`create-order`, `admin-pharmacy`, `admin-inventory`) before accepting. `medicine-search`, `get-pharmacies` should show `NONE` (intentionally public), as should `/authorize` (a dead route, unrelated to normal auth flow). |
| Save arguments to samconfig.toml? | **Y** - future deploys become just `sam deploy` |

There is no `EnableWAF`, `LoggingLevel`, or `AlarmNotificationEmail` parameter in this template - if you've seen those mentioned elsewhere, they don't exist here.

### 2.4 What gets created
- 4 DynamoDB tables: Pharmacies, Inventory, Users, Orders (on-demand billing by default, 4 separate tables - not a single-table design)
- Cognito User Pool + User Pool Client
- 6 Lambda functions: medicine-search, get-pharmacies, create-order, admin-pharmacy, admin-inventory, jwt-authorizer
- API Gateway REST API wired to the above, with the JWT authorizer registered natively via `Auth.Authorizers`
- CloudWatch Log Groups (30-day retention) for every function
- 3 CloudWatch alarms: error rate and throttling on `medicine-search`, and API Gateway 5XX errors. **None of these have a notification target configured** (`AlarmActions` is empty) - they'll show as "in alarm" in the console but nobody gets notified. Wire up an SNS topic if you want actual alerting.
- An SQS dead-letter queue (`MedicineSearchDlq`) that is declared but **not actually attached** to any function's `DeadLetterConfig` - it exists but does nothing currently. Also worth noting: DLQs only apply to asynchronous Lambda invocations, and `medicine-search` is invoked synchronously via API Gateway, so this wouldn't be effective for its stated purpose even if wired up.

### 2.5 Get your stack outputs
```bash
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $AWS_PROFILE \
  --query 'Stacks[0].Outputs' --output table
```
You need four values from this for the frontend: `ApiUrl`, `UserPoolId`, `UserPoolClientId`, and your deploy region.

### 2.6 Seed the database

The seed script reads its target environment/region from environment variables, not CLI flags:
```bash
cd ../backend
export ENVIRONMENT_NAME=staging   # must match the EnvironmentName you deployed with
export AWS_REGION=us-east-1       # must match your deploy region
python3 seed_data.py
```
This populates 5 pharmacies and 10 medicines (20 inventory rows total) with realistic stock levels and prices. See `backend/seed_data.py` for the full list.

### 2.7 Verify
```bash
curl -s "$API_URL/search?q=paracetamol"
```
There is no `/health` endpoint and no `/medicine/search` route - the actual search route is `/search`.

### 2.8 Assign yourself an admin role (optional)

Nothing in this project can currently assign the `custom:role = admin` attribute that `admin-pharmacy`/`admin-inventory` require - self-service sign-up is deliberately prevented from setting it. After creating a user via the normal sign-up flow, promote them manually:
```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id <UserPoolId> \
  --username <email> \
  --user-attributes Name=custom:role,Value=admin \
  --profile $AWS_PROFILE
```

---

## 3. Deploy the Frontend (AWS Amplify Hosting)

> Note: `aws-amplify` / `@aws-amplify/ui-react` in `package.json` are just the **Amplify JS client library** used for Cognito auth calls - a different thing from **Amplify Hosting**, the service that builds/hosts the site. You need to connect the repo to Amplify Hosting separately; nothing does this automatically.

### 3.1 Connect the repo
In the Amplify Console: **New app -> Host web app -> connect your GitHub repo** (point it at the `frontend/` subdirectory as the app root if prompted).

### 3.2 Set environment variables
Amplify Console -> your app -> **Hosting -> Environment variables**. Set these *before* running the build (they get baked into the client bundle at build time, since they're `NEXT_PUBLIC_*`):

| Variable | Value | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `ApiUrl` output | Section 2.5 |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `UserPoolId` output | Section 2.5 |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `UserPoolClientId` output | Section 2.5 |
| `NEXT_PUBLIC_COGNITO_REGION` | Your deploy region | e.g. `us-east-1` |

### 3.3 Build & deploy
Trigger a build in Amplify (or push to the connected branch). Amplify builds the Next.js app and hosts it with SSR support.

### 3.4 Verify
- Visit the Amplify-provided URL (or your custom domain)
- Check browser console for errors
- Test sign-up / email verification / sign-in
- Test medicine search and order placement end-to-end
- Note: there's no forgot-password flow yet, and tokens don't auto-refresh - after ~1 hour (Cognito's default ID token expiry) users will need to sign in again

---

## 4. Known cleanup item (do before going to production)

`frontend/src/lib/api.js` currently has a hardcoded fallback API URL if the env var is missing:
```js
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://to23iirip3.execute-api.eu-north-1.amazonaws.com/Prod/';
```
This is a leftover dev endpoint. Recommended fix: remove the fallback, or make it throw/log a loud warning instead of silently pointing at a stale endpoint.

---

## 5. Reference: repo runbooks

`docs/runbooks/` contains pre-existing runbooks (`01-deploy-to-staging.md`, `02-deploy-to-production.md`, `03-rollback-procedure.md`, `04-database-seeding.md`). They have not been verified against the current template/codebase as part of this audit - cross-check any specific command or parameter name against `infrastructure/template.yaml` and this guide before trusting them, the same way several other pieces of documentation in this repo turned out to describe functionality that was never actually built.
