import mongoose, { Document, Schema } from 'mongoose';

export interface IWipOutDocument extends Document {
  serialNo: number; // S_no
  wipOutDate: string;
  batchNo: number;
  totalMixturePrepKg: number;
  totalMixtureUsedKg: number;
  scrapLeftKg: number;
  wastageKg: number;
  remainingMixtureKg: number;
  carriedForward: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WipOutSchema = new Schema<IWipOutDocument>(
  {
    serialNo: { type: Number, required: true, unique: true, index: true },
    wipOutDate: { type: String, required: true, index: true },
    batchNo: { type: Number, required: true, index: true },
    totalMixturePrepKg: { type: Number, required: true, min: 0 },
    totalMixtureUsedKg: { type: Number, required: true, min: 0 },
    scrapLeftKg: { type: Number, required: true, min: 0, default: 0 },
    wastageKg: { type: Number, required: true, min: 0, default: 0 },
    remainingMixtureKg: { type: Number, required: true },
    carriedForward: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const WipOutModel = mongoose.model<IWipOutDocument>('WipOut', WipOutSchema);
