# 03: Rollback Procedure

## When to Use
When a deployment introduces critical issues that cannot be resolved quickly via forward fix, or when health checks fail post-deployment.

## Prerequisites
- Access to AWS CloudFormation console or CLI
- Knowledge of the last known good deployment state
- Understanding of any data migrations that occurred during the failed deployment
- Communication channels ready for stakeholder notification

## Rollback Decision Criteria
Initiate rollback if ANY of the following are true:
- Critical error rate >5% for 5 consecutive minutes
- Core user journeys (search, order) fail for >10% of requests
- Security vulnerabilities introduced
- Data corruption detected or suspected
- Unable to restore service within 15 minutes via forward fix

## General Rollback Principles
1. **Communicate First**: Notify stakeholders before initiating rollback
2. **Preserve Evidence**: Collect logs, metrics, and debug info before rolling back
3. **Check Data Compatibility**: Ensure rollback won't cause data loss or corruption
4. **Validate Rollback Target**: Confirm the previous version is known good
5. **Monitor Closely**: After rollback, verify system stabilizes

## Rollback Scenarios

### Scenario A: Simple Code/Rollback (No Schema Changes)
Applies when deployment only changed Lambda code or configuration without altering DynamoDB schema.

#### Steps:
```bash
# 1. Identify previous deployment
STACK_NAME=medifind-production  # or staging
AWS_PROFILE=medifind-production

# Get previous template (only applies if you're using `sam package` with a manually-created
# artifacts bucket, rather than plain `sam deploy --guided`, which manages its own bucket)
aws s3 ls s3://medifind-deployments-${AWS_PROFILE#medifind-}/artifacts/ \
    --recursive | sort | tail -5

# 2. If you saved the packaged template from previous deploy:
aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file:///path/to/previous/packaged.yaml \
    --capabilities CAPABILITY_IAM \
    --region $(aws configure get region --profile $AWS_PROFILE) \
    --profile $AWS_PROFILE

# 3. Monitor stack update
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].StackStatus' \
    --profile $AWS_PROFILE
```

### Scenario B: Rollback with API Gateway Changes
If API routes, methods, or the authorizer wiring changed:
1. CloudFormation will revert API Gateway resources to previous state as part of the stack rollback
2. Custom domains (not currently configured for this project) would need extra verification if added later
3. This project does not use API Gateway canary/stage-variable traffic splitting - a rollback here is a full stack rollback, not a gradual traffic shift

### Scenario C: Rollback with Cognito Changes
If user pools, clients, or authentication flows changed:
1. Exercise caution - rolling back Cognito resources may affect user sessions
2. Consider whether rolling back might break existing user tokens
3. May require coordination with users to re-authenticate after rollback

### Scenario D: Rollback with Database Schema Changes
**High Risk**: Only attempt if you understand the data implications.

#### If the change was ADDITIVE only (adding new tables/columns):
1. Usually safe to rollback - existing data remains intact
2. New columns/tables will be deleted but don't affect existing data
3. Verify no application code depends on the new schema elements

#### If the change was REMOVING or MODIFYING existing schema:
1. **DO NOT** automatically rollback without data validation
2. Assess whether data was modified/deleted by the new code
3. Consider:
   - Restoring from point-in-time backup (PITR) if enabled
   - Using DynamoDB Streams to replay/reverse changes
   - Forward fix to correct data rather than revert schema
4. Consult with database administrator before proceeding

## Detailed Rollback Steps Using AWS CLI

### 1. Prepare
```bash
# Gather incident data for post-mortem
mkdir -p /tmp/incident-$(date +%Y%m%d-%H%M%S)
cd /tmp/incident-$(date +%Y%m%d-%H%M%S)

# Get CloudFormation events
aws cloudformation describe-stack-events \
    --stack-name $STACK_NAME \
    --max-items 100 \
    --profile $AWS_PROFILE > stack-events.json

# Get current template
aws cloudformation get-template \
    --stack-name $STACK_NAME \
    --profile $AWS_PROFILE > current-template.json

# Download logs from affected Lambda functions
# Function names follow the pattern ${EnvironmentName}-<function-name>, e.g.
# staging-medicine-search, prod-create-order - not "medifind-<stack>-medicineSearch"
aws logs filter-log-events \
    --log-group-name /aws/lambda/${ENVIRONMENT_NAME}-medicine-search \
    --start-time $(date -d '10 minutes ago' +%s)000 \
    --profile $AWS_PROFILE > medicine-search.log
```

### 2. Execute Rollback
```bash
# Method 1: Using change set (safer for complex stacks)
aws cloudformation create-change-set \
    --stack-name $STACK_NAME \
    --change-set-name rollback-$(date +%Y%m%d-%H%M%S) \
    --template-body file:///path/to/known-good/template.yaml \
    --capabilities CAPABILITY_IAM \
    --profile $AWS_PROFILE

# Review changes
aws cloudformation describe-change-set \
    --stack-name $STACK_NAME \
    --change-set-name rollback-$(date +%Y%m%d-%H%M%S) \
    --profile $AWS_PROFILE

# Execute if looks correct
aws cloudformation execute-change-set \
    --stack-name $STACK_NAME \
    --change-set-name rollback-$(date +%Y%m%d-%H%M%S) \
    --profile $AWS_PROFILE

# Method 2: Direct update (for simple rollbacks)
aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file:///path/to/known-good/template.yaml \
    --capabilities CAPABILITY_IAM \
    --profile $AWS_PROFILE
```

### 3. Monitor Rollback Progress
```bash
# Watch stack events in real-time
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].StackStatus' \
    --profile $AWS_PROFILE

# Or use AWS Console for visual progress
```

### 4. Post-Rollback Actions
```bash
# 1. Verify service restoration
# Run health checks and synthetic transactions

# 2. Collect post-rollback data for comparison
aws cloudformation describe-stack-resources \
    --stack-name $STACK_NAME \
    --profile $AWS_PROFILE > post-rollback-resources.json

# 3. Notify stakeholders of rollback completion
# 4. Begin incident documentation and root cause analysis
```

## Rollback Using AWS Console (Alternative)
1. Navigate to CloudFormation service
2. Select your stack (e.g., `medifind-production`)
3. Click on "Stack actions" → "Update stack"
4. Choose "Replace current template" and upload the known-good template
5. Review changes in the Change Set before executing
6. Monitor the "Events" tab for rollback progress

## Emergency Rollback (When Stack Update Fails)
If `update-stack` fails and leaves stack in `UPDATE_ROLLBACK_FAILED` state:

### 1. Identify Failed Resources
```bash
aws cloudformation describe-stack-resources \
    --stack-name $STACK_NAME \
    --query 'StackResources[?ResourceStatus=="UPDATE_FAILED"]' \
    --profile $AWS_PROFILE
```

### 2. Skip Failed Resources During Continue Rollback
```bash
# Continue rollback while skipping problematic resources
aws cloudformation continue-update-rollback \
    --stack-name $STACK_NAME \
    --resources-to-skip \
        "ResourceId1" "ResourceId2" \  # List of resource logical IDs to skip
    --profile $AWS_PROFILE
```

### 3. Manual Cleanup (if needed)
After successful rollback, you may need to manually clean up resources that were skipped:
- Delete orphaned S3 buckets
- Remove unused Lambda functions
- Detach and delete unused IAM roles
- Release elastic IPs if applicable

## Prevention Strategies
To reduce need for rollbacks:
1. **Canary Deployments**: Not currently configured for this project (API Gateway canary settings or Lambda aliases would need to be added) - worth considering if rollback frequency becomes a real problem
2. **Feature Flags**: Wrap new features in toggles that can be disabled instantly
3. **Blue/Green Deployments**: For critical services, maintain two identical environments
4. **Automated Rollback Alarms**: Configure CloudWatch alarms to trigger automatic rollback
5. **Improved Testing**: Invest in contract testing, chaos engineering, and production-like test environments
6. **Database Migration Patterns**: Use expand/contract pattern for schema changes

## Post-Rollback Activities
1. **Incident Documentation**: Create detailed timeline of events
2. **Root Cause Analysis**: Use 5 Whys or fishbone diagram to determine underlying causes
3. **Action Items**: Create tickets for process improvements, monitoring gaps, or technical debt
4. **Update Playbooks**: Modify this document based on lessons learned
5. **Team Retrospective**: Discuss what went well and what could improve in the blameless post-mortem
6. **Customer Communication**: If users were affected, prepare appropriate notifications and possibly offer compensation

## Contacts for Escalation
_(Placeholder - replace with your actual team's real contacts; nothing below is a real MediFind team/channel)_
- Primary: Platform Engineering Team (#platform-engineering slack)
- Secondary: DevOps Lead (escalate@medifind.example.com)
- Emergency: AWS Account Team (if service limit issues suspected)
- Vendor Support: AWS Enterprise Support (if applicable)

