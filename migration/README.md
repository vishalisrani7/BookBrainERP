# Historical Data Migration & Reconciliation Guide

This directory contains the pipeline to extract, transform, import, and reconcile historical production and inventory records from BookBrain Pvt Ltd's legacy system (Excel VBA / MySQL) into the modern MongoDB MERN system.

## Legacy Tables Mapped
- `raw_database_mix_tb` -> `ProductionBatch` (Mixture Preparation)
- `raw_database_rm_stock` -> `InventoryBalance` & `Material`
- `raw_database_wip_in_tb` -> `ProductionBatch` & `ScrapTransaction`
- `raw_database_rm_data` -> `Purchase` & `StockMovement`

## One-Click In-App Historical Seeder
You can trigger the verified historical data seeder directly from the UI by navigating to:
**Home -> Migration & Reconciliation -> Seed Historical Batches from PDF**

Or via the REST API:
`POST /api/v1/migration/seed-historical`

And run real-time reconciliation parity checks via:
`GET /api/v1/migration/reconcile`
