import mongoose, { Document, Schema } from 'mongoose';
import { MovementType } from '@bookbrain/shared';

export interface IStockMovementDocument extends Document {
  movementType: MovementType;
  itemCode: string;
  quantity: number;
  unit: string;
  referenceId?: string;
  referenceType?: string;
  date: string;
  user?: string;
  notes?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovementDocument>(
  {
    movementType: {
      type: String,
      required: true,
      enum: [
        'PURCHASE_RECEIPT',
        'MIXTURE_CONSUMPTION',
        'SCRAP_ALLOCATED',
        'SCRAP_GENERATED',
        'MIXTURE_PRODUCED',
        'MIXTURE_USED_IN_FG',
        'WIP_OUT_CLOSING',
        'REMAINING_CARRY_FORWARD',
      ],
      index: true,
    },
    itemCode: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    referenceId: { type: String },
    referenceType: { type: String },
    date: { type: String, required: true, index: true },
    user: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const StockMovementModel = mongoose.model<IStockMovementDocument>(
  'StockMovement',
  StockMovementSchema
);
