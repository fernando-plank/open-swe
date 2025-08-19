#!/bin/bash

# Simple Docker run script for Open SWE testing
# This version only includes the minimum required variables

echo "Starting Open SWE Docker container with minimal config..."

docker run --rm -d \
  --name open-swe-test \
  -p 10000:10000 \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e LANGCHAIN_TRACING_V2=false \
  -e OPEN_SWE_LOCAL_MODE=true \
  open-swe-test

echo "Container started! Check logs with: docker logs open-swe-test"
echo "Health check: curl http://localhost:10000/health"
echo ""
echo "To stop: docker stop open-swe-test"
