#!/bin/bash

# Build script for optimized Docker images
# This will create both standard and ultra-optimized versions

set -e

echo "🐳 Building Optimized Docker Images"
echo "=================================="

# Build standard optimized version
echo "Building standard optimized version..."
docker build -t open-swe-optimized -f dockerfile .

# Build ultra-optimized version
echo "Building ultra-optimized version..."
docker build -t open-swe-ultra -f dockerfile.ultra .

# Show image sizes
echo ""
echo "📊 Image Size Comparison:"
echo "========================"

echo "Original image:"
docker images open-swe-test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "Standard optimized:"
docker images open-swe-optimized --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "Ultra-optimized:"
docker images open-swe-ultra --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "🎯 Size Reduction Summary:"
echo "========================="

# Calculate size reduction
ORIGINAL_SIZE=$(docker images open-swe-test --format "{{.Size}}" | sed 's/[^0-9.]//g')
OPTIMIZED_SIZE=$(docker images open-swe-optimized --format "{{.Size}}" | sed 's/[^0-9.]//g')
ULTRA_SIZE=$(docker images open-swe-ultra --format "{{.Size}}" | sed 's/[^0-9.]//g')

if [[ "$ORIGINAL_SIZE" =~ ^[0-9.]+$ ]] && [[ "$OPTIMIZED_SIZE" =~ ^[0-9.]+$ ]]; then
    REDUCTION_STD=$(echo "scale=1; (($ORIGINAL_SIZE - $OPTIMIZED_SIZE) / $ORIGINAL_SIZE) * 100" | bc -l)
    echo "Standard optimized: ${REDUCTION_STD}% smaller"
fi

if [[ "$ORIGINAL_SIZE" =~ ^[0-9.]+$ ]] && [[ "$ULTRA_SIZE" =~ ^[0-9.]+$ ]]; then
    REDUCTION_ULTRA=$(echo "scale=1; (($ORIGINAL_SIZE - $ULTRA_SIZE) / $ORIGINAL_SIZE) * 100" | bc -l)
    echo "Ultra-optimized: ${REDUCTION_ULTRA}% smaller"
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "To test the optimized versions:"
echo "Standard: docker run --rm -p 10000:10000 open-swe-optimized"
echo "Ultra:    docker run --rm -p 10000:10000 open-swe-ultra"
