# 0005: Use Next.js App Router for Frontend Framework

## Status
Accepted

## Context
We needed a frontend framework for the MediFind patient-facing application. Requirements included:
- Reasonable performance and developer experience
- Component reuse
- Integration with AWS services (Cognito, API Gateway)
Options considered:
- Create React App (CRA)
- Next.js with Pages Router
- Next.js with App Router
- Remix
- Custom React with an Express backend

## Decision
Chose Next.js App Router because:
- File-system based routing with an intuitive `app/` directory structure
- Automatic code splitting
- Strong ecosystem and community support
- A reasonable default even though most of this app's actual data-fetching happens client-side rather than leaning on Server Components (see Implementation Details) - the App Router's conventions were still preferable to Pages Router or CRA for a new project

## Implementation Details
- Plain JavaScript, **not** TypeScript - despite TypeScript being commonly cited as a reason to pick Next.js, this project has zero TypeScript dependencies and no `.ts`/`.tsx` files anywhere
- `app/` directory with `layout.js`, `page.js`, and route-specific folders (`login/`, `search/`) - no route groups (no `(auth)`-style folders)
- The landing page (`app/page.js`) is a Server Component (no hooks, no `'use client'`) - genuinely static content, no data fetching
- **Medicine search and pharmacy listings are NOT done via Server Components fetching data on the server.** `SearchMedicine.js` and `PharmaciesList.js` are both Client Components (`'use client'`) that call the API from the browser via `lib/api.js`. If you're looking for server-side data fetching for these flows, it doesn't exist - the App Router's RSC data-fetching model isn't actually used for the app's core feature.
- Styling: Tailwind CSS v4 (CSS-first `@theme` config in `globals.css`), not CSS Modules - there is one leftover, unused `page.module.css` file from the original `create-next-app` scaffold that was never wired up and should probably just be deleted
- No Next.js middleware (`middleware.ts`/`.js`) exists. Auth state is checked client-side only, via `lib/auth.js` reading `localStorage` - there is no SSR-side auth check or redirect, which means an unauthenticated user briefly sees the `/search` page shell before any client-side redirect to `/login` fires
- Environment variables loaded via `.env.local` for local dev, and via the hosting platform's environment variable UI (e.g. Amplify Hosting's console) for deployed environments - no AWS Parameter Store or Secrets Manager integration exists for the frontend

## Consequences
- Because core data fetching is client-side, this app doesn't get the RSC benefits (reduced client JS, server-side data fetching) that were part of the original case for choosing the App Router - worth acknowledging as a gap between the intended architecture and what was actually built, not a hidden inconsistency to paper over
- No SSR-side auth protection means route protection is client-side-only and has the flash-of-unauthenticated-content tradeoff described above
- Build output is a mix of server and client bundles per Next.js's normal App Router behavior

## Related Decisions
- 0004: Frontend calls Cognito via a custom auth wrapper (`lib/auth.js`), not via Next.js middleware - there is no middleware in this project
- Infrastructure: Frontend hosting via AWS Amplify Hosting is the current recommendation (see `MEDIFIND-LOCAL-DEPLOYMENT-GUIDE.md`) but has not actually been set up for this project yet; a separate, currently-broken CI workflow attempts an S3-based deploy instead - don't treat either as evidence of a settled, working hosting setup
