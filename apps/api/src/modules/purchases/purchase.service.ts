import { PurchaseModel, IPurchaseDocument } from '../../models/Purchase';
import { MaterialModel } from '../../models/Material';
import { InventoryBalanceModel } from '../../models/InventoryBalance';
import { StockMovementModel } from '../../models/StockMovement';
import { AuditLogModel } from '../../models/AuditLog';
import { MaterialCode } from '@bookbrain/shared';

export interface CreatePurchaseInput {
  billNo?: number;
  billDate: string;
  uniqueId?: string;
  items: {
    materialCode: MaterialCode;
    weightKg: number;
    pricePerKg: number;
  }[];
  notes?: string;
}

export class PurchaseService {
  static async getNextMeta() {
    const lastPurchase = await PurchaseModel.findOne().sort({ billNo: -1 });
    const nextBillNo = (lastPurchase?.billNo || 0) + 1;
    // Format Unique ID e.g. 10060001 or 1006 + padStart(nextBillNo, 4, '0')
    const nextUniqueId = `1006${String(nextBillNo).padStart(4, '0')}`;
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayDate = `${day}-${month}-${year}`;

    return {
      nextBillNo,
      nextUniqueId,
      todayDate,
    };
  }

  static async createPurchase(input: CreatePurchaseInput, user?: string): Promise<IPurchaseDocument> {
    const meta = await this.getNextMeta();
    const billNo = input.billNo ?? meta.nextBillNo;
    const uniqueId = input.uniqueId ?? meta.nextUniqueId;

    // Check duplicate billNo or uniqueId
    const existing = await PurchaseModel.findOne({
      $or: [{ billNo }, { uniqueId }],
    });
    if (existing) {
      throw new Error(`Purchase with Bill No ${billNo} or Unique ID ${uniqueId} already exists`);
    }

    // Calculate line items with formulas from PDF:
    // Qty = Weight / 25
    // Amount = Weight * Price
    let totalAmount = 0;
    const calculatedItems = input.items.map((item) => {
      const weight = Number(item.weightKg) || 0;
      const price = Number(item.pricePerKg) || 0;
      const qtyBags = Number((weight / 25).toFixed(2));
      const amount = Number((weight * price).toFixed(2));
      totalAmount += amount;

      return {
        materialCode: item.materialCode,
        weightKg: weight,
        qtyBags,
        pricePerKg: price,
        amount,
      };
    });

    totalAmount = Number(totalAmount.toFixed(2));

    const purchase = await PurchaseModel.create({
      billNo,
      billDate: input.billDate,
      uniqueId,
      items: calculatedItems,
      totalAmount,
      notes: input.notes,
    });

    // Update raw materials stock and balance records
    for (const item of calculatedItems) {
      if (item.weightKg > 0) {
        await MaterialModel.findOneAndUpdate(
          { code: item.materialCode },
          { $inc: { currentStockKg: item.weightKg } },
          { upsert: true }
        );

        await InventoryBalanceModel.findOneAndUpdate(
          { itemCode: item.materialCode },
          { $inc: { currentStock: item.weightKg }, $set: { unit: 'kg' } },
          { upsert: true }
        );

        await StockMovementModel.create({
          movementType: 'PURCHASE_RECEIPT',
          itemCode: item.materialCode,
          quantity: item.weightKg,
          unit: 'kg',
          referenceId: purchase._id.toString(),
          referenceType: 'Purchase',
          date: input.billDate,
          user: user || 'system',
          notes: `Purchase Bill #${billNo} - ${item.qtyBags} bags`,
        });
      }
    }

    await AuditLogModel.create({
      user: user || 'system',
      action: 'CREATE_PURCHASE',
      entity: 'Purchase',
      entityId: purchase._id.toString(),
      details: { billNo, uniqueId, totalAmount, itemsCount: calculatedItems.length },
    });

    return purchase;
  }

  static async getPurchases(filter: {
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.search) {
      query.$or = [
        { uniqueId: { $regex: filter.search, $options: 'i' } },
        { billDate: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const [rows, totalCount] = await Promise.all([
      PurchaseModel.find(query).sort({ billNo: -1 }).skip(skip).limit(limit),
      PurchaseModel.countDocuments(query),
    ]);

    // Aggregate summary totals
    const allPurchases = await PurchaseModel.find(query);
    let totalPP = 0;
    let totalLL = 0;
    let totalFiller = 0;
    let grandTotalAmount = 0;

    for (const p of allPurchases) {
      grandTotalAmount += p.totalAmount;
      for (const it of p.items) {
        if (it.materialCode === 'PP') totalPP += it.weightKg;
        if (it.materialCode === 'LL') totalLL += it.weightKg;
        if (it.materialCode === 'FILLER') totalFiller += it.weightKg;
      }
    }

    return {
      rows,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      summaryTotals: {
        totalPP: Number(totalPP.toFixed(2)),
        totalLL: Number(totalLL.toFixed(2)),
        totalFiller: Number(totalFiller.toFixed(2)),
        grandTotalAmount: Number(grandTotalAmount.toFixed(2)),
      },
    };
  }

  static async getPurchaseById(id: string) {
    return PurchaseModel.findById(id);
  }

  static async updatePurchase(id: string, input: Partial<CreatePurchaseInput>, user?: string) {
    const existing = await PurchaseModel.findById(id);
    if (!existing) {
      throw new Error(`Purchase record not found`);
    }

    // Calculate old weights
    const oldWeights: Record<string, number> = { PP: 0, LL: 0, FILLER: 0 };
    for (const it of existing.items) {
      oldWeights[it.materialCode] = (oldWeights[it.materialCode] || 0) + it.weightKg;
    }

    let calculatedItems = existing.items;
    let totalAmount = existing.totalAmount;

    if (input.items && input.items.length > 0) {
      totalAmount = 0;
      calculatedItems = input.items.map((item) => {
        const weight = Number(item.weightKg) || 0;
        const price = Number(item.pricePerKg) || 0;
        const qtyBags = Number((weight / 25).toFixed(2));
        const amount = Number((weight * price).toFixed(2));
        totalAmount += amount;
        return {
          materialCode: item.materialCode,
          weightKg: weight,
          qtyBags,
          pricePerKg: price,
          amount,
        };
      });
      totalAmount = Number(totalAmount.toFixed(2));

      // Calculate new weights and differences
      const newWeights: Record<string, number> = { PP: 0, LL: 0, FILLER: 0 };
      for (const it of calculatedItems) {
        newWeights[it.materialCode] = (newWeights[it.materialCode] || 0) + it.weightKg;
      }

      for (const code of ['PP', 'LL', 'FILLER'] as const) {
        const diff = (newWeights[code] || 0) - (oldWeights[code] || 0);
        if (diff !== 0) {
          await MaterialModel.findOneAndUpdate({ code }, { $inc: { currentStockKg: diff } });
          await InventoryBalanceModel.findOneAndUpdate({ itemCode: code }, { $inc: { currentStock: diff } });
        }
      }
    }

    if (input.billDate) existing.billDate = input.billDate;
    if (input.uniqueId) existing.uniqueId = input.uniqueId;
    if (input.notes !== undefined) existing.notes = input.notes;
    existing.items = calculatedItems;
    existing.totalAmount = totalAmount;

    await existing.save();

    await AuditLogModel.create({
      action: 'UPDATE',
      entity: 'Purchase',
      entityId: existing._id.toString(),
      module: 'Purchases',
      referenceId: existing._id.toString(),
      user: user || 'system',
      details: { billNo: existing.billNo, updatedFields: Object.keys(input) },
    });

    return existing;
  }

  static async deletePurchase(id: string, user?: string) {
    const existing = await PurchaseModel.findById(id);
    if (!existing) {
      throw new Error(`Purchase record not found`);
    }

    // Revert inventory balances
    for (const item of existing.items) {
      if (item.weightKg > 0) {
        await MaterialModel.findOneAndUpdate(
          { code: item.materialCode },
          { $inc: { currentStockKg: -item.weightKg } }
        );
        await InventoryBalanceModel.findOneAndUpdate(
          { itemCode: item.materialCode },
          { $inc: { currentStock: -item.weightKg } }
        );
      }
    }

    await AuditLogModel.create({
      action: 'DELETE',
      entity: 'Purchase',
      entityId: existing._id.toString(),
      module: 'Purchases',
      referenceId: existing._id.toString(),
      user: user || 'system',
      details: { billNo: existing.billNo, totalAmount: existing.totalAmount },
    });

    await PurchaseModel.findByIdAndDelete(id);
    return { success: true, message: `Purchase Bill #${existing.billNo} deleted successfully` };
  }
}
