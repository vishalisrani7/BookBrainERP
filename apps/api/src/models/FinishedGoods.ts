import mongoose, { Document, Schema } from 'mongoose';

export interface IFinishedGoodsDocument extends Document {
  serialNo: number; // S_no
  fgDate: string;
  batchNo: number;
  totalMixturePrepKg: number;
  productName: string;
  itemWeightGrams: number;
  piecesProduced: number;
  totalMixtureUsedKg: number;
  createdAt: Date;
  updatedAt: Date;
}

const FinishedGoodsSchema = new Schema<IFinishedGoodsDocument>(
  {
    serialNo: { type: Number, required: true, unique: true, index: true },
    fgDate: { type: String, required: true, index: true },
    batchNo: { type: Number, required: true, index: true },
    totalMixturePrepKg: { type: Number, required: true, min: 0 },
    productName: { type: String, required: true, index: true },
    itemWeightGrams: { type: Number, required: true, min: 0 },
    piecesProduced: { type: Number, required: true, min: 0 },
    totalMixtureUsedKg: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const FinishedGoodsModel = mongoose.model<IFinishedGoodsDocument>(
  'FinishedGoods',
  FinishedGoodsSchema
);
