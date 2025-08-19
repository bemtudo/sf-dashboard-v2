#!/bin/bash

# SF Dashboard Enhanced Scraping Service Startup Script
# This script starts the enhanced service that tries to use your real scrapers

echo "🚀 Starting SF Dashboard Enhanced Scraping Service..."

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

# Check if enhanced-scraping-service.js exists
if [ ! -f "enhanced-scraping-service.js" ]; then
    echo "❌ enhanced-scraping-service.js not found in current directory"
    echo "Please run this script from the SF Dashboard V2 directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔍 Starting enhanced scraping service..."
echo "📱 Service will be available at: http://localhost:3002"
echo "🔗 API endpoint: http://localhost:3002/api/events"
echo "💚 Health check: http://localhost:3002/health"
echo "🎯 This service will try to use your real scrapers!"
echo "🔄 Press Ctrl+C to stop the service"

# Start the enhanced scraping service
node enhanced-scraping-service.js
