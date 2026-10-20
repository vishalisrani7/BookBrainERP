# BookBrain Pvt Ltd — API Documentation (v1)

Base URL: `http://localhost:5000/api/v1`

## 1. Authentication
- `POST /api/v1/auth/login`
  - Body: `{ usernameOrEmail, password }`
  - Response: `{ success: true, data: { token, user } }`
- `GET /api/v1/auth/me`
  - Header: `Authorization: Bearer <token>`
- `POST /api/v1/auth/logout`

## 2. Purchases (`RM_FORM`)
- `GET /api/v1/purchases/next-meta`
  - Returns: `{ nextBillNo, nextUniqueId, todayDate }`
- `POST /api/v1/purchases`
  - Body: `{ billNo, billDate, uniqueId, items: [{ materialCode: 'PP'|'LL'|'FILLER', weightKg, pricePerKg }] }`
  - Formulas applied: `Qty = Weight / 25`, `Amount = Weight * Price`, `Total = Sum(Amounts)`
- `GET /api/v1/purchases?page=1&limit=20&search=`

## 3. Production Batches (`WIP_IN`)
- `GET /api/v1/production/current-meta`
  - Returns available PP, LL, Filler stock, opening stock (from prev WIP OUT), and scrap in WIP.
- `POST /api/v1/production`
  - Body: `{ batchNo, batchDate, ppUsedKg, llUsedKg, fillerUsedKg }`
  - Formulas applied: `New Mixture = PP + LL + Filler`, `Total Mixture = New Mixture + Opening Stock + Scrap Added`
- `GET /api/v1/production`
- `GET /api/v1/production/active`

## 4. Scrap Ledger
- `GET /api/v1/scrap/balances`
- `POST /api/v1/scrap/allocate`
  - Body: `{ scrapInWipKg, notes }`
  - Deducts from Total Scrap, adds to Scrap in WIP

## 5. Finished Goods (`FG_FORM`)
- `GET /api/v1/finished-goods/next-meta`
- `POST /api/v1/finished-goods`
  - Body: `{ serialNo, fgDate, batchNo, productName, itemWeightGrams, piecesProduced }`
  - Formula: `Total Mixture Used = (pieces * weight) / 1000`
  - Warning/Error if mixture used exceeds batch total mixture.

## 6. WIP OUT Closing (`WIP_OUT`)
- `GET /api/v1/wip-out/next-meta`
- `POST /api/v1/wip-out`
  - Body: `{ serialNo, wipOutDate, batchNo, scrapLeftKg, wastageKg }`
  - Formula: `Remaining Mixture = Total Mixture Prep - Total Mixture Used`
  - Automation: Remaining mixture carries forward to next batch opening stock; scrap adds to total scrap.

## 7. Dashboards (4 Power BI Replacements)
- `GET /api/v1/dashboard/home-overview?itemName=&year=`
- `GET /api/v1/dashboard/raw-materials?material=PP|LL|FILLER|ALL`
- `GET /api/v1/dashboard/wip-progress`
- `GET /api/v1/dashboard/finished-goods?product=`

## 8. Reports (8 Reports with Excel & CSV Export)
- `GET /api/v1/reports/:reportType`
- `GET /api/v1/reports/:reportType/export-excel`
- `GET /api/v1/reports/:reportType/export-csv`

## 9. Migration & Reconciliation
- `POST /api/v1/migration/seed-historical`
- `GET  /api/v1/migration/reconcile`
