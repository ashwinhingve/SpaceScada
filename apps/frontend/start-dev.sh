#!/bin/bash

# WebSCADA Frontend - Development Startup Script

echo "🚀 Starting WebSCADA Frontend..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found, creating from .env.example..."
  cp .env.example .env.local
  echo "✓ Created .env.local"
  echo ""
  echo "📝 Please review .env.local and update if needed:"
  echo "   - NEXT_PUBLIC_API_URL (default: http://localhost:3002)"
  echo "   - NEXT_PUBLIC_WEBSOCKET_URL (default: http://localhost:3002)"
  echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
  echo ""
fi

# Show configuration
echo "📋 Configuration:"
echo "   API URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3002}"
echo "   WebSocket URL: ${NEXT_PUBLIC_WEBSOCKET_URL:-http://localhost:3002}"
echo ""

echo "🔧 Running type check..."
pnpm type-check

if [ $? -eq 0 ]; then
  echo "✓ Type check passed"
  echo ""
  echo "🌐 Starting development server..."
  echo "   Dashboard: http://localhost:3000/dashboard"
  echo "   Home: http://localhost:3000"
  echo ""
  echo "💡 Tips:"
  echo "   - Make sure realtime-service is running on port 3002"
  echo "   - Press Ctrl+C to stop the server"
  echo ""
  pnpm dev
else
  echo "❌ Type check failed. Please fix errors before starting."
  exit 1
fi
