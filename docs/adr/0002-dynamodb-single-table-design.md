# 0002: DynamoDB Single-Table Design with Entity-Relationship Modeling

## Status
Accepted

## Context
We needed to design a data model for MediFind that efficiently handles relationships between pharmacies, medicines, inventory, orders, and users while being cost-effective and performant at scale. Options considered:
- Multi-table approach (one table per entity)
- Single-table design with careful partitioning
- DynamoDB with Global Secondary Indexes for access patterns
- Using DynamoDB with sort keys for hierarchical data

## Decision
Chose a single-table design with entity-relationship modeling because:
- Reduces provisioned throughput needs by sharing throughput across entities
- Enables efficient querying of related items with single queries
- Minimizes cross-table joins which are expensive in NoSQL
- Better cost predictability at scale
- Allows us to leverage DynamoDB's strengths while managing its limitations

## Implementation Details
- Uses composite primary keys (PK, SK) with prefixes to distinguish entity types
- Implements GSIs for alternative query patterns:
  - GSI1: For medicine-based pharmacy lookups (GSI1PK = medicine_name, GSI1SK = pharmacy_id)
  - GSI2: For pharmacy-based inventory views (GSI2PK = pharmacy_id, GSI2SK = medicine_name)
  - GSI3: For order history queries (GSI3PK = user_id, GSI3SK = order_date)
- Uses attribute partitioning to keep related items together
- Implements sparse indexes where appropriate to reduce storage costs

## Consequences
- Requires careful key design to avoid hot partitions
- Query flexibility is limited to defined access patterns
- Schema migrations require careful planning
- Developers must understand the key structure to write correct queries
- Single point of failure for throughput (mitigated by auto-scaling and good key design)

## Related Decisions
- 0001: Uses AWS SAM which works well with DynamoDB definitions
- 0003: Lambda functions encapsulate data access patterns, hiding complexity
