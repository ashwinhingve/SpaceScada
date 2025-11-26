#!/bin/bash

# Script to install Google Maps package for GIS module

echo "Installing @googlemaps/js-api-loader..."

# Try different installation methods
cd "$(dirname "$0")"

# Method 1: Use existing store location
echo "Method 1: Using existing pnpm store..."
pnpm config set store-dir "D:/.pnpm-store/v3" 2>/dev/null
pnpm install --no-frozen-lockfile

if [ $? -eq 0 ]; then
    echo "✓ Package installed successfully!"
    exit 0
fi

# Method 2: Force reinstall
echo "Method 2: Force reinstall..."
rm -rf node_modules
pnpm install --force

if [ $? -eq 0 ]; then
    echo "✓ Package installed successfully!"
    exit 0
fi

echo "❌ Installation failed. Please try manually:"
echo "  cd /mnt/d/Do\ Not\ Open/project/webscada"
echo "  rm -rf node_modules pnpm-lock.yaml"
echo "  pnpm install"
