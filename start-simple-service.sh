#!/bin/bash

# SF Dashboard Simple Scraping Service Startup Script
# This script starts a simplified scraping service for immediate testing

echo "🚀 Starting SF Dashboard Simple Scraping Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if simple-scraping-service.js exists
if [ ! -f "simple-scraping-service.js" ]; then
    echo "❌ simple-scraping-service.js not found in current directory"
    echo "Please run this script from the SF Dashboard V2 directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔍 Starting simple scraping service..."
echo "📱 Service will be available at: http://localhost:3002"
echo "🔗 API endpoint: http://localhost:3002/api/events"
echo "💚 Health check: http://localhost:3002/health"
echo "🔄 Press Ctrl+C to stop the service"

# Start the simple scraping service
node simple-scraping-service.js
