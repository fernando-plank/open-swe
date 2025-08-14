# Open SWE Deployment Guide

This guide provides comprehensive instructions for deploying Open SWE to cloud platforms, specifically Vercel and Render. Open SWE consists of two main services that need to be deployed:

1. **Next.js Web App** (`apps/web`) - The user interface
2. **LangGraph Agent Server** (`apps/open-swe`) - The AI agent backend

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub App Configuration](#github-app-configuration)
- [Vercel Deployment](#vercel-deployment)
- [Render Deployment](#render-deployment)
- [Environment Variables Reference](#environment-variables-reference)
- [Health Check Endpoints](#health-check-endpoints)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository**: Fork or clone the Open SWE repository
2. **GitHub App**: Create a GitHub App for production use
3. **API Keys**: Obtain necessary API keys (Anthropic, OpenAI, etc.)
4. **Domain/URLs**: Know your deployment URLs in advance for configuration

### Required API Keys

- **LangSmith**: For tracing and monitoring (optional but recommended)
- **Anthropic API Key**: For Claude models (primary LLM)
- **OpenAI API Key**: For GPT models (optional)
- **Google API Key**: For Gemini models (optional)
- **Daytona API Key**: For sandbox environments
- **Firecrawl API Key**: For web scraping functionality

## GitHub App Configuration

### Create Production GitHub App

1. Go to [GitHub App creation page](https://github.com/settings/apps/new)
2. Fill in the basic information:
   - **App Name**: `open-swe` (or your preferred production name)
   - **Description**: "Open SWE - AI Coding Agent"
   - **Homepage URL**: Your production web app URL
   - **Callback URL**: `https://your-domain.com/api/auth/github/callback`

3. Configure permissions:
   - **Repository permissions**:
     - Contents: Read & Write
     - Issues: Read & Write
     - Metadata: Read
     - Pull requests: Read & Write
   - **Account permissions**:
     - Email addresses: Read

4. Subscribe to events:
   - Issues
   - Issue comments
   - Pull requests

5. **Important**: Enable "Request user authorization (OAuth) during installation"

6. Create the app and note down:
   - App ID
   - Client ID
   - Client Secret
   - Private Key (download the .pem file)
   - Generate a webhook secret

### Update GitHub App Settings

After deployment, update your GitHub App with the production URLs:
- **Homepage URL**: `https://your-web-app-url.com`
- **Callback URL**: `https://your-web-app-url.com/api/auth/github/callback`
- **Webhook URL**: `https://your-langgraph-server-url.com/webhooks/github`

## Vercel Deployment

Vercel is recommended for the **Next.js Web App only**. The LangGraph server should be deployed elsewhere (like Render) as Vercel's serverless functions have limitations for long-running AI operations.

### Step 1: Prepare Repository

1. Ensure your repository has the `vercel.json` configuration file
2. The configuration is already set up to handle the monorepo structure

### Step 2: Deploy to Vercel

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the root directory (Vercel will detect the monorepo structure)

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && yarn build`
   - Output Directory: `.next`

### Step 3: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```bash
# GitHub App Configuration
NEXT_PUBLIC_GITHUB_APP_CLIENT_ID=your_github_app_client_id
GITHUB_APP_CLIENT_SECRET=your_github_app_client_secret
GITHUB_APP_REDIRECT_URI=https://your-vercel-app.vercel.app/api/auth/github/callback
GITHUB_APP_NAME=open-swe
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_content
-----END RSA PRIVATE KEY-----"

# API URLs
NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app/api
LANGGRAPH_API_URL=https://your-langgraph-server.onrender.com

# Security
SECRETS_ENCRYPTION_KEY=your_32_byte_hex_encryption_key
```

### Step 4: Deploy and Test

1. Deploy the application
2. Test the health endpoint: `https://your-vercel-app.vercel.app/health`
3. Verify GitHub OAuth flow works

## Render Deployment

Render is recommended for both services, especially the LangGraph server which requires persistent connections and longer execution times.

### Option A: Deploy Both Services to Render

#### Step 1: Prepare Repository

1. Ensure your repository has the `render.yaml` configuration file
2. The configuration defines both web app and LangGraph server services

#### Step 2: Connect to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file

#### Step 3: Configure Environment Variable Groups

Create the following environment variable groups in Render:

**langchain** group:
```bash
LANGCHAIN_PROJECT=open-swe-production
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_TEST_TRACKING=false
```

**llm-providers** group:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
```

**infrastructure** group:
```bash
DAYTONA_API_KEY=your_daytona_api_key
```

**tools** group:
```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

**github-app** group:
```bash
GITHUB_APP_NAME=open-swe
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_content
-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_GITHUB_APP_CLIENT_ID=your_github_app_client_id
GITHUB_APP_CLIENT_SECRET=your_github_app_client_secret
```

**security** group:
```bash
SECRETS_ENCRYPTION_KEY=your_32_byte_hex_encryption_key
```

#### Step 4: Deploy Services

1. Deploy both services using the blueprint
2. Note the service URLs:
   - Web App: `https://open-swe-web.onrender.com`
   - LangGraph Server: `https://open-swe-langgraph.onrender.com`

### Option B: Hybrid Deployment (Vercel + Render)

Deploy the web app to Vercel and the LangGraph server to Render:

1. **Deploy LangGraph Server to Render**:
   - Create a new Web Service
   - Connect your repository
   - Set Root Directory to `apps/open-swe`
   - Build Command: `cd ../.. && yarn install --frozen-lockfile && yarn build`
   - Start Command: `yarn start`

2. **Deploy Web App to Vercel** (follow Vercel steps above)

3. **Configure Cross-Service Communication**:
   - Set `LANGGRAPH_API_URL` in Vercel to your Render LangGraph service URL
   - Set `OPEN_SWE_APP_URL` in Render to your Vercel web app URL

## Environment Variables Reference

### Web App Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GITHUB_APP_CLIENT_ID` | GitHub App Client ID (public) | `Iv1.a1b2c3d4e5f6g7h8` |
| `GITHUB_APP_CLIENT_SECRET` | GitHub App Client Secret | `1234567890abcdef...` |
| `GITHUB_APP_REDIRECT_URI` | OAuth callback URL | `https://your-app.com/api/auth/github/callback` |
| `GITHUB_APP_NAME` | GitHub App name | `open-swe` |
| `GITHUB_APP_ID` | GitHub App ID | `123456` |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App Private Key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `NEXT_PUBLIC_API_URL` | Web app API URL | `https://your-app.com/api` |
| `LANGGRAPH_API_URL` | LangGraph server URL | `https://your-langgraph.com` |
| `SECRETS_ENCRYPTION_KEY` | 32-byte hex encryption key | `abcdef1234567890...` |

### LangGraph Server Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (set by platform) | `10000` |
| `NODE_ENV` | Environment | `production` |
| `LANGCHAIN_PROJECT` | LangSmith project name | `open-swe-production` |
| `LANGCHAIN_API_KEY` | LangSmith API key | `lsv2_pt_...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `DAYTONA_API_KEY` | Daytona API key | `dt_...` |
| `GITHUB_WEBHOOK_SECRET` | Webhook verification secret | `your_webhook_secret` |
| `OPEN_SWE_APP_URL` | Web app URL for GitHub links | `https://your-web-app.com` |
| `SECRETS_ENCRYPTION_KEY` | Same as web app | `abcdef1234567890...` |

### Generating Encryption Key

Generate a secure 32-byte hex encryption key:

```bash
openssl rand -hex 32
```

**Important**: Use the same encryption key for both web app and LangGraph server.

## Health Check Endpoints

Both services include health check endpoints for monitoring:

- **Web App**: `https://your-web-app.com/health`
- **LangGraph Server**: `https://your-langgraph-server.com/health`

The web app health check also verifies connectivity to the LangGraph server.

## Troubleshooting

### Common Issues

#### 1. "LANGGRAPH_API_URL not set in production environment"

**Problem**: The web app can't connect to the LangGraph server.

**Solution**:
- Verify `LANGGRAPH_API_URL` is set in web app environment variables
- Ensure the URL is correct and accessible
- Check health endpoint: `https://your-langgraph-server.com/health`

#### 2. "No GitHub installation ID found"

**Problem**: GitHub App authentication is not working.

**Solution**:
- Verify GitHub App is installed on your repositories
- Check GitHub App configuration matches environment variables
- Ensure callback URL is correct in GitHub App settings

#### 3. "SECRETS_ENCRYPTION_KEY environment variable is required"

**Problem**: Encryption key is missing or incorrect.

**Solution**:
- Generate a new 32-byte hex key: `openssl rand -hex 32`
- Set the same key in both web app and LangGraph server
- Ensure the key is properly formatted (64 hex characters)

#### 4. Build Failures in Monorepo

**Problem**: Build fails due to monorepo structure.

**Solution**:
- Verify build commands navigate to repository root: `cd ../.. && yarn build`
- Ensure shared package is built first (handled by Turbo)
- Check that all dependencies are properly installed

#### 5. Health Check Failures

**Problem**: Health checks return 503 or fail.

**Solution**:
- Check service logs for specific error messages
- Verify all required environment variables are set
- Test inter-service connectivity
- Ensure services are running on correct ports

#### 6. GitHub Webhook Not Working

**Problem**: GitHub issues don't trigger the agent.

**Solution**:
- Verify webhook URL in GitHub App settings
- Check webhook secret matches environment variable
- Ensure LangGraph server is accessible from GitHub
- Test webhook endpoint manually

#### 7. "peer closed connection" Errors

**Problem**: Network connection issues in cloud deployment.

**Solution**:
- This is handled by the enhanced retry logic
- Check service logs for retry attempts
- Verify network connectivity between services
- Consider increasing timeout values if needed

### Debugging Steps

1. **Check Health Endpoints**:
   ```bash
   curl https://your-web-app.com/health
   curl https://your-langgraph-server.com/health
   ```

2. **Verify Environment Variables**:
   - Check all required variables are set
   - Verify URLs are accessible
   - Test GitHub App configuration

3. **Check Service Logs**:
   - Review deployment logs for errors
   - Look for specific error messages
   - Check retry attempts and network issues

4. **Test GitHub Integration**:
   - Create a test issue with the `open-swe` label
   - Check webhook delivery in GitHub App settings
   - Verify agent responds to the issue

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/langchain-ai/open-swe/issues) for similar problems
2. Review service logs for specific error messages
3. Verify all environment variables are correctly set
4. Test each component individually (health checks, GitHub auth, etc.)

## Security Considerations

- **Environment Variables**: Never commit API keys or secrets to version control
- **GitHub App**: Use separate GitHub Apps for development and production
- **Encryption Key**: Generate a strong, unique encryption key for production
- **HTTPS**: Always use HTTPS in production for secure communication
- **Webhook Secret**: Use a strong, unique webhook secret for GitHub integration

## Performance Optimization

- **Timeouts**: The system includes cloud-optimized timeout configurations
- **Retry Logic**: Enhanced retry logic handles network issues automatically
- **Health Checks**: Regular health checks ensure service availability
- **Monitoring**: Use LangSmith for tracing and monitoring AI operations

---

This deployment guide should help you successfully deploy Open SWE to production. For additional support, refer to the project documentation or create an issue in the GitHub repository.
