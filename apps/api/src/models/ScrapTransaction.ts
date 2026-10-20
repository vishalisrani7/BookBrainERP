import mongoose, { Document, Schema } from 'mongoose';

export interface IScrapTransactionDocument extends Document {
  transactionDate: string;
  type: 'ALLOCATED_TO_WIP' | 'GENERATED_FROM_WIP_OUT';
  quantityKg: number;
  batchNo?: number;
  notes?: string;
  createdAt: Date;
}

const ScrapTransactionSchema = new Schema<IScrapTransactionDocument>(
  {
    transactionDate: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['ALLOCATED_TO_WIP', 'GENERATED_FROM_WIP_OUT'],
      index: true,
    },
    quantityKg: { type: Number, required: true, min: 0 },
    batchNo: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ScrapTransactionModel = mongoose.model<IScrapTransactionDocument>(
  'ScrapTransaction',
  ScrapTransactionSchema
);
