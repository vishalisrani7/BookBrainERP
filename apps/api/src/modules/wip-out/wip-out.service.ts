import { WipOutModel, IWipOutDocument } from '../../models/WipOut';
import { ProductionBatchModel } from '../../models/ProductionBatch';
import { FinishedGoodsModel } from '../../models/FinishedGoods';
import { InventoryBalanceModel } from '../../models/InventoryBalance';
import { ScrapTransactionModel } from '../../models/ScrapTransaction';
import { StockMovementModel } from '../../models/StockMovement';
import { AuditLogModel } from '../../models/AuditLog';

export interface CreateWipOutInput {
  serialNo?: number;
  wipOutDate: string;
  batchNo: number;
  scrapLeftKg: number;
  wastageKg: number;
}

export class WipOutService {
  static async getNextMeta() {
    const lastWipOut = await WipOutModel.findOne().sort({ serialNo: -1 });
    const nextSerialNo = (lastWipOut?.serialNo || 0) + 1;

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayDate = `${day}-${month}-${year}`;

    // Get active batch
    const activeBatch = await ProductionBatchModel.findOne({ status: 'IN_PROGRESS' }).sort({ batchNo: -1 });

    let totalMixtureUsedKg = 0;
    if (activeBatch) {
      const fgEntries = await FinishedGoodsModel.find({ batchNo: activeBatch.batchNo });
      totalMixtureUsedKg = fgEntries.reduce((acc, curr) => acc + curr.totalMixtureUsedKg, 0);
    }

    const totalMixturePrepKg = activeBatch ? activeBatch.totalMixtureKg : 0;
    const remainingMixtureKg = Number((totalMixturePrepKg - totalMixtureUsedKg).toFixed(2));

    return {
      nextSerialNo,
      todayDate,
      activeBatch: activeBatch
        ? {
            batchNo: activeBatch.batchNo,
            batchDate: activeBatch.batchDate,
            totalMixturePrepKg,
            totalMixtureUsedKg: Number(totalMixtureUsedKg.toFixed(2)),
            remainingMixtureKg,
          }
        : null,
    };
  }

  static async createEntry(input: CreateWipOutInput, user?: string): Promise<IWipOutDocument> {
    const meta = await this.getNextMeta();
    const serialNo = input.serialNo ?? meta.nextSerialNo;

    const existing = await WipOutModel.findOne({ serialNo });
    if (existing) {
      throw new Error(`WIP OUT Serial No ${serialNo} already exists`);
    }

    const batch = await ProductionBatchModel.findOne({ batchNo: input.batchNo });
    if (!batch) {
      throw new Error(`Production Batch #${input.batchNo} not found`);
    }

    // Check if this batch is already closed
    const alreadyClosed = await WipOutModel.findOne({ batchNo: input.batchNo });
    if (alreadyClosed) {
      throw new Error(`Production Batch #${input.batchNo} has already been closed by WIP OUT #${alreadyClosed.serialNo}`);
    }

    // Sum all finished goods mixture used for this batch
    const fgEntries = await FinishedGoodsModel.find({ batchNo: input.batchNo });
    const totalMixtureUsedKg = Number(
      fgEntries.reduce((acc, curr) => acc + curr.totalMixtureUsedKg, 0).toFixed(2)
    );

    const totalMixturePrepKg = Number(batch.totalMixtureKg.toFixed(2));

    // Formula from PDF page 10:
    // Remaining mixture = Total mixture preparation - Total mixture used
    const remainingMixtureKg = Number((totalMixturePrepKg - totalMixtureUsedKg).toFixed(2));
    const scrapLeftKg = Number(input.scrapLeftKg) || 0;
    const wastageKg = Number(input.wastageKg) || 0;

    const entry = await WipOutModel.create({
      serialNo,
      wipOutDate: input.wipOutDate,
      batchNo: input.batchNo,
      totalMixturePrepKg,
      totalMixtureUsedKg,
      scrapLeftKg,
      wastageKg,
      remainingMixtureKg,
      carriedForward: true,
    });

    // Mark the production batch as COMPLETED
    await ProductionBatchModel.findOneAndUpdate({ batchNo: input.batchNo }, { status: 'COMPLETED' });

    // Automation rule from PDF page 10:
    // 1. Remaining mixture (WIP_OUT) will go to opening stock (WIP_IN) of next batch
    await InventoryBalanceModel.findOneAndUpdate(
      { itemCode: 'REMAINING_MIXTURE' },
      { $set: { currentStock: remainingMixtureKg } },
      { upsert: true }
    );

    // 2. Scrap (WIP_OUT) will go to and add to total scrap (WIP_IN)
    if (scrapLeftKg > 0) {
      await InventoryBalanceModel.findOneAndUpdate(
        { itemCode: 'TOTAL_SCRAP' },
        { $inc: { currentStock: scrapLeftKg } },
        { upsert: true }
      );

      await ScrapTransactionModel.create({
        transactionDate: input.wipOutDate,
        type: 'GENERATED_FROM_WIP_OUT',
        quantityKg: scrapLeftKg,
        batchNo: input.batchNo,
        notes: `Generated at WIP OUT #${serialNo} closing`,
      });
    }

    await StockMovementModel.create({
      movementType: 'WIP_OUT_CLOSING',
      itemCode: 'MIXTURE',
      quantity: -totalMixtureUsedKg,
      unit: 'kg',
      referenceId: entry._id.toString(),
      referenceType: 'WipOutEntry',
      date: input.wipOutDate,
      user: user || 'system',
      notes: `Batch #${input.batchNo} closed. Remaining: ${remainingMixtureKg}kg, Scrap: ${scrapLeftKg}kg, Wastage: ${wastageKg}kg`,
    });

    await AuditLogModel.create({
      user: user || 'system',
      action: 'CLOSE_WIP_OUT',
      entity: 'WipOutEntry',
      entityId: entry._id.toString(),
      details: { serialNo, batchNo: input.batchNo, remainingMixtureKg, scrapLeftKg, wastageKg },
    });

    return entry;
  }

  static async getEntries(filter: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    const [rows, totalCount] = await Promise.all([
      WipOutModel.find(query).sort({ serialNo: -1 }).skip(skip).limit(limit),
      WipOutModel.countDocuments(query),
    ]);

    // Aggregate summary totals
    const all = await WipOutModel.find(query);
    let totalPrep = 0;
    let totalUsed = 0;
    let totalScrap = 0;
    let totalWastage = 0;
    let totalRemaining = 0;

    for (const w of all) {
      totalPrep += w.totalMixturePrepKg;
      totalUsed += w.totalMixtureUsedKg;
      totalScrap += w.scrapLeftKg;
      totalWastage += w.wastageKg;
      totalRemaining += w.remainingMixtureKg;
    }

    return {
      rows,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      summaryTotals: {
        totalMixturePrepKg: Number(totalPrep.toFixed(2)),
        totalMixtureUsedKg: Number(totalUsed.toFixed(2)),
        scrapLeftKg: Number(totalScrap.toFixed(2)),
        wastageKg: Number(totalWastage.toFixed(2)),
        remainingMixtureKg: Number(totalRemaining.toFixed(2)),
      },
    };
  }
}
