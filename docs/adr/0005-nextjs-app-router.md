# 0005: Use Next.js App Router for Frontend Framework

## Status
Accepted

## Context
We needed to choose a frontend framework and architecture for the MediFind patient-facing application. Requirements included:
- Server-side rendering for SEO and performance
- TypeScript support
- Component reuse and good developer experience
- Scalability for future features
- Integration with AWS services (Cognito, API Gateway)
Options considered:
- Create React App (CRA)
- Next.js with Pages Router
- Next.js with App Router (React 18+)
- Remix
- Gatsby
- Custom React with Express backend

## Decision
Chose Next.js App Router because:
- Leverages React 18 concurrent features and streaming SSR
- File-system based routing with intuitive app/ directory structure
- Built-in support for React Server Components (RSC) reducing JavaScript sent to client
- Streamlined data fetching with async/await in Server Components
- Automatic code splitting and route-based prefetching
- Built-in image optimization, font optimization, and metadata handling
- Excellent TypeScript support out of the box
- Incremental Static Regeneration (ISR) for hybrid rendering strategies
- API routes option for backend-for-frontend patterns if needed
- Strong community and Vercel integration (though we're deploying to AWS via **Amplify Hosting**)

## Implementation Details
- Used `app/` directory structure with `layout.js`, `page.js`, and route-specific folders
- Implemented React Server Components for data fetching (medicine search, pharmacy listings)
- Used Client Components (`use client`) only for interactive elements (forms, authentication state)
- Implemented route groups for organizing authentication routes (`(auth)`)
- Added custom CSS modules for component-scoped styling
- Configured next.config.js for image domains, webpack customizations if needed
- Environment variables loaded via .env.local for development, AWS Parameter Store/Secrets Manager for production
- Implemented authentication flow using Next.js middleware or custom auth wrapper checking Cognito tokens

## Consequences
- Requires learning React Server Components mental shift (data fetching moved to server)
- Some React libraries may not yet be fully compatible with Server Components
- Build output is more complex (server bundle + client bundles)
- Need to be careful about waterfalls when fetching data in nested layouts
- Less flexibility than a custom Express server for complex backend logic (but we have Lambda backend)

## Related Decisions
- 0004: Integrates with Cognito authentication via Next.js middleware or custom hooks
- Infrastructure: Will be deployed via **AWS Amplify Hosting** (native Next.js support with SSR/ISR)
- Performance: Aligns with web performance rules (automatic code splitting, image optimization)
