#!/bin/bash

# fresh-start.sh - Complete React Native app reset

echo "🧹 Starting complete app reset..."

# Kill all node processes
echo "Stopping all node processes..."
killall -9 node 2>/dev/null
sleep 1

# Clear all caches and build artifacts
echo "Removing all cached and build files..."
rm -rf node_modules
rm -rf .expo
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build
rm -rf .cache
rm -rf dist

# Clear all package locks
echo "Removing package lock files..."
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Clear Metro bundler cache
echo "Cleaning Metro cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Try to find any database files and delete them
echo "Finding and deleting database files..."
find . -name "*.db" -type f -delete
find . -name "*.sqlite" -type f -delete
find . -name "*.db-*" -type f -delete

# Reinstall everything
echo "Reinstalling all dependencies..."
npm install

# Create a file to signal fresh install
touch .FRESH_INSTALL

# Create resetAppData file if it doesn't exist
mkdir -p src/utils

# Add full path to the log for clarity
CURRENT_DIR=$(pwd)

echo "🚀 Fresh installation complete!"
echo "🔄 Now run: npx expo start --clear"
echo ""
echo "📂 Current directory: $CURRENT_DIR"
echo "📝 If the app still doesn't start, edit app/_layout.tsx and src/utils/resetAppData.ts to check for errors" 