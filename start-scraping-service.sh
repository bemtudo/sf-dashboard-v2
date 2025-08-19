#!/bin/bash

# SF Dashboard Dedicated Scraping Service Startup Script
# This script starts the scraping service independently to avoid Puppeteer-Electron conflicts

echo "🚀 Starting SF Dashboard Dedicated Scraping Service..."

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

# Check if backend directory exists
BACKEND_DIR="/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    echo "Please ensure your backend scrapers are available at this location."
    exit 1
fi

echo "📁 Backend directory found: $BACKEND_DIR"

# Check if scraping-service.js exists
if [ ! -f "scraping-service.js" ]; then
    echo "❌ scraping-service.js not found in current directory"
    echo "Please run this script from the SF Dashboard V2 directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if backend dependencies are installed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    cd - > /dev/null
fi

echo "🔍 Starting dedicated scraping service..."
echo "📱 Service will be available at: http://localhost:3002"
echo "🔗 API endpoint: http://localhost:3002/api/events"
echo "💚 Health check: http://localhost:3002/health"
echo "🔄 Press Ctrl+C to stop the service"

# Start the dedicated scraping service
node scraping-service.js
