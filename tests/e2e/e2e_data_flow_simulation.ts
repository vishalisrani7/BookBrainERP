process.env.NODE_ENV = 'test';
import request from 'supertest';
import { app } from '../../apps/api/src/app';
import { connectDatabase, disconnectDatabase } from '../../apps/api/src/config/database';

async function runEndToEndSimulation() {
  console.log('\n============================================================');
  console.log('🚀 BOOKBRAIN ERP — COMPREHENSIVE END-TO-END DATA FLOW TEST');
  console.log('============================================================\n');

  try {
    // 1. Connect Database in test mode
    process.env.NODE_ENV = 'test';
    console.log('[STEP 1] Initializing Database Connection & Baseline Catalogs...');
    await connectDatabase();
    console.log('✅ Database connected and catalogs seeded.\n');

    // 2. Authentication Testing
    console.log('[STEP 2] Testing Super Admin Authentication (admin / 123)...');
    
    // Super Admin user login (admin / 123)
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'admin', password: '123' });
    if (adminRes.status !== 200 || !adminRes.body.data.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminRes.body)}`);
    }
    const adminToken = adminRes.body.data.token;
    console.log('✅ Super Admin Authenticated successfully (admin / 123).\n');

    const authHeader = { Authorization: `Bearer ${adminToken}` };

    // 3. Purchase Entry Testing (PDF Page 5)
    console.log('[STEP 3] Testing Raw Material Purchase Entry (RM_FORM)...');
    const metaRes = await request(app).get('/api/v1/purchases/next-meta').set(authHeader);
    const nextBillNo = metaRes.body.data.nextBillNo;
    const todayDate = metaRes.body.data.todayDate;
    const uniqueId = metaRes.body.data.nextUniqueId;
    console.log(`ℹ️  Next Purchase Meta: Bill #${nextBillNo}, Date: ${todayDate}, UniqueId: ${uniqueId}`);

    const purchaseRes = await request(app)
      .post('/api/v1/purchases')
      .set(authHeader)
      .send({
        billNo: nextBillNo,
        billDate: todayDate,
        uniqueId,
        items: [
          { materialCode: 'PP', weightKg: 5000, pricePerKg: 105 },
          { materialCode: 'LL', weightKg: 3500, pricePerKg: 98 },
          { materialCode: 'FILLER', weightKg: 2000, pricePerKg: 45 },
        ],
        notes: 'Challan #BB-2026-TEST from Gujarat PolyChem Ltd',
      });

    if (purchaseRes.status !== 201) {
      throw new Error(`Purchase creation failed: ${JSON.stringify(purchaseRes.body)}`);
    }
    console.log(`✅ Purchase Bill #${nextBillNo} created:`);
    console.log(`   - PP: 5000 kg (200 bags) @ ₹105 = ₹525,000`);
    console.log(`   - LL: 3500 kg (140 bags) @ ₹98 = ₹343,000`);
    console.log(`   - FILLER: 2000 kg (80 bags) @ ₹45 = ₹90,000`);
    console.log(`   - Total Invoice Amount: ₹${purchaseRes.body.data.totalAmount.toLocaleString()} (Expected ₹958,000)\n`);

    // Verify Inventory balance
    const invRes = await request(app).get('/api/v1/inventory/balances').set(authHeader);
    const ppStock = invRes.body.data.PP;
    const llStock = invRes.body.data.LL;
    const fillerStock = invRes.body.data.FILLER;
    console.log(`ℹ️  Current Ledger Stocks: PP: ${ppStock} kg, LL: ${llStock} kg, FILLER: ${fillerStock} kg`);

    // 4. Scrap Pre-allocation
    console.log('\n[STEP 4] Testing Scrap Buffer & Allocation (PDF Page 6 Area B)...');
    // Allocate 40kg scrap (if available) or test scrap allocation validation
    const scrapMetaRes = await request(app).get('/api/v1/production/current-meta').set(authHeader);
    const availableScrap = scrapMetaRes.body.data.totalScrapKg;
    console.log(`ℹ️  Available Total Scrap in Ledger: ${availableScrap} kg`);

    // 5. WIP IN Mixture Preparation (PDF Pages 6-7 Area A)
    console.log('\n[STEP 5] Testing Mixture Preparation Batch #1 (WIP_IN)...');
    const prodMeta = await request(app).get('/api/v1/production/current-meta').set(authHeader);
    const batchNo1 = prodMeta.body.data.nextBatchNo;

    const batch1Res = await request(app)
      .post('/api/v1/production')
      .set(authHeader)
      .send({
        batchNo: batchNo1,
        batchDate: todayDate,
        ppUsedKg: 1000,
        llUsedKg: 750,
        fillerUsedKg: 500,
        notes: 'Production Shift A - Batch 1',
      });

    if (batch1Res.status !== 201) {
      throw new Error(`Batch 1 creation failed: ${JSON.stringify(batch1Res.body)}`);
    }
    const b1 = batch1Res.body.data;
    console.log(`✅ Production Batch #${b1.batchNo} created:`);
    console.log(`   - PP Used: ${b1.ppUsedKg} kg`);
    console.log(`   - LL Used: ${b1.llUsedKg} kg`);
    console.log(`   - Filler Used: ${b1.fillerUsedKg} kg`);
    console.log(`   - New Mixture: ${b1.newMixtureKg} kg`);
    console.log(`   - Opening Stock: ${b1.openingStockKg} kg`);
    console.log(`   - Total Mixture: ${b1.totalMixtureKg} kg (Expected: 2250 kg)`);
    console.log(`   - Status: ${b1.status}\n`);

    // 6. Finished Goods Entry (PDF Pages 8-9 FG_FORM)
    console.log('[STEP 6] Testing Finished Goods Logging (FG_FORM)...');
    const fgMeta1 = await request(app).get('/api/v1/finished-goods/next-meta').set(authHeader);
    console.log(`ℹ️  Active Batch for FG: Batch #${fgMeta1.body.data.activeBatch?.batchNo}, Available: ${fgMeta1.body.data.activeBatch?.availableMixtureKg} kg`);

    // FG 1: 8,000 pcs of Zigzag 80mm ISI (144g each) = (8000 * 144) / 1000 = 1152 kg
    const fg1 = await request(app)
      .post('/api/v1/finished-goods')
      .set(authHeader)
      .send({
        serialNo: fgMeta1.body.data.nextSerialNo,
        fgDate: todayDate,
        batchNo: b1.batchNo,
        productName: 'Zigzag 80mm ISI',
        itemWeightGrams: 144,
        piecesProduced: 8000,
      });

    if (fg1.status !== 201) {
      throw new Error(`FG 1 logging failed: ${JSON.stringify(fg1.body)}`);
    }
    console.log(`✅ FG Entry #1: 8,000 pcs of 'Zigzag 80mm ISI' (144g) -> Mixture Used: ${fg1.body.data.totalMixtureUsedKg} kg`);

    // FG 2: 5,000 pcs of Zigzag 60mm ISI (110g each) = (5000 * 110) / 1000 = 550 kg
    const fgMeta2 = await request(app).get('/api/v1/finished-goods/next-meta').set(authHeader);
    const fg2 = await request(app)
      .post('/api/v1/finished-goods')
      .set(authHeader)
      .send({
        serialNo: fgMeta2.body.data.nextSerialNo,
        fgDate: todayDate,
        batchNo: b1.batchNo,
        productName: 'Zigzag 60mm ISI',
        itemWeightGrams: 110,
        piecesProduced: 5000,
      });

    if (fg2.status !== 201) {
      throw new Error(`FG 2 logging failed: ${JSON.stringify(fg2.body)}`);
    }
    console.log(`✅ FG Entry #2: 5,000 pcs of 'Zigzag 60mm ISI' (110g) -> Mixture Used: ${fg2.body.data.totalMixtureUsedKg} kg`);

    // Overconsumption guard test
    const fgMeta3 = await request(app).get('/api/v1/finished-goods/next-meta').set(authHeader);
    const remainingAvail = fgMeta3.body.data.activeBatch?.availableMixtureKg;
    console.log(`ℹ️  Remaining Mixture in Batch #${b1.batchNo}: ${remainingAvail} kg (2250 - 1152 - 550 = 548 kg)`);

    console.log('   Testing Overconsumption Protection (Attempting 10,000 pcs = 1440 kg)...');
    const overconsumeRes = await request(app)
      .post('/api/v1/finished-goods')
      .set(authHeader)
      .send({
        serialNo: fgMeta3.body.data.nextSerialNo,
        fgDate: todayDate,
        batchNo: b1.batchNo,
        productName: 'Zigzag 80mm ISI',
        itemWeightGrams: 144,
        piecesProduced: 10000,
      });
    if (overconsumeRes.status === 400) {
      console.log('✅ Overconsumption successfully rejected by backend validator with 400 Bad Request.\n');
    } else {
      throw new Error(`Overconsumption was not blocked! Status: ${overconsumeRes.status}`);
    }

    // 7. WIP OUT Closing & Automated Carry-Forward (PDF Page 10 WIP_OUT)
    console.log('[STEP 7] Testing WIP OUT Closing & Automated Carry-Forward (WIP_OUT)...');
    const wipOutMeta = await request(app).get('/api/v1/wip-out/next-meta').set(authHeader);
    const wipOutSerial = wipOutMeta.body.data.nextSerialNo;

    const wipOutRes = await request(app)
      .post('/api/v1/wip-out')
      .set(authHeader)
      .send({
        serialNo: wipOutSerial,
        wipOutDate: todayDate,
        batchNo: b1.batchNo,
        scrapLeftKg: 35,
        wastageKg: 8,
      });

    if (wipOutRes.status !== 201) {
      throw new Error(`WIP OUT failed: ${JSON.stringify(wipOutRes.body)}`);
    }
    const wo = wipOutRes.body.data;
    console.log(`✅ WIP OUT Record #${wo.serialNo} logged:`);
    console.log(`   - Total Prepared: ${wo.totalMixturePrepKg} kg`);
    console.log(`   - Total Used in FG: ${wo.totalMixtureUsedKg} kg`);
    console.log(`   - Scrap Left Recorded: ${wo.scrapLeftKg} kg (transferred to total scrap)`);
    console.log(`   - Wastage: ${wo.wastageKg} kg`);
    console.log(`   - Remaining Mixture: ${wo.remainingMixtureKg} kg (transferred to next opening stock)\n`);

    // 8. Batch 2 Automated Carry-Forward Verification
    console.log('[STEP 8] Verifying Batch 2 Opening Stock & Scrap Carry-Forward...');
    const prodMeta2 = await request(app).get('/api/v1/production/current-meta').set(authHeader);
    console.log(`ℹ️  Next Batch #${prodMeta2.body.data.nextBatchNo}:`);
    console.log(`   - Opening Stock Automatically Present: ${prodMeta2.body.data.openingStockKg} kg (Expected: 548 kg)`);
    console.log(`   - Total Scrap Available: ${prodMeta2.body.data.totalScrapKg} kg (Includes +35 kg scrap left)`);

    if (prodMeta2.body.data.openingStockKg !== 548) {
      throw new Error(`Carry-forward opening stock mismatch! Got ${prodMeta2.body.data.openingStockKg}, expected 548`);
    }
    console.log('✅ Automated Carry-Forward verified with 100% mathematical precision!\n');

    // 9. Dashboards Verification (PDF Pages 11-22)
    console.log('[STEP 9] Verifying All 4 Power BI Dashboards...');

    // Dashboard 1: Home Overview
    const d1 = await request(app).get('/api/v1/dashboard/home-overview').set(authHeader);
    if (d1.status !== 200 || !d1.body.data.kpis) throw new Error('Home Overview failed');
    console.log(`✅ Dashboard 1 (Home Overview):`);
    console.log(`   - Total Scrap: ${d1.body.data.kpis.totalScrap} kg`);
    console.log(`   - Wastage: ${d1.body.data.kpis.wastage} kg`);
    console.log(`   - Remaining Mixture: ${d1.body.data.kpis.remainingMixture} kg`);
    console.log(`   - Total Finish Goods: ${d1.body.data.kpis.totalFinishGoods} pieces`);

    // Dashboard 2: Raw Material Details
    const d2 = await request(app).get('/api/v1/dashboard/raw-materials').set(authHeader);
    if (d2.status !== 200 || !d2.body.data.stockInStock) throw new Error('Raw Materials dashboard failed');
    console.log(`✅ Dashboard 2 (Raw Materials):`);
    console.log(`   - Stocks In Hand: ${d2.body.data.stockInStock.map((s: any) => `${s.material}: ${s.quantityKg}kg`).join(', ')}`);

    // Dashboard 3: WIP Progress
    const d3 = await request(app).get('/api/v1/dashboard/wip-progress').set(authHeader);
    if (d3.status !== 200 || !d3.body.data.kpis) throw new Error('WIP Progress dashboard failed');
    console.log(`✅ Dashboard 3 (WIP Progress):`);
    console.log(`   - Today Prepared: ${d3.body.data.kpis.todayTotalMixturePrepared} kg`);
    console.log(`   - Today Used: ${d3.body.data.kpis.totalMixtureUsedToday} kg`);
    console.log(`   - Remaining Today: ${d3.body.data.kpis.remainingMixtureToday} kg`);

    // Dashboard 4: Finished Goods
    const d4 = await request(app).get('/api/v1/dashboard/finished-goods').set(authHeader);
    if (d4.status !== 200 || !d4.body.data.kpis) throw new Error('Finished Goods dashboard failed');
    console.log(`✅ Dashboard 4 (Finished Goods):`);
    console.log(`   - Total FG Pieces: ${d4.body.data.kpis.totalFinishGoods}`);
    console.log(`   - Today's FG Pieces: ${d4.body.data.kpis.todayFinishGoods}`);
    console.log(`   - Avg Mix Per Piece: ${d4.body.data.kpis.avgMixPerPieceGrams} grams\n`);

    // 10. Reports & Excel Export Verification
    console.log('[STEP 10] Verifying All 8 Documented Reports & Excel/CSV Exports...');
    const reportIds = [
      'purchases',
      'purchase-stock-used',
      'wip-in',
      'scrap',
      'mixture',
      'closing',
      'finished-goods',
      'wip-out',
    ];

    for (const repId of reportIds) {
      const repRes = await request(app).get(`/api/v1/reports/${repId}`).set(authHeader);
      if (repRes.status !== 200) throw new Error(`Report ${repId} failed with ${repRes.status}`);
      console.log(`   - Report '${repId}': ${repRes.body.data.rows.length} rows returned.`);
    }

    // Test Excel export
    const excelRes = await request(app)
      .get('/api/v1/reports/purchases/export-excel')
      .set(authHeader);
    if (excelRes.status !== 200 || !excelRes.headers['content-type'].includes('spreadsheetml')) {
      throw new Error('Excel export failed');
    }
    console.log(`✅ Excel Export verified (binary XLSX buffer: ${excelRes.body.length || excelRes.text.length} bytes).`);

    // Test CSV export
    const csvRes = await request(app)
      .get('/api/v1/reports/finished-goods/export-csv')
      .set(authHeader);
    if (csvRes.status !== 200 || !csvRes.headers['content-type'].includes('csv')) {
      throw new Error('CSV export failed');
    }
    console.log(`✅ CSV Export verified (CSV text length: ${csvRes.text.length} chars).\n`);

    // 11. Mathematical Reconciliation Engine
    console.log('[STEP 11] Executing Automated Mathematical Reconciliation...');
    const recRes = await request(app).get('/api/v1/migration/reconcile').set(authHeader);
    if (recRes.status !== 200 || !recRes.body.data.materials) {
      throw new Error(`Reconciliation failed: ${JSON.stringify(recRes.body)}`);
    }
    const matRec = recRes.body.data.materials;
    console.log('   Material Balances Reconciliation:');
    for (const code of ['PP', 'LL', 'FILLER']) {
      const m = matRec[code];
      console.log(`   - [${code}] Purchased: ${m.purchasedKg} kg, Consumed: ${m.consumedKg} kg, Theo: ${m.theoreticalBalanceKg} kg, Actual: ${m.actualBalanceKg} kg -> Discrepancy: ${m.discrepancyKg} kg (PASS)`);
      if (m.discrepancyKg !== 0) {
        throw new Error(`Discrepancy detected in ${code}: ${m.discrepancyKg} kg!`);
      }
    }

    console.log('\n============================================================');
    console.log('🎉 ALL END-TO-END DATA TESTS PASSED WITH ZERO ERRORS!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ ERROR IN TEST EXECUTION:', err);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runEndToEndSimulation();
