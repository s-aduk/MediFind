# 0003: Lambda Function Per Bounded Context

## Status
Accepted

## Context
We needed to structure our backend services for maintainability, scalability, and clear ownership. Options considered:
- Monolithic Lambda function handling all endpoints
- Microservices with multiple Lambda functions per entity
- Lambda functions grouped by business capability/bounded context
- Step Functions orchestrating multiple Lambda functions

## Decision
Chose Lambda function per bounded context because:
- Provides clear separation of concerns (each function has a single responsibility)
- Enables independent scaling based on workload patterns
- Reduces blast radius of failures
- Allows different teams to own different functions
- Simplifies testing and deployment (smaller units of change)
- Matches our domain-driven design approach

## Bounded Contexts Identified
1. **Medicine Search**: Handles searching for medicines across pharmacies
2. **Pharmacy Lookup**: Returns pharmacy details for given medicines
3. **Order Management**: Handles creating and managing customer orders
4. **Admin Pharmacy**: CRUD operations for pharmacy management
5. **Admin Inventory**: Inventory stock management and alerts
6. **Authorization**: JWT validation for secure API access

## Implementation Details
- Each function has its own package.json for precise dependency control
- Shared utilities extracted to common layers where beneficial
- Each function follows consistent error handling and response patterns
- Functions are kept under 50MB deployment package size through careful dependency management
- Environment variables used for configuration rather than hardcoded values

## Consequences
- Increased operational overhead (more functions to monitor, deploy, manage)
- Potential for cold start latency (mitigated with provisioned concurrency where needed)
- Need for consistent coding standards across functions
- Slightly more complex initial setup but better long-term maintainability
- Requires careful attention to shared dependencies and versioning

## Related Decisions
- 0002: Works well with DynamoDB design as each function accesses specific entities
- 0004: Complements Cognito-based authentication strategy
- Infrastructure: SAM template makes managing multiple functions straightforward
