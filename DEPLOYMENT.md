# Azure Deployment Guide for Angel AI Frontend

## Prerequisites
- Azure CLI installed
- Node.js 18+ installed locally
- Git repository with your code

## Deployment Steps

### Method 1: Azure CLI Deployment

1. **Login to Azure**
   ```bash
   az login
   ```

2. **Create Resource Group (if not exists)**
   ```bash
   az group create --name angel-ai-rg --location "East US"
   ```

3. **Create App Service Plan**
   ```bash
   az appservice plan create --name angel-ai-plan --resource-group angel-ai-rg --sku B1 --is-linux
   ```

4. **Create Web App**
   ```bash
   az webapp create --resource-group angel-ai-rg --plan angel-ai-plan --name angel-ai-frontend --runtime "NODE:18-lts"
   ```

5. **Configure App Settings**
   ```bash
   az webapp config appsettings set --resource-group angel-ai-rg --name angel-ai-frontend --settings @.azure/app-settings.env
   ```

6. **Deploy from Local Directory**
   ```bash
   az webapp deployment source config-zip --resource-group angel-ai-rg --name angel-ai-frontend --src dist.zip
   ```

### Method 2: GitHub Actions (Recommended)

1. **Create GitHub Secrets**
   - `AZURE_WEBAPP_NAME`: Your web app name
   - `AZURE_WEBAPP_PUBLISH_PROFILE`: Download from Azure Portal
   - `AZURE_RG`: Your resource group name

2. **Push to GitHub** - The deployment will happen automatically

### Method 3: Azure Portal

1. Go to Azure Portal
2. Create a new Web App
3. Choose "Node.js 18 LTS" as runtime stack
4. Upload your built files to the deployment center

## Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test locally
npm run preview
```

## Important Notes

- The `web.config` file handles SPA routing for IIS
- Environment variables are configured in `.azure/app-settings.env`
- The app runs on port 3000 with host 0.0.0.0 for Azure compatibility
- Build optimization includes code splitting and minification

## Troubleshooting

- Check Azure App Service logs if deployment fails
- Ensure Node.js version matches Azure runtime
- Verify all environment variables are set correctly
- Check that the build output is in the `dist` folder
