#!/bin/bash

# SF Dashboard Startup Script
# This script builds and starts the dashboard in production mode

echo "🚀 Starting SF Dashboard..."

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

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building for production..."
npm run build

echo "🌐 Starting production server..."
echo "📱 Dashboard will be available at: http://localhost:3000"
echo "🔄 Press Ctrl+C to stop the server"

# Start the production server
npm run start
