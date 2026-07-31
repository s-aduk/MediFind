# 0002: DynamoDB Multi-Table Design

## Status
Accepted (corrected)

**This ADR originally documented a single-table design with generic `PK`/`SK`/`GSI1`/`GSI2`/`GSI3` attributes that was never actually implemented.** The real schema - 4 separate tables with named GSIs - has existed in `infrastructure/template.yaml` since the project's first version. This document was rewritten to describe what was actually built, rather than leave a design doc on record that contradicts the code. See `FIXES.md` for context on this correction.

## Context
We needed a data model for MediFind that handles pharmacies, medicine inventory, users, and orders, with predictable access patterns and straightforward per-entity permissions for the Lambda functions that own them. Options considered:
- Single-table design with entity-relationship modeling and generic partition/sort keys
- Multi-table approach (one table per entity)
- A mix, with single-table design for tightly-coupled entities only

## Decision
Went with a multi-table approach: one DynamoDB table per entity (Pharmacies, Inventory, Users, Orders), each with its own primary key and purpose-named GSIs, because:
- Each Lambda function only needs IAM access to the specific table(s) its own logic touches - a multi-table layout makes least-privilege IAM policies straightforward to write and to verify by inspection (this has mattered in practice - two functions were found and fixed for holding unused table access they never needed)
- Named, purpose-specific GSIs (`GSI_MedicineName`, `GSI_PharmacyId`, `GSI_Email`, `GSI_UserId`, `GSI_Status`, etc.) are easier to reason about than generic `GSI1`/`GSI2`/`GSI3` overloaded across unrelated entities
- The application's actual access patterns are simple, per-entity lookups and scans (search by medicine name, list a pharmacy's inventory, look up a user's orders) rather than deeply nested relational queries that would benefit from single-table item-collection tricks
- At this project's current scale, the throughput-sharing and reduced-table-count benefits of single-table design don't outweigh the added query complexity

## Implementation Details

| Table | Partition Key | Sort Key | GSIs |
|---|---|---|---|
| Pharmacies | `pharmacy_id` | - | `GSI_Name_Address` (name, address) |
| Inventory | `medicine_name` | `pharmacy_id` | `GSI_PharmacyId` (pharmacy_id, medicine_name), `GSI_MedicineName` (medicine_name) |
| Users | `user_id` | - | `GSI_Email` (email) |
| Orders | `order_id` | - | `GSI_UserId` (user_id, created_at), `GSI_Status` (status, created_at) |

- All 4 tables default to on-demand (`PAY_PER_REQUEST`) billing, controlled by the `DynamoDbBillingMode` template parameter.
- Point-in-time recovery is enabled on all 4 tables.
- `medicine_name` is stored lowercase everywhere it's written (search, order placement, inventory updates) so that substring matching in `medicine-search`/`get-pharmacies` doesn't need a `lower()`-style function - which DynamoDB's expression language doesn't actually support (this was a real bug caught and fixed; see `FIXES.md`).

## Consequences
- Cross-entity lookups (e.g. "enrich a search result with pharmacy details") require a second request per item (a `GetItem` against Pharmacies for each Inventory scan result) rather than a single query - acceptable at current scale, worth revisiting if search result volume grows significantly.
- No `DeletionPolicy: Retain` is currently set on any table - deleting the stack deletes all data. Worth adding before this holds data anyone cares about losing.
- Schema changes are scoped to a single table at a time, which is simpler to reason about than single-table migrations, at the cost of more tables to manage overall (4, plus their GSIs).

## Related Decisions
- 0001: AWS SAM manages all 4 tables and their GSIs as part of one template
- 0003: Each Lambda function's IAM policy grants access only to the specific table(s) its code touches - a natural fit with per-entity tables
