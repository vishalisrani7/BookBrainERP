import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryBalanceDocument extends Document {
  itemCode: 'PP' | 'LL' | 'FILLER' | 'TOTAL_SCRAP' | 'SCRAP_IN_WIP' | 'REMAINING_MIXTURE';
  currentStock: number;
  unit: string;
  updatedAt: Date;
}

const InventoryBalanceSchema = new Schema<IInventoryBalanceDocument>(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      enum: ['PP', 'LL', 'FILLER', 'TOTAL_SCRAP', 'SCRAP_IN_WIP', 'REMAINING_MIXTURE'],
      index: true,
    },
    currentStock: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'kg' },
  },
  { timestamps: true }
);

export const InventoryBalanceModel = mongoose.model<IInventoryBalanceDocument>(
  'InventoryBalance',
  InventoryBalanceSchema
);
