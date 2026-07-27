# NSS DirectStay Ghana - Monorepo

This repository is organized as a Monorepo containing separate **frontend** and **backend** applications.

## Project Structure

```
NSS/
├── frontend/             # Next.js 16 (App Router) User Interface
│   ├── src/
│   │   ├── app/          # Pages and Layouts
│   │   ├── components/   # UI Components
│   │   └── lib/          # Frontend Utilities
│   ├── public/           # Static Assets
│   ├── next.config.ts    # API Rewrites to Backend Server
│   └── package.json
│
├── backend/              # Node.js + Express + Prisma REST API
│   ├── src/
│   │   ├── lib/          # DB & Auth Services
│   │   ├── routes/       # Express Route Handlers (auth, properties, admin, verify)
│   │   └── server.ts     # Express Entry Point
│   ├── prisma/           # Prisma Database Schema
│   └── package.json
│
└── package.json          # Root Monorepo Workspace Configuration
```

## Quick Start

### 1. Run Development Mode (Frontend & Backend simultaneously)
```bash
npm run dev
```

### 2. Run Frontend Only
```bash
npm run dev:frontend
```

### 3. Run Backend Only
```bash
npm run dev:backend
```
Backend API will run at: `http://localhost:5000`
Frontend App will run at: `http://localhost:3000`
