#!/bin/bash

# Script to seed subscription plans
echo "Seeding subscription plans..."
cd /home/bsi/private-project/tirta-saas/tirta-saas-backend
go run ./scripts/seed_subscription_plans
