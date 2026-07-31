# 02: Deploy to Production Environment

## When to Use
Deploying verified changes to a production stack after testing in staging.

## Prerequisites
- Everything in `01-deploy-to-staging.md`
- Successful staging deployment with manual smoke testing done (there's no automated smoke-test suite in this repo to run)
- Any organizational approvals your team requires

## Environment Variables
```bash
export AWS_PROFILE=medifind-production
export AWS_REGION=us-east-1
export STACK_NAME=medifind-production
```

## Deployment Steps

Same mechanics as staging (`01-deploy-to-staging.md`), with production-specific parameter values:

```bash
cd infrastructure
cfn-lint template.yaml
sam build

sam deploy \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        EnvironmentName=prod \
        AdminPassword='<a strong temporary password, different from staging>' \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --no-fail-on-empty-changeset
```

There is no `EnableWAF`, `LoggingLevel`, or `AlarmNotificationEmail` parameter to set for production - none of these exist on this template currently. If your team needs WAF protection or alerting before going to production, that's infrastructure work to do first (add a WAF WebACL association and an SNS topic wired to the existing 3 CloudWatch alarms, which currently have no notification target at all - see `DEPLOYMENT.md` section 6), not a flag to flip.

**Before treating this as production-ready, be aware of what's actually missing** (see `README.md`'s Known Issues and Feature table for the full list): no WAF, no rate limiting on public endpoints, no token refresh on the frontend, no forgot-password flow, CloudWatch alarms with no notification target, and no `DeletionPolicy: Retain` on the DynamoDB tables (a stack deletion takes all data with it).

### Database operations
- Avoid re-running `seed_data.py` against a production stack with real data - it's not destructive to existing differently-keyed items, but it will overwrite any of its own sample records if they already exist (DynamoDB `PutItem` is an upsert by primary key)
- Before any manual data changes, consider a backup:
```bash
aws dynamodb create-backup \
    --table-name prod-pharmacies \
    --backup-name medifind-pharmacies-backup-$(date +%Y%m%d-%H%M%S) \
    --profile $AWS_PROFILE
```
(Table names include the `EnvironmentName` prefix - adjust for whatever you actually deployed with.)

## Post-Deployment Verification
Same as staging (`01-deploy-to-staging.md`), plus:
- Check CloudWatch Logs for each function for unexpected errors in the minutes after deploy
- Manually walk through: sign up, verify email, sign in, search a seeded medicine, place an order
- If you've assigned yourself `custom:role=admin` (see `01-deploy-to-staging.md`/`MEDIFIND-LOCAL-DEPLOYMENT-GUIDE.md`), verify the admin endpoints work and that a non-admin token correctly gets `403`

## Rollback
See `03-rollback-procedure.md`.

## After Any Production Deployment
Whatever your team's process is for post-deploy review - this repo doesn't prescribe one. If you find something during a production deploy that contradicts what's documented here, update the doc as part of closing that out; several docs in this repo previously drifted significantly from the actual implementation (see `FIXES.md`), and the fix for that is keeping docs and code in sync going forward, not just once.
