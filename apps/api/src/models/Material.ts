import mongoose, { Document, Schema } from 'mongoose';
import { MaterialCode } from '@bookbrain/shared';

export interface IMaterialDocument extends Document {
  code: MaterialCode;
  name: string;
  unit: string;
  bagWeightKg: number;
  currentStockKg: number;
}

const MaterialSchema = new Schema<IMaterialDocument>(
  {
    code: { type: String, required: true, unique: true, enum: ['PP', 'LL', 'FILLER'] },
    name: { type: String, required: true },
    unit: { type: String, default: 'kg' },
    bagWeightKg: { type: Number, default: 25 },
    currentStockKg: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MaterialModel = mongoose.model<IMaterialDocument>('Material', MaterialSchema);
