# MediFind - AWS Serverless Drug Availability Finder

![Project Status](https://img.shields.io/badge/status-MVP-blue)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange)
![License](https://img.shields.io/badge/license-MIT-green)

A cloud-native platform for helping users find medicines available in pharmacies across the city.

## System Architecture

<img width="304" height="720" alt="MediFind Architecture" src="https://github.com/user-attachments/assets/f9a40f9f-cb1a-4869-858f-d4e8d4e5e640" />

## Overview

**MediFind** is a cloud-based drug availability platform that helps users quickly find medicines available in nearby pharmacies.

The platform connects users with pharmacies by providing:

- Drug search functionality
- Pharmacy availability information
- Inventory management
- Pharmacy registration
- User notifications when medicines become available

The system is built using a **serverless AWS architecture** using Amazon API Gateway, AWS Lambda, DynamoDB, and AWS SAM.


## Features

- Search for medicines
- View pharmacies with available stock
- Pharmacy registration
- Inventory management
- Notification support


## Tech Stack

### Frontend
- Next.js
- React

### Backend
- AWS Lambda
- Amazon API Gateway

### Database
- Amazon DynamoDB

### Infrastructure
- AWS SAM


## Repository Structure

```text
frontend/
backend/
infra/
docs/
tests/


```markdown
## Getting Started

### Clone the repository

```bash
git clone https://github.com/denkod/MediFind.git
cd MediFind



cd frontend
npm install
npm run dev

cd infra
sam build
sam deploy --guided