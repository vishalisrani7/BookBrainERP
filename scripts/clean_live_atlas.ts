import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const uri = process.env.MONGODB_URI;

async function cleanLiveDatabase() {
  if (!uri) {
    console.error('No MONGODB_URI found in apps/api/.env');
    process.exit(1);
  }

  console.log('Connecting to Live Database:', uri.replace(/:[^:@]+@/, ':****@'));
  await mongoose.connect(uri);

  const collections = await mongoose.connection.db.collections();
  console.log('Existing collections:', collections.map(c => c.collectionName));

  // 1. Delete transactional dummy/test records
  const batchesDel = await mongoose.connection.db.collection('productionbatches').deleteMany({});
  console.log('Deleted production batches:', batchesDel.deletedCount);

  const fgDel = await mongoose.connection.db.collection('finishedgoods').deleteMany({});
  console.log('Deleted finished goods entries:', fgDel.deletedCount);

  const wipOutDel = await mongoose.connection.db.collection('wipouts').deleteMany({});
  console.log('Deleted WIP OUT entries:', wipOutDel.deletedCount);

  const purchasesDel = await mongoose.connection.db.collection('purchases').deleteMany({});
  console.log('Deleted purchases:', purchasesDel.deletedCount);

  const stockMovementsDel = await mongoose.connection.db.collection('stockmovements').deleteMany({});
  console.log('Deleted stock movements:', stockMovementsDel.deletedCount);

  const auditDel = await mongoose.connection.db.collection('auditlogs').deleteMany({});
  console.log('Deleted audit logs:', auditDel.deletedCount);

  // 2. Reset Inventory Balances to 0
  await mongoose.connection.db.collection('inventorybalances').updateMany({}, { $set: { currentStock: 0 } });
  console.log('Reset inventory balances to 0 kg.');

  // 3. Reset Material Stocks to 0
  await mongoose.connection.db.collection('materials').updateMany({}, { $set: { currentStockKg: 0 } });
  console.log('Reset material stocks to 0 kg.');

  // 4. Ensure root user is completely removed from live database
  const rootDel = await mongoose.connection.db.collection('users').deleteMany({ username: 'root' });
  console.log('Removed root user if existed:', rootDel.deletedCount);

  console.log('\n🎉 LIVE ATLAS DATABASE IS NOW 100% CLEAN AND READY FOR REAL PRODUCTION DATA!');
  await mongoose.disconnect();
}

cleanLiveDatabase().catch((err) => {
  console.error('Clean error:', err);
  process.exit(1);
});
