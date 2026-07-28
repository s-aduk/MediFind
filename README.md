# MediFind - Medicine Finder Application

A modern, production-ready application for finding medicines at nearby pharmacies, built with AWS serverless technologies and Next.js.

## Overview

MediHelp connects patients with pharmacies that have specific medications in stock. Users can search for medicines, see which pharmacies have them available, view prices, and place orders.

## Architecture

This application uses a serverless architecture on AWS:

- **Frontend**: Next.js 13+ with App Router (React Server Components)
- **Backend**: AWS Lambda functions (Node.js) via AWS SAM
- **Database**: Amazon DynamoDB with single-table design
- **Authentication**: Amazon Cognito User Pools
- **API**: Amazon API Gateway
- **Infrastructure**: Infrastructure as Code with AWS SAM


## Project Structure

```
├── backend/                  # Lambda functions and backend code
│   ├── src/functions/        # Individual Lambda functions
│   │   ├── medicine-search/  # Search for medicines
│   │   ├── get-pharmacies/   # Get pharmacies with medicine stock
│   │   ├── create-order/     # Create customer orders
│   │   ├── admin-inventory/  # Admin inventory management
│   │   ├── admin-pharmacy/   # Admin pharmacy management
│   │   └── jwt-authorizer/   # JWT token validation
│   ├── package.json          # Backend dependencies and scripts
│   ├── jest.config.js        # Jest configuration
│   ├── babel.config.js       # Babel configuration
│   └── seed_data.py          # Script to populate DynamoDB with sample data
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # Reusable components
│   │   └── lib/              # Utility functions (API, auth)
│   ├── package.json
│   └── next.config.mjs
├── infrastructure/           # AWS SAM template
│   └── template.yaml         # Infrastructure definition
├── docs/                     # Documentation
│   ├── adr/                  # Architecture Decision Records
│   └── runbooks/             # Operational procedures
└── .github/workflows/        # CI/CD pipelines
    └── deploy.yml            # GitHub Actions workflow
```

## Getting Started

### Prerequisites

- Node.js 18.x+
- Python 3.9+
- AWS CLI v2
- AWS SAM CLI
- Docker (for local Lambda testing)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/s-aduk/MediFind
   cd MediFind
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm ci
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm ci
   ```

4. **Environment Configuration**
   ```bash
   # Copy example environment file
   cp ../.env.example .env
   
   # Edit .env with your local development values
   ```

5. **Run Local Development**
   ```bash
   # Start frontend dev server
   cd frontend
   npm run dev
   
   # In another terminal, test Lambda functions locally
   cd ../backend
   sam local invoke MedicineSearchFunction -e events/event.json
   ```

### Deployment

See the runbooks in `docs/runbooks/` for detailed deployment procedures:

- [Deploy to Staging](docs/runbooks/01-deploy-to-staging.md)
- [Deploy to Production](docs/runbooks/02-deploy-to-production.md)
- [Database Seeding](docs/runbooks/04-database-seeding.md)

## Features

- Medicine Search
- Search for medicines by name
- See which pharmacies have stock
- View prices and availability
- Filter by distance/location (future enhancement)

### Pharmacy Information
- View pharmacy details (address, phone, hours)
- See real-time inventory levels
- Get directions to pharmacy

### Order Management
- Place orders for medications
- Specify quantity and pharmacy
- Order confirmation and tracking
- Order history

### Admin Features
- Pharmacy management (CRUD)
- Inventory management
- Stock level alerts
- Order administration

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Linting
```bash
# Backend ESLint
cd backend
npm run lint

# Frontend ESLint  
cd frontend
npm run lint
```

## Architecture Decision Records

Key architectural decisions are documented in [docs/adr/](docs/adr/):

- [0001: Use AWS SAM for Infrastructure](docs/adr/0001-use-aws-sam-for-infrastructure.md)
- [0002: DynamoDB Single-Table Design](docs/adr/0002-dynamodb-single-table-design.md)
- [0003: Lambda Function per Bounded Context](docs/adr/0003-lambda-function-per-bounded-context.md)
- [0004: Use Amazon Cognito for Authentication](docs/adr/0004-cognito-for-authentication.md)
- [0005: Use Next.js App Router](docs/adr/0005-nextjs-app-router.md)

## Operational Documentation

Operational procedures are documented in [docs/runbooks/](docs/runbooks/):

- [01: Deploy to Staging](docs/runbooks/01-deploy-to-staging.md)
- [02: Deploy to Production](docs/runbooks/02-deploy-to-production.md)
- [03: Rollback Procedure](docs/runbooks/03-rollback-procedure.md)
- [04: Database Seeding](docs/runbooks/04-database-seeding.md)
- [05: View Logs](docs/runbooks/05-view-logs.md)
- [06: Troubleshoot Lambda Timeouts](docs/runbooks/06-troubleshoot-lambda-timeouts.md)
- [07: Scale DynamoDB Capacity](docs/runbooks/07-scale-dynamodb-capacity.md)

## Security

This application follows AWS security best practices:

- Principle of least privilege IAM roles
- Input validation and sanitization
- Protection against common web vulnerabilities (XSS, CSRF, SQL injection)
- Secure password handling via Cognito
- Environment-specific configuration
- Audit logging for sensitive operations

See [docs/runbooks/06-troubleshoot-lambda-timeouts.md](docs/runbooks/06-troubleshoot-lambda-timeouts.md) for security-related operational procedures.

## Monitoring and Observability

- CloudWatch Logs for all Lambda functions
- CloudWatch Metrics for performance and error tracking
- Custom metrics for business KPIs
- Distributed tracing with AWS X-Ray (configured in template)
- Health check endpoints for all services

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- AWS Serverless Application Model (SAM)
- Next.js team for the excellent React framework
- The open source community for various libraries and tools
