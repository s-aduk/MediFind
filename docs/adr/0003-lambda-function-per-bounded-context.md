# 0003: Lambda Function Per Bounded Context

## Status
Accepted

## Context
We needed to structure the backend for maintainability and clear ownership per capability. Options considered:
- Monolithic Lambda function handling all endpoints
- Microservices with multiple Lambda functions per entity
- Lambda functions grouped by business capability/bounded context
- Step Functions orchestrating multiple Lambda functions

## Decision
Chose one Lambda function per bounded context because:
- Clear separation of concerns - each function has a single responsibility
- Reduces blast radius of failures (a bug in inventory management can't take down search)
- Simplifies testing and deployment (smaller units of change)
- Matches the actual access-pattern boundaries in the DynamoDB design (see 0002) - each function typically only needs access to one or two tables

## Bounded Contexts Identified
1. **Medicine Search**: `GET /search` - searches Inventory, enriches with Pharmacies
2. **Pharmacy Lookup**: `GET /pharmacies/{medicineName}` - same two tables, different access pattern
3. **Order Management**: `POST /orders` - Orders, Users, Inventory (stock check + decrement), Pharmacies (existence check)
4. **Admin Pharmacy**: `ANY /admin/pharmacies` - Pharmacies CRUD, admin-role gated
5. **Admin Inventory**: `ANY /admin/inventory` - Inventory CRUD, admin-role gated
6. **Authorization**: JWT validation, wired as a native API Gateway REQUEST authorizer - attaches caller identity (`userId`, `email`, `role`) to the request context for the other 5 functions to trust

## Implementation Details
- Each function has its own `package.json` and its own `node_modules` after `sam build` - no shared Lambda Layer exists between functions currently, despite that being a reasonable option to revisit if duplicated dependencies become a real maintenance cost
- Each function's IAM policy is scoped to only the tables its own code actually reads/writes - this has been verified by inspection more than once, including catching and fixing two functions that held unused table access they never needed (see `FIXES.md`)
- Environment variables (table names, Cognito IDs) are injected via the SAM template, never hardcoded
- No provisioned concurrency is configured on any function - cold starts are accepted as-is at current scale
- Only 3 of the 6 functions (`medicine-search`, `get-pharmacies`, `create-order`) currently have automated tests

## Consequences
- More functions to monitor/deploy/manage than a monolith would have
- Cold start latency exists and is unmitigated - acceptable at current traffic levels, worth revisiting (provisioned concurrency, or consolidating low-traffic functions) if that changes
- No shared code layer means small amounts of duplication across functions (e.g. CORS header construction is repeated per-function rather than centralized)
- Requires discipline to keep each function's granted IAM permissions matched to what its code actually does, since nothing enforces this automatically

## Related Decisions
- 0002: DynamoDB multi-table design - each function accesses only the tables its bounded context needs
- 0004: Complements Cognito-based authentication - one function owns all JWT validation
- 0001: SAM template makes managing 6 functions in one place straightforward
