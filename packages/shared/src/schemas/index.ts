import { z } from 'zod';

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const PurchaseItemSchema = z.object({
  materialCode: z.enum(['PP', 'LL', 'FILLER']),
  weightKg: z.number().min(0, 'Weight must be non-negative'),
  pricePerKg: z.number().min(0, 'Price must be non-negative'),
});

export const CreatePurchaseSchema = z.object({
  billNo: z.number().int().positive().optional(),
  billDate: z.string().min(1, 'Bill date is required'),
  uniqueId: z.string().min(1, 'Unique ID is required'),
  items: z.array(PurchaseItemSchema).min(1, 'At least one material is required'),
  notes: z.string().optional(),
});

export const CreateWipBatchSchema = z.object({
  batchNo: z.number().int().positive().optional(),
  batchDate: z.string().min(1, 'Date is required'),
  ppUsedKg: z.number().min(0, 'PP used must be non-negative'),
  llUsedKg: z.number().min(0, 'LL used must be non-negative'),
  fillerUsedKg: z.number().min(0, 'Filler used must be non-negative'),
  notes: z.string().optional(),
});

export const AllocateScrapSchema = z.object({
  scrapInWipKg: z.number().positive('Scrap amount must be greater than 0'),
  notes: z.string().optional(),
});

export const CreateFinishedGoodsSchema = z.object({
  serialNo: z.number().int().positive().optional(),
  fgDate: z.string().min(1, 'Date is required'),
  batchNo: z.number().int().positive('Valid batch number required'),
  productName: z.string().min(1, 'Product name is required'),
  itemWeightGrams: z.number().positive('Item weight must be positive'),
  piecesProduced: z.number().int().positive('Pieces produced must be positive'),
});

export const CreateWipOutSchema = z.object({
  serialNo: z.number().int().positive().optional(),
  wipOutDate: z.string().min(1, 'Date is required'),
  batchNo: z.number().int().positive('Valid batch number required'),
  scrapLeftKg: z.number().min(0, 'Scrap must be non-negative'),
  wastageKg: z.number().min(0, 'Wastage must be non-negative'),
});
