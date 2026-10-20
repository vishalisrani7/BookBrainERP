# BookBrain Pvt Ltd — User Manual

## 1. System Login
- Navigate to `http://localhost:5173` (or the server IP).
- Login with Administrator account:
  - Username: `admin`
  - Password: `BookBrainAdmin#2026`

## 2. Navigating the Manufacturing Process
The manufacturing cycle follows a 4-step sequence:

```
[Raw Material Purchase] ──> [WIP Stock IN] ──> [Finished Goods Entry] ──> [WIP Stock OUT]
   (RM_FORM)                   (WIP_IN)              (FG_FORM)               (WIP_OUT)
       │                           │                     │                       │
Receives PP, LL, Filler     Mixes materials &      Produces tiles &         Calculates remaining
Updates stock balances      allocates scrap        paver blocks             mixture & carry-forward
```

### Step 1: Raw Material Purchase (`RM_FORM`)
- Auto-generates Bill Number, Bill Date, and Unique ID (e.g. `10062001`).
- Enter received weight in kg for PP, LL, and Filler.
- Automatically computes bag quantities (`Weight / 25`) and line item amounts (`Weight * Price`).
- Click "Submit Purchase Bill" to immediately update stock balances.

### Step 2: WIP Stock IN (`WIP_IN`)
- **Area B**: Enter scrap quantity in "Scrap in WIP" and click "Save Scrap" to allocate scrap into mixture preparation.
- **Area A**: Enter PP, LL, and Filler quantities in kg.
- The system automatically adds:
  - `New Mixture = PP + LL + Filler`
  - `Opening Stock`: carried over from the previous batch's remaining mixture.
  - `Scrap Added`: allocated from the scrap buffer.
  - `Total Mixture`: Sum of new mixture + opening stock + scrap.
- Click "Submit Batch Mixture" to open an active production batch.

### Step 3: Finished Goods Entry (`FG_FORM`)
- Select product from catalogue (Dumbell, Zigzag, Hexagon, Tristar, ISI, and Bikhri variants).
- Enter number of pieces produced.
- Automatically calculates:
  `Total Mixture Used (kg) = (Pieces * Weight in grams) / 1000`
- Displays real-time warning if mixture required exceeds batch total mixture.

### Step 4: WIP Stock OUT (`WIP_OUT`)
- Shows batch preparation and total mixture consumed.
- Enter scrap generated at dispatch and wastage.
- Automatically calculates:
  `Remaining Mixture = Total Mixture Prepared - Total Mixture Used`
- Closing the batch carries the remaining mixture directly into the opening stock of the next batch and adds scrap into the scrap ledger.

## 3. Power BI Dashboards
Switch between 4 real-time interactive analytical dashboards:
1. **Home Overview**: Total Scrap, Wastage, Usable Mixture, Finished Goods, and step-by-step waterfall.
2. **Raw Material Details**: Stock levels, cumulative usage trends, and historical logs with Focus Mode.
3. **WIP Progress**: 7-day line chart trend, material contribution donut, and dual WIP IN/OUT tables.
4. **Finish Goods**: Product-wise production, piece counts, and resource usage pie chart.

## 4. Report Centre
Access all 8 documented production reports with date range filtering, search, XLSX Excel export, and CSV download.
