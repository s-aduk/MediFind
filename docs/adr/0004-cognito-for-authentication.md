# 0004: Use Amazon Cognito for Authentication and Authorization

## Status
Accepted

## Context
We needed a secure, scalable way to handle user authentication, authorization, and user management for the MediFind application. Options considered:
- Custom authentication with Lambda and DynamoDB
- Amazon Cognito User Pools
- Auth0 or other third-party identity providers
- AWS IAM for federated identities
- OpenID Connect self-hosted solution

## Decision
Chose Amazon Cognito User Pools because:
- Fully managed service reduces operational overhead
- Provides secure user sign-up, sign-in, and access control
- Integrates seamlessly with API Gateway for authorization
- Supports social identity providers (Google, Facebook, Apple) if needed later
- Includes built-in security features like MFA, password policies, and compromised credential checking
- Scales automatically to handle millions of users
- Provides JWT tokens that work well with our Lambda-based architecture
- HIPAA eligible (important for healthcare-related applications)

## Implementation Details
- Created a Cognito User Pool in the SAM template
- Configured user pool client for the frontend application
- Set up JWT authorizer Lambda function that validates tokens issued by Cognito
- API Gateway methods are protected by the JWT authorizer
- Frontend uses aws-amplify library to interact with Cognito for sign-up, sign-in, and token management
- User attributes include email (as username), name, and custom attributes for role-based access control if needed

## Consequences
- Adds dependency on AWS service (vendor lock-in to some extent)
- Less flexible than custom authentication for very specific requirements
- Requires careful configuration of password policies and MFA settings
- User data resides in Cognito (need to consider data residency requirements)
- Must manage Cognito client secrets appropriately (though we use public client for SPA)

## Related Decisions
- 0003: Lambda function per bounded context includes a dedicated authorization function
- 0001: AWS SAM simplifies deploying Cognito resources alongside other infrastructure
- Security: Complements API Gateway authorization patterns
