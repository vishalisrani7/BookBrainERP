import mongoose, { Document, Schema } from 'mongoose';
import { MaterialCode } from '@bookbrain/shared';

export interface IPurchaseLineItem {
  materialCode: MaterialCode;
  weightKg: number;
  qtyBags: number;
  pricePerKg: number;
  amount: number;
}

export interface IPurchaseDocument extends Document {
  billNo: number;
  billDate: string;
  uniqueId: string;
  items: IPurchaseLineItem[];
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseLineItemSchema = new Schema<IPurchaseLineItem>(
  {
    materialCode: { type: String, required: true, enum: ['PP', 'LL', 'FILLER'] },
    weightKg: { type: Number, required: true, min: 0 },
    qtyBags: { type: Number, required: true, min: 0 },
    pricePerKg: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    billNo: { type: Number, required: true, unique: true, index: true },
    billDate: { type: String, required: true, index: true },
    uniqueId: { type: String, required: true, unique: true, index: true },
    items: [PurchaseLineItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PurchaseModel = mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema);
