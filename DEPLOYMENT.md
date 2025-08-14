# Deployment Guide

This guide provides comprehensive instructions for deploying the Open SWE application to production using Vercel (web app) and Render (LangGraph agent).

## Overview

The Open SWE application consists of two main components:
- **Web App** (`apps/web`): Next.js 15 application deployed to Vercel
- **Agent App** (`apps/open-swe`): LangGraph agent application deployed to Render

Both applications depend on the shared package (`packages/shared`) and require proper environment variable configuration for production deployment.

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub repository with the Open SWE codebase
- [ ] Vercel account and CLI installed
- [ ] Render account
- [ ] GitHub App configured for OAuth
- [ ] Required API keys (see Environment Variables section)

## Quick Start

1. **Set up environment variables** (see detailed section below)
2. **Deploy web app to Vercel**
3. **Deploy agent app to Render**
4. **Configure GitHub Actions** (optional, for automated deployments)

## Environment Variables Setup

### Required API Keys and Secrets

Before deployment, obtain the following:

#### GitHub App Configuration
1. Create a GitHub App in your GitHub organization/account
2. Configure OAuth redirect URLs for production
3. Generate and download the private key
4. Note the App ID and Client ID

#### LLM Provider Keys
- **Anthropic API Key**: Sign up at [Anthropic Console](https://console.anthropic.com/)
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/)
- **Google API Key**: Create at [Google AI Studio](https://aistudio.google.com/)

#### Infrastructure Keys
- **Daytona API Key**: Required for cloud sandbox management
- **Firecrawl API Key**: For URL content extraction
- **LangSmith API Key**: For tracing and monitoring (optional)

#### Security
- **Encryption Key**: Generate with `openssl rand -hex 32`

### Web App Environment Variables (Vercel)

Copy `apps/web/.env.production.example` to `apps/web/.env.production` and update:

```bash
# GitHub App Secrets
NEXT_PUBLIC_GITHUB_APP_CLIENT_ID="your_github_app_client_id"
GITHUB_APP_CLIENT_SECRET="your_github_app_client_secret"
GITHUB_APP_REDIRECT_URI="https://your-vercel-app.vercel.app/api/auth/github/callback"
GITHUB_APP_NAME="your-github-app-name"
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your private key...
-----END RSA PRIVATE KEY-----"

# API URLs
NEXT_PUBLIC_API_URL="https://your-vercel-app.vercel.app/api"
LANGGRAPH_API_URL="https://your-render-service.onrender.com"

# Security
SECRETS_ENCRYPTION_KEY="your_32_byte_hex_encryption_key"
```

### Agent App Environment Variables (Render)

Copy `apps/open-swe/.env.production.example` to `apps/open-swe/.env.production` and update:

```bash
# LangSmith (optional)
LANGCHAIN_API_KEY="lsv2_pt_your_langsmith_api_key"

# LLM Provider Keys
ANTHROPIC_API_KEY="your_anthropic_api_key"
OPENAI_API_KEY="your_openai_api_key"
GOOGLE_API_KEY="your_google_api_key"

# Infrastructure
DAYTONA_API_KEY="your_daytona_api_key"
FIRECRAWL_API_KEY="your_firecrawl_api_key"

# GitHub App Secrets
GITHUB_APP_NAME="your-github-app-name"
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your private key...
-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your_github_webhook_secret"

# Configuration
OPEN_SWE_APP_URL="https://your-vercel-app.vercel.app"
SECRETS_ENCRYPTION_KEY="your_32_byte_hex_encryption_key"
```

## Vercel Deployment (Web App)

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from repository root**:
   ```bash
   vercel --prod
   ```

4. **Configure environment variables** in Vercel dashboard or via CLI:
   ```bash
   vercel env add NEXT_PUBLIC_GITHUB_APP_CLIENT_ID
   vercel env add GITHUB_APP_CLIENT_SECRET
   # ... add all required variables
   ```

### Method 2: Vercel Dashboard

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `yarn build --filter=@open-swe/web`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `yarn install --frozen-lockfile`

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all variables from the web app template
   - Ensure production environment is selected

4. **Deploy**:
   - Click "Deploy"
   - Monitor build logs for any issues

### Method 3: GitHub Integration

The repository includes a pre-configured `vercel.json` that automatically handles:
- Monorepo build configuration
- Environment variable mapping
- Build optimizations

Simply connect your repository to Vercel, and it will use these settings automatically.

## Render Deployment (Agent App)

### Method 1: Render Dashboard (Recommended)

1. **Create New Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: `open-swe-agent`
   - **Runtime**: Node
   - **Build Command**: `yarn install --frozen-lockfile && yarn build --filter=@open-swe/agent`
   - **Start Command**: `yarn workspace @open-swe/agent start`
   - **Node Version**: 20

3. **Set Environment Variables**:
   - Add all variables from the agent app template
   - Use the "Add from .env" feature if you have a local file

4. **Deploy**:
   - Click "Create Web Service"
   - Monitor deployment logs

### Method 2: render.yaml (Infrastructure as Code)

The repository includes a `render.yaml` file for automated deployment:

1. **Connect Repository** to Render
2. **Enable Auto-Deploy** from the repository
3. **Configure Environment Variables** in Render dashboard
4. **Push to main branch** to trigger deployment

### Method 3: Render CLI

1. **Install Render CLI**:
   ```bash
   npm install -g @render/cli
   ```

2. **Login**:
   ```bash
   render auth login
   ```

3. **Deploy**:
   ```bash
   render deploy
   ```

## GitHub Actions Setup (Automated Deployments)

### Prerequisites

1. **Move Workflow File**:
   ```bash
   mkdir -p .github/workflows
   mv tmp-workflows/deploy.yml .github/workflows/deploy.yml
   ```

2. **Configure GitHub Secrets**:
   Go to Repository Settings → Secrets and Variables → Actions

#### Vercel Secrets
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Render Secrets
```
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_render_service_id
RENDER_SERVICE_URL=https://your-service.onrender.com
```

#### Application Secrets
Add all environment variables from both apps as GitHub secrets.

### Workflow Features

- **Smart Deployment**: Only deploys services with actual changes
- **Build Caching**: Optimized build times with dependency and artifact caching
- **Environment Separation**: Separate production environments for web and agent
- **PR Integration**: Deployment status and URLs in pull request comments
- **Manual Triggers**: Deploy manually via GitHub Actions UI

## Deployment Scripts

The repository includes convenient deployment scripts:

```bash
# Deploy web app only
yarn deploy:web

# Deploy agent app only
yarn deploy:agent

# Deploy both applications
yarn deploy:all

# Clean and lint before deployment
yarn predeploy
```

## Post-Deployment Configuration

### 1. Update GitHub App Settings

After deployment, update your GitHub App configuration:
- **Homepage URL**: `https://your-vercel-app.vercel.app`
- **Callback URL**: `https://your-vercel-app.vercel.app/api/auth/github/callback`
- **Webhook URL**: `https://your-render-service.onrender.com/webhooks/github`

### 2. Test Integration

1. **Web App**: Visit your Vercel URL and test GitHub OAuth login
2. **Agent App**: Check Render service logs for successful startup
3. **Integration**: Create a test GitHub issue to verify webhook handling

### 3. Monitor Services

- **Vercel**: Monitor via Vercel dashboard and analytics
- **Render**: Check service logs and metrics in Render dashboard
- **LangSmith**: Monitor agent performance and tracing (if configured)

## Troubleshooting

### Common Issues

#### Build Failures

**Problem**: Build fails with "Cannot find module '@open-swe/shared'"
**Solution**: 
- Ensure build command includes shared package: `yarn build --filter=@open-swe/web`
- Check that `packages/shared` is built first (handled automatically by Turbo)

**Problem**: "Module not found" errors during build
**Solution**:
- Verify all dependencies are listed in respective `package.json` files
- Run `yarn install` to ensure lockfile is up to date
- Check Turbo configuration in `turbo.json`

#### Environment Variable Issues

**Problem**: "Environment variable not found" errors
**Solution**:
- Verify all required variables are set in deployment platform
- Check variable names match exactly (case-sensitive)
- Ensure multi-line variables (like private keys) are properly formatted

**Problem**: GitHub OAuth not working
**Solution**:
- Verify `GITHUB_APP_REDIRECT_URI` matches your deployed URL
- Check GitHub App settings have correct callback URL
- Ensure `GITHUB_APP_PRIVATE_KEY` includes proper line breaks

#### Deployment Platform Issues

**Vercel Issues**:
- **Build timeout**: Increase build timeout in project settings
- **Function timeout**: Check API route timeouts (configured in `vercel.json`)
- **Memory issues**: Upgrade to higher plan if needed

**Render Issues**:
- **Service won't start**: Check start command and port configuration
- **Build failures**: Verify Node.js version and build command
- **Memory/CPU limits**: Upgrade service plan if needed

#### Runtime Issues

**Problem**: Agent not responding to GitHub webhooks
**Solution**:
- Check Render service logs for errors
- Verify `GITHUB_WEBHOOK_SECRET` is correctly configured
- Test webhook delivery in GitHub App settings

**Problem**: Web app can't connect to agent
**Solution**:
- Verify `LANGGRAPH_API_URL` points to correct Render service
- Check agent service is running and healthy
- Ensure both services use same `SECRETS_ENCRYPTION_KEY`

### Debug Commands

```bash
# Check build locally
yarn build

# Test specific app builds
yarn deploy:web
yarn deploy:agent

# Verify environment variables
yarn workspace @open-swe/web dev
yarn workspace @open-swe/agent dev

# Check service health
curl https://your-render-service.onrender.com/health
```

### Getting Help

1. **Check service logs** in respective dashboards
2. **Review GitHub Actions** logs for CI/CD issues
3. **Test locally** with production environment variables
4. **Verify API keys** and service configurations
5. **Check GitHub App** webhook deliveries

### Performance Optimization

#### Vercel Optimizations
- Enable Edge Runtime for API routes where possible
- Use Next.js Image Optimization
- Configure proper caching headers
- Monitor Core Web Vitals

#### Render Optimizations
- Use appropriate service plan for expected load
- Enable auto-scaling if available
- Monitor memory and CPU usage
- Configure health checks properly

## Security Considerations

1. **Environment Variables**: Never commit actual secrets to repository
2. **API Keys**: Rotate keys regularly and use least-privilege access
3. **GitHub App**: Configure minimal required permissions
4. **HTTPS**: Ensure all services use HTTPS in production
5. **Encryption**: Use strong encryption keys and rotate periodically

## Monitoring and Maintenance

### Health Checks
- **Web App**: Monitor Vercel analytics and error tracking
- **Agent App**: Check Render service metrics and logs
- **Integration**: Monitor GitHub webhook delivery success

### Regular Maintenance
- Update dependencies regularly
- Monitor for security vulnerabilities
- Review and rotate API keys
- Check service performance metrics
- Update documentation as needed

## Cost Optimization

### Vercel
- Use appropriate plan based on usage
- Monitor function execution time and invocations
- Optimize build times to reduce build minutes usage

### Render
- Choose right service plan for your needs
- Monitor resource usage
- Consider auto-scaling for variable loads
- Use sleep mode for development services

---

For additional support, refer to the official documentation:
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
