#!/bin/bash

echo "Building packages individually to bypass workspace issues..."

# Build shared package first
echo "Building @open-swe/shared..."
cd packages/shared
npx tsc
if [ $? -ne 0 ]; then
    echo "Failed to build shared package"
    exit 1
fi
cd ../..

# Build agent package
echo "Building @open-swe/agent..."
cd apps/open-swe
npx tsc --skipLibCheck
if [ $? -ne 0 ]; then
    echo "Failed to build agent package"
    exit 1
fi
cd ../..

# Build CLI package
echo "Building @open-swe/cli..."
cd apps/cli
npx tsc --skipLibCheck
if [ $? -ne 0 ]; then
    echo "Failed to build CLI package"
    exit 1
fi
cd ../..

# Build web package
echo "Building @open-swe/web..."
cd apps/web
npx tsc --skipLibCheck
if [ $? -ne 0 ]; then
    echo "Failed to build web package"
    exit 1
fi
cd ../..

echo "All packages built successfully!"
