# 0004: Use Amazon Cognito for Authentication and Authorization

## Status
Accepted

## Context
We needed a secure, scalable way to handle user authentication and authorization for MediFind. Options considered:
- Custom authentication with Lambda and DynamoDB
- Amazon Cognito User Pools
- Auth0 or other third-party identity providers
- OpenID Connect self-hosted solution

## Decision
Chose Amazon Cognito User Pools because:
- Fully managed service, reduces operational overhead
- Provides secure sign-up, sign-in, and (via a custom attribute) role-based access control
- Integrates with API Gateway for authorization once wired correctly (see Implementation Details - this wasn't right in an earlier version and had to be fixed)
- Provides JWT (ID) tokens that fit naturally with a Lambda-based backend
- Cognito as a managed AWS service is described by AWS as HIPAA eligible - relevant given the subject matter, though this is a property of the underlying service, not a claim that this application as a whole is HIPAA compliant. No BAA, audit logging strategy, or other compliance controls have been implemented beyond using Cognito itself.

## Implementation Details
- Cognito User Pool + User Pool Client defined in the SAM template, username is email (`UsernameAttributes: [email]`), email auto-verification on sign-up
- A JWT authorizer Lambda function validates ID tokens and is registered as a native SAM `Auth.Authorizers` entry on the API Gateway REST API (not a disconnected raw `AWS::ApiGateway::Authorizer` resource, which is how it was originally built and didn't actually work with the API's `Auth` block - see `FIXES.md`)
- The authorizer attaches `userId` (token `sub`), `email`, and `role` (from a `custom:role` attribute, defaulting to `'user'`) to the request context, so downstream Lambdas read identity from there rather than trusting client-supplied fields
- `custom:role` is a real, actively-checked attribute - `admin-pharmacy` and `admin-inventory` both require `role === 'admin'`, returning `403` otherwise
- `custom:role` is readable but deliberately **not** in the User Pool Client's `WriteAttributes` - a user cannot grant themselves admin via self-service sign-up or attribute update. There is currently no in-app path to assign it at all; it must be set manually via `aws cognito-idp admin-update-user-attributes`
- Password policy: minimum 8 characters, requires upper/lowercase, numbers, and symbols
- **MFA is not enabled** (`MfaConfiguration` isn't set on the User Pool, so it defaults off). Advanced security features (compromised-credential checking, adaptive authentication) are also not enabled - these are Cognito capabilities, not things currently turned on for this app
- Frontend uses the `aws-amplify` JS library for sign-up/sign-in/sign-out; token stored in `localStorage` only, no refresh logic implemented - expired tokens require re-authentication

## Consequences
- Dependency on Cognito as a managed service (some vendor lock-in)
- No forgot-password flow implemented yet
- No token refresh - a real, current UX limitation, not a hypothetical tradeoff
- User data resides in Cognito - relevant for any future data-residency requirements

## Related Decisions
- 0003: The dedicated authorization function (bounded context #6) owns all JWT validation
- 0001: SAM manages the User Pool and Client alongside the rest of the infrastructure
