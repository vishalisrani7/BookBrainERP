import mongoose, { Document, Schema } from 'mongoose';

export interface IProductionBatchDocument extends Document {
  batchNo: number; // S_no
  batchDate: string;
  ppUsedKg: number;
  llUsedKg: number;
  fillerUsedKg: number;
  newMixtureKg: number;
  openingStockKg: number;
  scrapAddedKg: number;
  totalMixtureKg: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductionBatchSchema = new Schema<IProductionBatchDocument>(
  {
    batchNo: { type: Number, required: true, unique: true, index: true },
    batchDate: { type: String, required: true, index: true },
    ppUsedKg: { type: Number, required: true, min: 0 },
    llUsedKg: { type: Number, required: true, min: 0 },
    fillerUsedKg: { type: Number, required: true, min: 0 },
    newMixtureKg: { type: Number, required: true, min: 0 },
    openingStockKg: { type: Number, required: true, min: 0, default: 0 },
    scrapAddedKg: { type: Number, required: true, min: 0, default: 0 },
    totalMixtureKg: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED'], default: 'IN_PROGRESS', index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ProductionBatchModel = mongoose.model<IProductionBatchDocument>(
  'ProductionBatch',
  ProductionBatchSchema
);
