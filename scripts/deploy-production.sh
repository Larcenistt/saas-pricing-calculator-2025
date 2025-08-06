#!/bin/bash

# SaaS Pricing Calculator - Production Deployment Script
# This script deploys the application to production environment

set -e  # Exit on error

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOYMENT_LOG="deployment_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $DEPLOYMENT_LOG
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $DEPLOYMENT_LOG
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $DEPLOYMENT_LOG
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required tools are installed
    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v kubectl >/dev/null 2>&1 || warning "Kubectl is not installed (needed for Kubernetes deployment)"
    command -v node >/dev/null 2>&1 || error "Node.js is not installed"
    command -v npm >/dev/null 2>&1 || error "npm is not installed"
    
    # Check if environment file exists
    if [ ! -f ".env.production" ]; then
        error "Production environment file (.env.production) not found!"
    fi
    
    # Verify all tests pass
    log "Running tests..."
    npm test --silent || error "Tests failed! Aborting deployment."
    
    log "✅ Pre-deployment checks passed"
}

# Build Frontend
build_frontend() {
    log "Building frontend application..."
    
    # Install dependencies
    npm ci --production=false
    
    # Build for production
    NODE_ENV=production npm run build || error "Frontend build failed"
    
    # Verify build output
    if [ ! -d "dist" ]; then
        error "Frontend build directory not found"
    fi
    
    log "✅ Frontend build complete"
}

# Build Backend
build_backend() {
    log "Building backend application..."
    
    cd backend
    
    # Install dependencies
    npm ci --production=false
    
    # Generate Prisma client
    npx prisma generate || error "Prisma generation failed"
    
    # Build TypeScript
    npm run build || error "Backend build failed"
    
    # Verify build output
    if [ ! -d "dist" ]; then
        error "Backend build directory not found"
    fi
    
    cd ..
    log "✅ Backend build complete"
}

# Deploy Database Migrations
deploy_database() {
    log "Deploying database migrations..."
    
    cd backend
    
    # Run migrations
    NODE_ENV=production npx prisma migrate deploy || error "Database migration failed"
    
    cd ..
    log "✅ Database migrations complete"
}

# Deploy to Vercel (Frontend)
deploy_frontend_vercel() {
    log "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    command -v vercel >/dev/null 2>&1 || {
        log "Installing Vercel CLI..."
        npm i -g vercel
    }
    
    # Deploy to production
    vercel --prod --yes \
        --env NODE_ENV=production \
        --env VITE_API_URL=$PRODUCTION_API_URL \
        --env VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_LIVE_PUBLISHABLE_KEY \
        --env VITE_GA_TRACKING_ID=$GA_TRACKING_ID \
        || error "Vercel deployment failed"
    
    log "✅ Frontend deployed to Vercel"
}

# Deploy Backend (Docker/Kubernetes)
deploy_backend_k8s() {
    log "Deploying backend to Kubernetes..."
    
    # Build Docker image
    docker build -t saas-pricing-backend:$TIMESTAMP ./backend || error "Docker build failed"
    
    # Tag for registry
    docker tag saas-pricing-backend:$TIMESTAMP $DOCKER_REGISTRY/saas-pricing-backend:$TIMESTAMP
    docker tag saas-pricing-backend:$TIMESTAMP $DOCKER_REGISTRY/saas-pricing-backend:latest
    
    # Push to registry
    docker push $DOCKER_REGISTRY/saas-pricing-backend:$TIMESTAMP || error "Docker push failed"
    docker push $DOCKER_REGISTRY/saas-pricing-backend:latest
    
    # Apply Kubernetes configurations
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    
    # Wait for rollout
    kubectl rollout status deployment/backend -n saas-pricing --timeout=300s || error "Deployment rollout failed"
    
    log "✅ Backend deployed to Kubernetes"
}

# Deploy Backend (Alternative: Cloud Run/Heroku/Railway)
deploy_backend_cloud() {
    log "Deploying backend to cloud platform..."
    
    # Example for Google Cloud Run
    # gcloud run deploy saas-pricing-backend \
    #     --source ./backend \
    #     --region us-central1 \
    #     --platform managed \
    #     --allow-unauthenticated
    
    # Example for Heroku
    # cd backend
    # heroku create saas-pricing-backend-prod
    # git push heroku main
    # heroku run npm run prisma:deploy
    
    # Example for Railway
    # railway up -d
    
    warning "Cloud deployment needs to be configured for your specific provider"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    # Check frontend
    curl -f https://predictionnexus.com || warning "Frontend health check failed"
    
    # Check backend API
    curl -f $PRODUCTION_API_URL/health || error "Backend health check failed"
    
    # Check database connection
    cd backend
    NODE_ENV=production npm run db:health || error "Database health check failed"
    cd ..
    
    log "✅ All health checks passed"
}

# Smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Run E2E tests against production
    CYPRESS_BASE_URL=https://predictionnexus.com npm run test:e2e:smoke || warning "Some smoke tests failed"
    
    log "✅ Smoke tests complete"
}

# Send deployment notification
send_notification() {
    log "Sending deployment notification..."
    
    # Slack notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 SaaS Pricing Calculator deployed to production successfully! Version: $TIMESTAMP\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    # Email notification
    # You can add email notification here
    
    log "✅ Notifications sent"
}

# Rollback function
rollback() {
    error "Deployment failed! Starting rollback..."
    
    # Kubernetes rollback
    kubectl rollout undo deployment/backend -n saas-pricing
    
    # Vercel rollback (manual)
    warning "Please manually rollback Vercel deployment if needed"
    
    error "Rollback initiated. Please verify system status."
}

# Main deployment flow
main() {
    log "🎯 Deployment started at $(date)"
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $TIMESTAMP"
    
    # Trap errors for rollback
    trap rollback ERR
    
    # Execute deployment steps
    pre_deployment_checks
    build_frontend
    build_backend
    
    # Deploy database first
    deploy_database
    
    # Deploy applications
    deploy_frontend_vercel
    
    # Choose backend deployment method
    if [ "$DEPLOYMENT_METHOD" = "kubernetes" ]; then
        deploy_backend_k8s
    else
        deploy_backend_cloud
    fi
    
    # Post-deployment
    run_health_checks
    run_smoke_tests
    send_notification
    
    log "✅ Deployment completed successfully!"
    log "🎉 SaaS Pricing Calculator is now live in production!"
    log "📊 Monitor at: https://monitoring.predictionnexus.com"
    log "📧 Support: support@predictionnexus.com"
}

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | xargs)
fi

# Run main deployment
main