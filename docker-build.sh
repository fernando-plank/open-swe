echo "Building Docker image..."

docker buildx build --platform linux/amd64,linux/arm64 . -t open-swe:latest -f dockerfile.minimal