#!/bin/bash

# Vercel Deployment Script for SaaS Pricing Calculator
# This script helps deploy the application to Vercel

echo "=========================================="
echo "Vercel Deployment for SaaS Pricing Calculator"
echo "=========================================="

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the project locally to verify it works
echo "Building project locally to verify..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed! Please fix build errors before deploying."
    exit 1
fi

echo "Build successful!"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI globally..."
    npm i -g vercel
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT STEPS:"
echo "=========================================="
echo ""
echo "1. First, ensure you're logged in to Vercel:"
echo "   Run: vercel login"
echo ""
echo "2. Deploy to Vercel:"
echo "   Run: vercel --prod"
echo ""
echo "3. If this is your first deployment, Vercel will ask:"
echo "   - Set up and deploy? [Y/n]: Y"
echo "   - Which scope? Select your account"
echo "   - Link to existing project? [y/N]: N (if new) or Y (if exists)"
echo "   - Project name: saas-pricing-calculator-2025"
echo "   - Directory to deploy: ./"
echo ""
echo "4. For production deployment:"
echo "   Run: vercel --prod"
echo ""
echo "=========================================="
echo "IMPORTANT ENVIRONMENT VARIABLES:"
echo "=========================================="
echo ""
echo "Make sure to set these in Vercel Dashboard:"
echo "  - VITE_API_URL (your backend URL)"
echo "  - VITE_STRIPE_PUBLISHABLE_KEY"
echo "  - VITE_GA_TRACKING_ID"
echo ""
echo "To set environment variables:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings > Environment Variables"
echo "4. Add the variables listed above"
echo ""