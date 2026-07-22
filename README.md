# MediFind - AWS Serverless Drug Availability Finder

![Project Status](https://img.shields.io/badge/status-MVP-blue)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

**MediFind** is a cloud-based drug availability platform that helps users quickly find medicines available in nearby pharmacies.

The platform connects users with pharmacies by providing:

* Drug search functionality
* Pharmacy availability information
* Inventory management
* Pharmacy registration
* User notifications when medicines become available

The system is built using a **serverless AWS architecture** using Amazon API Gateway, AWS Lambda, DynamoDB, and AWS SAM.

---

# Problem Statement

Finding available medicines can be challenging because users often have to visit multiple pharmacies to locate required drugs.

MediFind solves this problem by providing a centralized platform where:

* Users can search for medicines
* Pharmacies can update their inventory
* Users can identify pharmacies with available stock

---

# Project Architecture

High-level architecture:

```
Users
 |
 |
Next.js Frontend
 |
 |
Amazon S3 + CloudFront
 |
 |
API Gateway
 |
 |
AWS Lambda Functions
 |
 |-----------------------------
 |       |        |        |
 |       |        |        |
SearchDrug  Register  Update  Get
Lambda      Pharmacy  Inventory Pharmacies
            Lambda    Lambda   Lambda
 |
 |
DynamoDB
 |
 |--------------------------
 |          |              |
Drugs   Pharmacies    Inventory


NotifyUsers Lambda
 |
 |
Amazon SNS

CloudWatch
 |
 |
Monitoring & Logs
```

---

# Technology Stack

## Frontend

* Next.js
* React
* JavaScript/TypeScript
* CSS/Tailwind CSS

## Backend

* AWS Lambda
* Python
* API Gateway

## Database

* Amazon DynamoDB

## Infrastructure

* AWS SAM
* AWS CloudFormation

## Monitoring

* Amazon CloudWatch

## Notifications

* Amazon SNS

---

# Repository Structure

```
MediFind/

├── frontend/
│   ├── public/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── styles/
│   └── package.json
│
├── backend/
│   ├── lambda/
│   │   ├── searchDrug/
│   │   ├── updateInventory/
│   │   ├── registerPharmacy/
│   │   ├── getPharmacies/
│   │   └── notifyUsers/
│   │
│   └── requirements.txt
│
├── infra/
│   ├── template.yaml
│   ├── samconfig.toml.example
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   └── screenshots/
│
├── tests/
│
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

---

# AWS Lambda Functions

## 1. searchDrug Lambda

Purpose:

Search for available medicines.

Example API:

```
GET /drugs/search?name=paracetamol
```

Response:

```json
{
  "drug": "Paracetamol",
  "available_pharmacies": [
    {
      "name": "City Pharmacy",
      "stock": 50,
      "price": 5000
    }
  ]
}
```

---

## 2. registerPharmacy Lambda

Purpose:

Allows pharmacies to register on the platform.

Example:

```
POST /pharmacies
```

Stores:

* Pharmacy name
* Location
* Contact information

---

## 3. updateInventory Lambda

Purpose:

Allows pharmacies to update medicine availability.

Example:

```
PUT /inventory
```

Updates:

* Drug quantity
* Price
* Availability status

---

## 4. getPharmacies Lambda

Purpose:

Retrieves pharmacy information.

Example:

```
GET /pharmacies
```

Returns:

* Pharmacy details
* Location
* Available medicines

---

## 5. notifyUsers Lambda

Purpose:

Notifies users when requested medicines become available.

Flow:

```
DynamoDB Update
       |
       |
notifyUsers Lambda
       |
       |
Amazon SNS
       |
       |
SMS / Email Notification
```

---

# Database Design

## Drugs Table

Primary Key:

```
drugId
```

Example:

```json
{
 "drugId":"D001",
 "name":"Paracetamol",
 "category":"Pain Relief"
}
```

---

## Pharmacies Table

Primary Key:

```
pharmacyId
```

Example:

```json
{
 "pharmacyId":"P001",
 "name":"ABC Pharmacy",
 "location":"Kampala"
}
```

---

## Inventory Table

Keys:

```
pharmacyId
drugId
```

Example:

```json
{
 "pharmacyId":"P001",
 "drugId":"D001",
 "quantity":100,
 "price":5000
}
```

---

# Local Development Setup

## Clone Repository

```bash
git clone https://github.com/denkod/MediFind.git


cd MediFind
```

---

# Frontend Setup

Navigate:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run application:

```bash
npm run dev
```

Application:

```
http://localhost:3000
```

---

# Backend Setup

Navigate:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# AWS Deployment

## Prerequisites

Install:

* AWS CLI
* AWS SAM CLI
* Python
* Node.js

Configure AWS:

```bash
aws configure
```

---

Build SAM application:

```bash
sam build
```

Deploy:

```bash
sam deploy --guided
```

---

# Security

The project follows AWS security best practices:

* IAM least privilege access
* Secure API communication
* Environment variables for secrets
* CloudWatch monitoring
* No sensitive information stored in code

---

# Future Improvements

Planned enhancements:

* Amazon Cognito user authentication
* GPS-based pharmacy search
* Amazon Location Service integration
* AI-powered medicine search assistant
* Pharmacy analytics dashboard
* Mobile application
* Payment integration

---

# Team Contribution Guidelines

Before contributing:

1. Create a feature branch

Example:

```bash
git checkout -b feature/search-drug
```

2. Commit changes:

```bash
git commit -m "Add drug search functionality"
```

3. Push branch:

```bash
git push origin feature/search-drug
```

4. Create a Pull Request

---


# License

This project is licensed under the MIT License.
