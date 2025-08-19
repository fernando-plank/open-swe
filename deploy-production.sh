#!/bin/bash

# Production Deployment Script for Open SWE
# Choose your deployment platform

set -e

echo "🚀 Open SWE Production Deployment"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy env.example to .env and fill in your production values"
    exit 1
fi

echo "✅ Environment file found"
echo ""

echo "Choose your deployment platform:"
echo "1) Railway (Recommended - Fast & Easy)"
echo "2) Render (Already configured)"
echo "3) Fly.io (Global edge)"
echo "4) DigitalOcean App Platform"
echo "5) AWS ECS/Fargate"
echo "6) Docker Compose (Local production-like)"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🚂 Deploying to Railway..."
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
        
        echo "Logging into Railway..."
        railway login
        
        echo "Initializing project..."
        railway init
        
        echo "Deploying..."
        railway up
        
        echo "✅ Deployed to Railway!"
        echo "Check your deployment at: https://railway.app"
        ;;
        
    2)
        echo "🌐 Deploying to Render..."
        echo "Pushing to GitHub (Render will auto-deploy)..."
        git add .
        git commit -m "Production deployment"
        git push origin main
        
        echo "✅ Pushed to GitHub! Render will auto-deploy."
        echo "Check your deployment at: https://render.com"
        ;;
        
    3)
        echo "✈️  Deploying to Fly.io..."
        echo "Installing Fly CLI..."
        curl -L https://fly.io/install.sh | sh
        
        echo "Logging into Fly..."
        fly auth login
        
        echo "Launching app..."
        fly launch
        
        echo "Deploying..."
        fly deploy
        
        echo "✅ Deployed to Fly.io!"
        echo "Check your deployment at: https://fly.io"
        ;;
        
    4)
        echo "🐙 Deploying to DigitalOcean..."
        echo "Please use the DigitalOcean web interface:"
        echo "1. Go to https://cloud.digitalocean.com/apps"
        echo "2. Create new app from GitHub"
        echo "3. Select this repository"
        echo "4. Configure environment variables from .env"
        echo "5. Deploy!"
        ;;
        
    5)
        echo "☁️  Deploying to AWS ECS..."
        echo "This requires AWS CLI and ECR setup."
        echo "Please follow AWS ECS documentation for container deployment."
        ;;
        
    6)
        echo "🐳 Running with Docker Compose (Local production-like)..."
        echo "Building and starting services..."
        docker-compose up --build -d
        
        echo "✅ Services started!"
        echo "Health check: curl http://localhost:10000/health"
        echo "Logs: docker-compose logs -f"
        echo "Stop: docker-compose down"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo "Check your app's health endpoint to verify it's running."
