#!/bin/bash

# Deployment script for Firebase Functions
# This script builds and deploys the Firebase Functions

echo "🚀 Starting Firebase Functions deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Installing globally..."
    npm install -g firebase-tools
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase CLI..."
    firebase login
fi

# Navigate to functions directory
cd functions

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build functions
echo "🔨 Building functions..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

# Deploy functions
echo "🚀 Deploying functions..."
cd ..
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Functions deployed successfully!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi