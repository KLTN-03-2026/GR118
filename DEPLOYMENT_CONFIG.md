# Deployment Configuration Guide

## For Vercel Deployment

### Step 1: Backend Environment (Render)
Set this environment variable in Render backend settings:
```
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

### Step 2: Frontend Environment (Vercel)
Set these environment variables in Vercel project settings:
```
VITE_API_BASE_URL=https://smart-city-issue-reporting-8c16.onrender.com/api/v1
VITE_AI_BASE_URL=https://ai-0nhv.onrender.com
```

### Step 3: Verify URLs
- **Frontend on Vercel**: `https://issue-reporting-system-olive.vercel.app/`
- **Backend on Render**: `https://smart-city-issue-reporting-8c16.onrender.com`
- **AI on Render**: `https://ai-0nhv.onrender.com`

## For Local Development
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8081`

No additional configuration needed - the `.env` files are already set up.

## How it works:
1. `.env.production` - Used when you build for production (PROD=true)
2. `.env.local` - Used for local development
3. Backend CORS now supports multiple frontend URLs
