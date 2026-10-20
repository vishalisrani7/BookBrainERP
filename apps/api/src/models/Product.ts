import mongoose, { Document, Schema } from 'mongoose';

export interface IProductDocument extends Document {
  name: string;
  weightGrams: number;
  category?: string;
  isActive: boolean;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, unique: true, index: true },
    weightGrams: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'GENERAL' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model<IProductDocument>('Product', ProductSchema);
