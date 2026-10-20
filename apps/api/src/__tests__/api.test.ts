import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { config } from '../config/environment';

let authToken: string;

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('BookBrain ERP API Test Suite', () => {
  it('Health Check endpoint should return healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  describe('Authentication Module', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ usernameOrEmail: 'wronguser', password: 'badpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should log in with initial default admin credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        usernameOrEmail: config.adminInit.username,
        password: config.adminInit.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });

    it('should retrieve current user profile with auth token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(config.adminInit.username);
    });
  });

  describe('Purchases Module', () => {
    it('should return next purchase metadata', async () => {
      const res = await request(app)
        .get('/api/v1/purchases/next-meta')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.nextBillNo).toBeGreaterThanOrEqual(1);
    });

    it('should create purchase with verified formulas: Qty=Weight/25, Amount=Weight*Price', async () => {
      const res = await request(app)
        .post('/api/v1/purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          billDate: '15-07-2025',
          uniqueId: '10069901',
          items: [
            { materialCode: 'PP', weightKg: 1000, pricePerKg: 100 },
            { materialCode: 'LL', weightKg: 500, pricePerKg: 80 },
            { materialCode: 'FILLER', weightKg: 250, pricePerKg: 50 },
          ],
        });

      expect(res.status).toBe(201);
      const purchase = res.body.data;
      expect(purchase.items[0].qtyBags).toBe(40); // 1000 / 25
      expect(purchase.items[0].amount).toBe(100000); // 1000 * 100
      expect(purchase.items[1].qtyBags).toBe(20); // 500 / 25
      expect(purchase.items[1].amount).toBe(40000); // 500 * 80
      expect(purchase.items[2].qtyBags).toBe(10); // 250 / 25
      expect(purchase.items[2].amount).toBe(12500); // 250 * 50
      expect(purchase.totalAmount).toBe(152500);
    });

    it('should reflect purchased raw materials in inventory balances', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/balances')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.PP).toBeGreaterThanOrEqual(1000);
      expect(res.body.data.LL).toBeGreaterThanOrEqual(500);
      expect(res.body.data.FILLER).toBeGreaterThanOrEqual(250);
    });
  });

  describe('WIP IN & Production Batch Module', () => {
    it('should prepare mixture with formula: New Mixture = PP + LL + FILLER', async () => {
      const res = await request(app)
        .post('/api/v1/production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          batchDate: '16-07-2025',
          ppUsedKg: 500,
          llUsedKg: 200,
          fillerUsedKg: 100,
        });

      expect(res.status).toBe(201);
      const batch = res.body.data;
      expect(batch.newMixtureKg).toBe(800);
      expect(batch.totalMixtureKg).toBe(800);
      expect(batch.status).toBe('IN_PROGRESS');
    });
  });

  describe('Finished Goods Production Module', () => {
    it('should calculate mixture used with formula: Total Mixture Used = (Pieces * Weight) / 1000', async () => {
      const activeBatchRes = await request(app)
        .get('/api/v1/production/active')
        .set('Authorization', `Bearer ${authToken}`);
      const batchNo = activeBatchRes.body.data.batchNo;

      const res = await request(app)
        .post('/api/v1/finished-goods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fgDate: '16-07-2025',
          batchNo,
          productName: 'DUMBELL 80 MM ISI',
          itemWeightGrams: 190,
          piecesProduced: 1000,
        });

      expect(res.status).toBe(201);
      const entry = res.body.data;
      expect(entry.totalMixtureUsedKg).toBe(190); // (1000 * 190) / 1000
    });

    it('should block production if mixture required exceeds batch total mixture', async () => {
      const activeBatchRes = await request(app)
        .get('/api/v1/production/active')
        .set('Authorization', `Bearer ${authToken}`);
      const batchNo = activeBatchRes.body.data.batchNo;

      const res = await request(app)
        .post('/api/v1/finished-goods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fgDate: '16-07-2025',
          batchNo,
          productName: 'DUMBELL 80 MM ISI',
          itemWeightGrams: 190,
          piecesProduced: 10000, // 1900 kg > 800 kg total mixture!
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Warning: Total mixture required');
    });
  });

  describe('WIP OUT Closing Module', () => {
    it('should close WIP batch, calculate remaining mixture and record scrap/wastage', async () => {
      const activeBatchRes = await request(app)
        .get('/api/v1/production/active')
        .set('Authorization', `Bearer ${authToken}`);
      const batchNo = activeBatchRes.body.data.batchNo;

      const res = await request(app)
        .post('/api/v1/wip-out')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          wipOutDate: '16-07-2025',
          batchNo,
          scrapLeftKg: 25,
          wastageKg: 10,
        });

      expect(res.status).toBe(201);
      const wipOut = res.body.data;
      expect(wipOut.totalMixturePrepKg).toBe(800);
      expect(wipOut.totalMixtureUsedKg).toBe(190);
      expect(wipOut.remainingMixtureKg).toBe(610); // 800 - 190 = 610
      expect(wipOut.scrapLeftKg).toBe(25);
    });

    it('should carry forward remaining mixture into next batch opening stock', async () => {
      const metaRes = await request(app)
        .get('/api/v1/production/current-meta')
        .set('Authorization', `Bearer ${authToken}`);
      expect(metaRes.body.data.openingStockKg).toBe(610);
      expect(metaRes.body.data.totalScrapKg).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Dashboards & Reports Modules', () => {
    it('should return Home Overview dashboard data', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/home-overview')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.mixtureVsUsedChart).toBeDefined();
      expect(res.body.data.quantityByStepChart).toBeDefined();
    });

    it('should return Raw Material details dashboard data', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/raw-materials')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.stockInStock).toBeDefined();
    });

    it('should return Finished Goods dashboard data', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/finished-goods')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.typeVsQuantity).toBeDefined();
    });

    it('should return Purchases report with summary totals', async () => {
      const res = await request(app)
        .get('/api/v1/reports/purchases')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.rows).toBeInstanceOf(Array);
      expect(res.body.data.summaryTotals).toBeDefined();
    });

    it('should export report to Excel (XLSX)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/purchases/export-excel')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    });
  });

  describe('Historical Migration & Reconciliation', () => {
    it('should seed 11 historical batches from user documentation', async () => {
      const res = await request(app)
        .post('/api/v1/migration/seed-historical')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.batchesSeeded).toBe(11);
    });

    it('should reconcile balances matching documented figures', async () => {
      const res = await request(app)
        .get('/api/v1/migration/reconcile')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('VERIFIED_RECONCILED');
      expect(res.body.data.materials.PP.consumedKg).toBe(9590);
      expect(res.body.data.materials.LL.consumedKg).toBe(7840);
      expect(res.body.data.materials.FILLER.consumedKg).toBe(5260);
      expect(res.body.data.scrapAndWastage.inventoryTotalScrapKg).toBe(187);
    });
  });
});
