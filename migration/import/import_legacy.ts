import mongoose from 'express';
import { ProductionBatchModel } from '../../apps/api/src/models/ProductionBatch';
import { TransformedBatch } from '../transform/transform_legacy';

export async function importBatchesToDatabase(batches: TransformedBatch[]) {
  let imported = 0;
  for (const b of batches) {
    await ProductionBatchModel.findOneAndUpdate(
      { batchNo: b.batchNo },
      { $set: b },
      { upsert: true }
    );
    imported++;
  }
  return imported;
}
