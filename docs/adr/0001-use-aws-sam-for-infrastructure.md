# 0001: Use AWS SAM for Infrastructure Definition

## Status
Accepted

## Context
We needed to define AWS infrastructure in a repeatable, version-controlled manner. Options considered:
- AWS CDK
- Terraform
- CloudFormation YAML (manual)
- AWS SAM

## Decision
Chose AWS SAM because:
- Provides good abstraction over CloudFormation while still allowing escape hatches (raw CloudFormation resources sit alongside SAM's `AWS::Serverless::*` transforms in the same template)
- Integrates well with Lambda functions (built-in SAM transforms, native `Auth.Authorizers` wiring for API Gateway REQUEST authorizers)
- Familiar, lower learning curve than CDK for a service of this size
- Less complex than Terraform for the current infrastructure scope

## Consequences
- Infrastructure changes go through CloudFormation change sets
- `sam local` requires Docker for local Lambda execution - note this isn't actually set up for this project currently (no `events/*.json` sample payloads exist), so local invocation isn't part of the current workflow despite being available
- Limited to AWS-specific features (no multi-cloud portability)
- SAM CLI adds another tool to learn, on top of the AWS CLI

## Related Decisions
- 0002: DynamoDB multi-table design, managed within the same SAM template
- 0003: Lambda function per bounded context, each independently deployable via this template
