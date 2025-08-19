# Multi-stage build for optimized production image
FROM node:22-alpine AS base

WORKDIR /app

# Install only essential system dependencies
RUN apk add --no-cache git curl

# Use Yarn 3.5.1 via Corepack
ENV YARN_NODE_LINKER=node-modules
RUN corepack enable && corepack prepare yarn@3.5.1 --activate

# Copy only package files for dependency installation
COPY package.json yarn.lock turbo.json ./
COPY apps/open-swe/package.json apps/open-swe/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/cli/package.json apps/cli/package.json
COPY apps/web/package.json apps/web/package.json

# Install dependencies
RUN yarn install --immutable --mode=skip-build

# Copy source code
COPY . .

# Build the application
RUN cd packages/shared && npx tsc
RUN cd apps/open-swe && npx tsc

# Production stage - minimal runtime
FROM node:22-alpine AS production

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache curl

# Copy only necessary files from base
COPY --from=base /app/apps/open-swe/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/open-swe/src ./src
COPY --from=base /app/packages/shared/src ./packages/shared/src
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/apps/open-swe/langgraph.json ./

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1

# Run the app
CMD ["npx", "langgraphjs", "dev", "--host", "0.0.0.0", "--port", "10000", "--config", "langgraph.json"]
