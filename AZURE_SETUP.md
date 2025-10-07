# Azure Web App Setup - founder-ai

## Your Azure Web App Details:
- **App Name**: `founder-ai`
- **Resource Group**: `Founderai_group`
- **Subscription**: `6e91aee2-2db0-4af9-9971-ece511be8bc6`
- **Runtime**: Node 22 LTS
- **URL**: `founder-ai-hkh6fgd8abangza5.canadacentral-01.azurewebsites.net`

## Steps to Connect GitHub:

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Azure deployment"
git push origin main
```

### 2. Get Publish Profile from Azure
1. Go to Azure Portal → Your Web App `founder-ai`
2. Click **"Get publish profile"** button
3. Download the `.publishsettings` file
4. Open the file and copy the entire contents

### 3. Add GitHub Secret
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Paste the entire contents of the `.publishsettings` file

### 4. Trigger Deployment
- Push any change to `main` branch, or
- Go to **Actions** tab → **Deploy to Azure WebApp** → **Run workflow**

## What's Updated:
✅ GitHub Action workflow configured for `founder-ai`
✅ Node version updated to 22.x (matches Azure)
✅ Startup command configured
✅ Build optimized for production

Your app will be available at: https://founder-ai-hkh6fgd8abangza5.canadacentral-01.azurewebsites.net
