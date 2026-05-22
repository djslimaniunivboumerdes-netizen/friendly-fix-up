# GNL1Z Asset Management

Industrial LNG asset management platform for Sonatrach GL1/Z.

## Features

- React + TypeScript + Vite
- Cloudflare Workers deployment
- Supabase backend
- Electron desktop support
- PWA support
- QR equipment scanning
- Industrial-ready architecture
- GitHub Actions CI/CD

## Deployment

### 1. Install

```bash
npm install
```

### 2. Configure Environment

Copy:

```bash
cp .env.example .env
```

Fill your Supabase values.

### 3. Add GitHub Secrets

- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_SUPABASE_PROJECT_ID

### 4. Deploy

```bash
npm run deploy
```

## Build Desktop App

```bash
npm run electron:build:win
npm run electron:build:linux
```