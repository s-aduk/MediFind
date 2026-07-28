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
- Provides good abstraction over CloudFormation while still allowing escape hatches
- Integrates well with Lambda functions (built-in SAM transforms)
- Has good local development experience with `sam local`
- Familiar to team (lower learning curve than CDK for simple services)
- Less complex than Terraform for our current infrastructure scope

## Consequences
- Infrastructure changes go through CloudFormation change sets
- Local testing requires Docker for Lambda execution
- Limited to AWS-specific features (no multi-cloud portability)
- SAM CLI adds another tool to learn

## Related Decisions
- 0002: DynamoDB single-table design for entity relationships
- 0003: Lambda function per bounded context for loose coupling
