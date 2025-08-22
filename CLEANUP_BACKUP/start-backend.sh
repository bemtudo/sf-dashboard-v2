#!/bin/bash

# SF Dashboard Backend Startup Script
# This script starts your existing backend with all the scrapers

echo "🚀 Starting SF Dashboard Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to backend directory
BACKEND_DIR="/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

echo "📁 Backend directory: $BACKEND_DIR"
cd "$BACKEND_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "📦 Initializing backend project..."
    npm init -y
    
    echo "📦 Installing dependencies..."
    npm install express cors puppeteer cheerio
    npm install -D nodemon
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔍 Starting backend server..."
echo "📱 Backend will be available at: http://localhost:3000"
echo "🔗 API endpoint: http://localhost:3000/api/events"
echo "🔄 Press Ctrl+C to stop the server"

# Start the backend server
npm run dev || npm start
