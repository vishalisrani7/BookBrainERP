# BookBrain Pvt Ltd — Manufacturing Inventory & WIP Management System

Production-ready MERN-stack replacement for BookBrain's legacy Excel-based WIP Inventory Management System, engineered according to the complete 22-page user documentation.

---

## Architecture Overview

```
bookbrain-wip-system/
│
├── apps/
│   ├── web/                     # React 18 + Vite + TypeScript + Tailwind CSS Frontend
│   │   ├── src/features/
│   │   │   ├── auth/            # Branded BookBrain Login (PDF Page 2)
│   │   │   ├── home/            # Central 6-Tile Navigation Hub (PDF Pages 3–4)
│   │   │   ├── purchases/       # RM_FORM Purchase Entry & Bags Calc (PDF Pages 5–6)
│   │   │   ├── wip-in/          # WIP_IN Mixture Prep & Scrap Ledger (PDF Pages 6–7)
│   │   │   ├── finished-goods/  # FG_FORM Piece-Weight Consumption (PDF Pages 8–9)
│   │   │   ├── wip-out/         # WIP_OUT Closing & Carry-Forward (PDF Page 10)
│   │   │   ├── dashboards/      # 4 Power BI Dashboards with Focus Mode (PDF Pages 11–22)
│   │   │   ├── reports/         # 8 Production Reports with Excel/CSV Export
│   │   │   └── migration/       # Historical Data Seeder & Parity Reconciler
│   │   └── package.json
│   │
│   └── api/                     # Node.js + Express + TypeScript Backend
│       ├── src/modules/
│       │   ├── auth/            # JWT authentication & password hashing
│       │   ├── purchases/       # Purchase receipt ledger & inventory increment
│       │   ├── production/      # WIP batch lifecycle management
│       │   ├── scrap/           # Traceable scrap generation & allocation
│       │   ├── finished-goods/  # Consumption formulas & overconsumption guards
│       │   ├── wip-out/         # Batch closing & automated carry-forward
│       │   ├── dashboard/       # Aggregation queries for the 4 Power BI screens
│       │   ├── reports/         # Dynamic report generators & ExcelJS exports
│       │   └── migration/       # Historical data seeder (11 batches) & reconciliation
│       └── package.json
│
├── packages/
│   └── shared/                  # Monorepo shared types, constants & Zod schemas
│
├── infrastructure/
│   ├── nginx/                   # Reverse proxy configuration
│   ├── deployment/              # Docker Compose & PM2 ecosystem configs
│   └── backup/                  # Automated PowerShell backup and restore scripts
│
└── docs/                        # Complete technical and user documentation
```

---

## Validated Manufacturing Business Rules

1. **Raw Material Purchases (`RM_FORM`)**:
   $$\text{Qty (Bags)} = \frac{\text{Weight (kg)}}{25}$$
   $$\text{Amount} = \text{Weight (kg)} \times \text{Price}$$
   $$\text{Total Invoice} = \sum \text{Item Amounts}$$

2. **WIP Stock IN Mixture Preparation (`WIP_IN`)**:
   $$\text{New Mixture} = \text{PP} + \text{LL} + \text{FILLER}$$
   $$\text{Total Mixture} = \text{New Mixture} + \text{Opening Stock} + \text{Scrap Added}$$
   - *Opening Stock*: Carried forward from previous batch's remaining mixture (`WIP_OUT`).
   - *Scrap Added*: Deducted from Total Scrap buffer via "Save Scrap" in Area B.

3. **Finished Goods Production (`FG_FORM`)**:
   $$\text{Total Mixture Used (kg)} = \frac{\text{Pieces Produced} \times \text{Item Weight (grams)}}{1000}$$
   - *Validation*: If cumulative mixture used exceeds batch total mixture, a warning is raised and invalid consumption is blocked.

4. **WIP Stock OUT Closing (`WIP_OUT`)**:
   $$\text{Remaining Mixture} = \text{Total Mixture Prepared} - \text{Total Mixture Used}$$
   - *Automated Carry-Forward*: Remaining mixture becomes the opening stock of the next batch; scrap left in stock is added to the scrap ledger.

---

## Getting Started

### 1. Prerequisites
- Node.js v20+
- npm v10+

### 2. Installation
```bash
git clone <repository_url>
cd BookBrainERP
npm install
npm run build --workspace=@bookbrain/shared
```

### 3. Run Development Servers
```bash
# Starts both Backend API (Port 5000) and Frontend Web (Port 5173)
npm run dev
```
- Frontend Web: `http://localhost:5173`
- Backend API Health: `http://localhost:5000/health`

### 4. Default Super Administrator Login
- **Username**: `admin`
- **Password**: `BookBrainAdmin#2026`

---

## Automated Test Suite

Run the full end-to-end integration and unit test suite:
```bash
npm run test --workspace=@bookbrain/api
```
All 19 test suites covering authentication, calculations, concurrency guards, exports, and reconciliation pass cleanly.

---

## Historical Data Migration & Reconciliation

The application includes an integrated historical seeder containing the 11 verified batches from `user_documentation.pdf`:
1. Log in to the web interface.
2. Click **Migration & Audit** in the navigation bar.
3. Click **Seed Historical Batches from PDF**.
4. The system populates:
   - 11 historical batches (PP: 9,590 kg, LL: 7,840 kg, Filler: 5,260 kg, Total Mixture: 22,690 kg, FG: 93,569+ pieces).
   - Generates the live reconciliation report verifying **0 kg discrepancy** across all material balances.
