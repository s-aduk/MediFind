# MediFind
A cloud-native platform for finding medicines available in pharmacies across the city.


## 🗄️ Database Setup & Seeding

This project uses **Amazon DynamoDB** as its database service. Follow these steps to set up and populate your local development environment with initial test data.

### Prerequisites

1. Ensure you have Python installed (`v3.8+`).
2. Make sure `boto3` is installed:
   ```bash
   pip install boto3

3. Configure your AWS credentials locally using the AWS CLI:

    ```bash
    aws configure
4. Enter your AWS Access Key ID, Secret Access Key, and set the region to `us-east-1`.

5. Seeding the Database
To populate your DynamoDB tables (Pharmacies and Inventory) with test data, run the seed script:

    ```ash
    python seed_data.py

6. Verifying the Seeded Data
To verify that the records were successfully inserted into AWS DynamoDB, run the test reader script:

    ```bash
    python test_read.py
