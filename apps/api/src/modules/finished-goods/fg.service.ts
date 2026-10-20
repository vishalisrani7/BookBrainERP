import { FinishedGoodsModel, IFinishedGoodsDocument } from '../../models/FinishedGoods';
import { ProductionBatchModel } from '../../models/ProductionBatch';
import { ProductModel } from '../../models/Product';
import { StockMovementModel } from '../../models/StockMovement';
import { AuditLogModel } from '../../models/AuditLog';

export interface CreateFinishedGoodsInput {
  serialNo?: number;
  fgDate: string;
  batchNo: number;
  productName: string;
  itemWeightGrams: number;
  piecesProduced: number;
}

export class FinishedGoodsService {
  static async getNextMeta() {
    const lastFG = await FinishedGoodsModel.findOne().sort({ serialNo: -1 });
    const nextSerialNo = (lastFG?.serialNo || 0) + 1;

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayDate = `${day}-${month}-${year}`;

    // Get active batch
    const activeBatch = await ProductionBatchModel.findOne({ status: 'IN_PROGRESS' }).sort({ batchNo: -1 });

    // Calculate how much mixture is already used in this active batch
    let alreadyUsedKg = 0;
    if (activeBatch) {
      const existingEntries = await FinishedGoodsModel.find({ batchNo: activeBatch.batchNo });
      alreadyUsedKg = existingEntries.reduce((acc, curr) => acc + curr.totalMixtureUsedKg, 0);
    }

    const availableMixtureKg = activeBatch ? Math.max(0, activeBatch.totalMixtureKg - alreadyUsedKg) : 0;

    return {
      nextSerialNo,
      todayDate,
      activeBatch: activeBatch
        ? {
            batchNo: activeBatch.batchNo,
            batchDate: activeBatch.batchDate,
            totalMixtureKg: activeBatch.totalMixtureKg,
            alreadyUsedKg: Number(alreadyUsedKg.toFixed(2)),
            availableMixtureKg: Number(availableMixtureKg.toFixed(2)),
          }
        : null,
    };
  }

  static async createEntry(input: CreateFinishedGoodsInput, user?: string): Promise<IFinishedGoodsDocument> {
    const meta = await this.getNextMeta();
    const serialNo = input.serialNo ?? meta.nextSerialNo;

    const existing = await FinishedGoodsModel.findOne({ serialNo });
    if (existing) {
      throw new Error(`Finished Goods Serial No ${serialNo} already exists`);
    }

    const batch = await ProductionBatchModel.findOne({ batchNo: input.batchNo });
    if (!batch) {
      throw new Error(`Production Batch #${input.batchNo} not found`);
    }

    // Formula from PDF page 9:
    // Total mixture used = (Finish good pieces * Item weight) / 1000
    const pieces = Number(input.piecesProduced) || 0;
    const itemWeight = Number(input.itemWeightGrams) || 0;
    const totalMixtureUsedKg = Number(((pieces * itemWeight) / 1000).toFixed(2));

    // Calculate existing mixture used in this batch
    const existingEntries = await FinishedGoodsModel.find({ batchNo: input.batchNo });
    const prevUsed = existingEntries.reduce((acc, curr) => acc + curr.totalMixtureUsedKg, 0);
    const newCumulativeUsed = prevUsed + totalMixtureUsedKg;

    if (newCumulativeUsed > batch.totalMixtureKg) {
      throw new Error(
        `Warning: Total mixture required (${newCumulativeUsed.toFixed(
          2
        )} kg) exceeds available batch mixture (${batch.totalMixtureKg.toFixed(2)} kg)! Available remaining: ${(
          batch.totalMixtureKg - prevUsed
        ).toFixed(2)} kg.`
      );
    }

    const entry = await FinishedGoodsModel.create({
      serialNo,
      fgDate: input.fgDate,
      batchNo: input.batchNo,
      totalMixturePrepKg: batch.totalMixtureKg,
      productName: input.productName,
      itemWeightGrams: itemWeight,
      piecesProduced: pieces,
      totalMixtureUsedKg,
    });

    await StockMovementModel.create({
      movementType: 'MIXTURE_USED_IN_FG',
      itemCode: 'MIXTURE',
      quantity: -totalMixtureUsedKg,
      unit: 'kg',
      referenceId: entry._id.toString(),
      referenceType: 'FinishedGoodsEntry',
      date: input.fgDate,
      user: user || 'system',
      notes: `Produced ${pieces} pcs of ${input.productName}`,
    });

    await AuditLogModel.create({
      user: user || 'system',
      action: 'CREATE_FINISHED_GOODS',
      entity: 'FinishedGoodsEntry',
      entityId: entry._id.toString(),
      details: { serialNo, productName: input.productName, pieces, totalMixtureUsedKg },
    });

    return entry;
  }

  static async getEntries(filter: {
    productName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filter.productName && filter.productName !== 'ALL') {
      query.productName = filter.productName;
    }

    const [rows, totalCount] = await Promise.all([
      FinishedGoodsModel.find(query).sort({ serialNo: -1 }).skip(skip).limit(limit),
      FinishedGoodsModel.countDocuments(query),
    ]);

    // Aggregate summary totals
    const all = await FinishedGoodsModel.find(query);
    let totalPieces = 0;
    let totalMixtureUsed = 0;

    for (const e of all) {
      totalPieces += e.piecesProduced;
      totalMixtureUsed += e.totalMixtureUsedKg;
    }

    return {
      rows,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      summaryTotals: {
        totalPieces,
        totalMixtureUsedKg: Number(totalMixtureUsed.toFixed(2)),
      },
    };
  }

  static async updateEntry(id: string, input: Partial<CreateFinishedGoodsInput>, user?: string) {
    const existing = await FinishedGoodsModel.findById(id);
    if (!existing) {
      throw new Error('Finished Goods entry not found');
    }

    const pieces = input.piecesProduced !== undefined ? Number(input.piecesProduced) : existing.piecesProduced;
    const itemWeight = input.itemWeightGrams !== undefined ? Number(input.itemWeightGrams) : existing.itemWeightGrams;
    const newTotalMixtureUsedKg = Number(((pieces * itemWeight) / 1000).toFixed(2));

    if (input.fgDate) existing.fgDate = input.fgDate;
    if (input.productName) existing.productName = input.productName;
    existing.piecesProduced = pieces;
    existing.itemWeightGrams = itemWeight;
    existing.totalMixtureUsedKg = newTotalMixtureUsedKg;

    await existing.save();

    await AuditLogModel.create({
      action: 'UPDATE',
      entity: 'FinishedGoods',
      entityId: existing._id.toString(),
      module: 'FinishedGoods',
      referenceId: existing._id.toString(),
      user: user || 'system',
      details: { serialNo: existing.serialNo, updatedFields: Object.keys(input) },
    });

    return existing;
  }

  static async deleteEntry(id: string, user?: string) {
    const existing = await FinishedGoodsModel.findById(id);
    if (!existing) {
      throw new Error('Finished Goods entry not found');
    }

    await AuditLogModel.create({
      action: 'DELETE',
      entity: 'FinishedGoods',
      entityId: existing._id.toString(),
      module: 'FinishedGoods',
      referenceId: existing._id.toString(),
      user: user || 'system',
      details: { serialNo: existing.serialNo, piecesProduced: existing.piecesProduced },
    });

    await FinishedGoodsModel.findByIdAndDelete(id);
    return { success: true, message: `Finished Goods Entry #${existing.serialNo} deleted successfully` };
  }
}
