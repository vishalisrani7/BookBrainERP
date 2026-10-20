# BookBrain Pvt Ltd — Server Deployment Guide

## Target Environment
- Platform: Physical Office Server or Cloud VM
- OS: Windows 10/11 / Windows Server or Linux (Ubuntu 22.04+)
- Target Disk: ~100 GB available storage

## Option A: Direct PM2 Running (Zero-Config or Native)
1. Install Node.js v20+ and MongoDB (or utilize the built-in embedded MongoMemoryServer for instant execution).
2. Clone repository to server:
   ```bash
   cd v:\BookBrainERP
   npm install
   npm run build
   ```
3. Start PM2 cluster:
   ```bash
   npm install -g pm2
   pm2 start infrastructure/deployment/ecosystem.config.js
   pm2 save
   ```
4. Serve static React build via IIS or Nginx targeting `apps/web/dist`.

## Option B: Docker Compose Deployment
```bash
cd infrastructure/deployment
docker-compose up -d --build
```
This launches:
- `bookbrain-mongodb` on private port 27017
- `bookbrain-api` on private port 5000
- `bookbrain-web` (Nginx + React) on port 80

## Automated Daily Backups
Configure Windows Task Scheduler to run daily:
`powershell.exe -ExecutionPolicy Bypass -File V:\BookBrainERP\infrastructure\backup\backup.ps1`
