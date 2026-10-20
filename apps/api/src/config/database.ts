import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './environment';
import { logger } from './logger';
import { UserModel } from '../models/User';
import { MaterialModel } from '../models/Material';
import { ProductModel } from '../models/Product';
import { InventoryBalanceModel } from '../models/InventoryBalance';
import { RAW_MATERIALS, DEFAULT_PRODUCTS } from '@bookbrain/shared';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let mongodInstance: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  const isTestEnv = process.env.NODE_ENV === 'test' || config.nodeEnv === 'test';

  if (isTestEnv) {
    logger.info('Starting isolated embedded MongoMemoryServer for test execution...');
    try {
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri() + 'bookbrain_erp_test';
      await mongoose.connect(memoryUri);
      logger.info(`Successfully connected to isolated test database: ${memoryUri}`);
      await seedInitialData();
      return;
    } catch (memErr) {
      logger.error('Failed to start test MongoMemoryServer.', memErr);
      throw memErr;
    }
  }

  try {
    logger.info(`Attempting connection to MongoDB at: ${config.mongodbUri}`);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('Successfully connected to primary MongoDB server.');
  } catch (primaryErr) {
    logger.warn(`Could not connect to external MongoDB daemon (${config.mongodbUri}). Starting embedded MongoDB (persistent disk storage: data/db)...`);
    try {
      const rootDir = path.resolve(__dirname, '../../../../');
      const persistentDbDir = path.resolve(rootDir, 'data', 'db');
      if (!fs.existsSync(persistentDbDir)) {
        fs.mkdirSync(persistentDbDir, { recursive: true });
      }

      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbPath: persistentDbDir,
          storageEngine: 'wiredTiger',
        },
      });
      const memoryUri = mongodInstance.getUri() + 'bookbrain_erp';
      await mongoose.connect(memoryUri);
      logger.info(`Successfully connected to persistent embedded MongoDB at ${persistentDbDir} (${memoryUri})`);
    } catch (memErr) {
      logger.error('Failed to start MongoMemoryServer.', memErr);
      throw memErr;
    }
  }

  // Seed default master data
  await seedInitialData();
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop({ doCleanup: false });
      logger.info('Embedded MongoDB server stopped without wiping data.');
    }
  } catch (err) {
    logger.error('Error disconnecting database:', err);
  }
}

async function seedInitialData() {
  try {
    // 1. Seed & sync admin user (password: 123)
    const passHash123 = await bcrypt.hash('123', 10);
    const adminUser = await UserModel.findOne({ username: 'admin' });
    if (!adminUser) {
      await UserModel.create({
        username: 'admin',
        email: 'admin@bookbrain.com',
        passwordHash: passHash123,
        fullName: 'System Administrator',
        role: 'SUPER_ADMIN',
        isActive: true,
      });
      logger.info('Initialized Super Admin user (admin / 123).');
    } else {
      adminUser.passwordHash = passHash123;
      adminUser.isActive = true;
      adminUser.role = 'SUPER_ADMIN';
      await adminUser.save();
    }

    // Remove legacy 'root' user if present
    await UserModel.deleteOne({ username: 'root' });

    // 2. Seed raw materials if empty
    const materialCount = await MaterialModel.countDocuments();
    if (materialCount === 0) {
      for (const m of RAW_MATERIALS) {
        await MaterialModel.create({
          code: m.code,
          name: m.name,
          unit: m.unit,
          bagWeightKg: m.bagWeightKg,
          currentStockKg: 0,
        });
      }
      logger.info('Initialized raw materials catalog (PP, LL, FILLER).');
    }

    // 3. Seed product catalogue if empty
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
      for (const p of DEFAULT_PRODUCTS) {
        if (p.name !== 'NONE') {
          await ProductModel.create({
            name: p.name,
            weightGrams: p.weightGrams,
            category: p.category,
            isActive: p.isActive,
          });
        }
      }
      logger.info('Initialized finished goods products catalog.');
    }

    // 4. Seed initial inventory balances if empty
    const balanceItems = ['PP', 'LL', 'FILLER', 'TOTAL_SCRAP', 'SCRAP_IN_WIP', 'REMAINING_MIXTURE'] as const;
    for (const item of balanceItems) {
      const exists = await InventoryBalanceModel.findOne({ itemCode: item });
      if (!exists) {
        await InventoryBalanceModel.create({
          itemCode: item,
          currentStock: 0,
          unit: 'kg',
        });
      }
    }
    logger.info('Initialized inventory balance trackers.');
  } catch (err) {
    logger.error('Error during seedInitialData:', err);
  }
}
