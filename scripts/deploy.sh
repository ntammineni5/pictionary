#!/bin/bash

# Pictionary Production Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 Pictionary Deployment Script"
echo "==============================="
echo ""

# Build the application
echo "Building application..."
npm run build
echo "✅ Build complete"
echo ""

# Run tests (if you add them later)
# echo "Running tests..."
# npm test
# echo "✅ Tests passed"
# echo ""

# Build Docker image
echo "Building Docker image..."
docker build -t pictionary:latest .
echo "✅ Docker image built"
echo ""

# Option to deploy
read -p "Deploy with Docker Compose? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Docker Compose..."
    docker-compose down
    docker-compose up -d
    echo "✅ Application deployed!"
    echo ""
    echo "Services running:"
    docker-compose ps
    echo ""
    echo "View logs: docker-compose logs -f"
fi

echo "Deployment complete! 🎉"
