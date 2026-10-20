import { ProductionBatchModel, IProductionBatchDocument } from '../../models/ProductionBatch';
import { MaterialModel } from '../../models/Material';
import { InventoryBalanceModel } from '../../models/InventoryBalance';
import { StockMovementModel } from '../../models/StockMovement';
import { AuditLogModel } from '../../models/AuditLog';

export interface CreateBatchInput {
  batchNo?: number;
  batchDate: string;
  ppUsedKg: number;
  llUsedKg: number;
  fillerUsedKg: number;
  notes?: string;
}

export class BatchService {
  static async getCurrentMeta() {
    const lastBatch = await ProductionBatchModel.findOne().sort({ batchNo: -1 });
    const nextBatchNo = (lastBatch?.batchNo || 0) + 1;

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayDate = `${day}-${month}-${year}`;

    // Get material stocks
    const pp = await InventoryBalanceModel.findOne({ itemCode: 'PP' });
    const ll = await InventoryBalanceModel.findOne({ itemCode: 'LL' });
    const filler = await InventoryBalanceModel.findOne({ itemCode: 'FILLER' });

    // Get opening stock (remaining mixture from previous WIP_OUT)
    const remainingMixBalance = await InventoryBalanceModel.findOne({ itemCode: 'REMAINING_MIXTURE' });
    const openingStockKg = remainingMixBalance ? Math.max(0, remainingMixBalance.currentStock) : 0;

    // Get available scrap allocated in WIP
    const scrapInWipBalance = await InventoryBalanceModel.findOne({ itemCode: 'SCRAP_IN_WIP' });
    const scrapInWipKg = scrapInWipBalance ? Math.max(0, scrapInWipBalance.currentStock) : 0;

    // Get total scrap balance
    const totalScrapBalance = await InventoryBalanceModel.findOne({ itemCode: 'TOTAL_SCRAP' });
    const totalScrapKg = totalScrapBalance ? Math.max(0, totalScrapBalance.currentStock) : 0;

    return {
      nextBatchNo,
      todayDate,
      stocks: {
        ppKg: pp?.currentStock || 0,
        llKg: ll?.currentStock || 0,
        fillerKg: filler?.currentStock || 0,
      },
      openingStockKg,
      scrapInWipKg,
      totalScrapKg,
    };
  }

  static async createBatch(input: CreateBatchInput, user?: string): Promise<IProductionBatchDocument> {
    const meta = await this.getCurrentMeta();
    const batchNo = input.batchNo ?? meta.nextBatchNo;

    const existing = await ProductionBatchModel.findOne({ batchNo });
    if (existing) {
      throw new Error(`Batch No ${batchNo} already exists`);
    }

    const pp = Number(input.ppUsedKg) || 0;
    const ll = Number(input.llUsedKg) || 0;
    const filler = Number(input.fillerUsedKg) || 0;

    // Validate raw material stock
    if (pp > meta.stocks.ppKg) {
      throw new Error(`Insufficient PP stock. Available: ${meta.stocks.ppKg} kg, Requested: ${pp} kg`);
    }
    if (ll > meta.stocks.llKg) {
      throw new Error(`Insufficient LL stock. Available: ${meta.stocks.llKg} kg, Requested: ${ll} kg`);
    }
    if (filler > meta.stocks.fillerKg) {
      throw new Error(`Insufficient Filler stock. Available: ${meta.stocks.fillerKg} kg, Requested: ${filler} kg`);
    }

    // Formulas from PDF page 7:
    // Mixture = Sum of PP, LL and FILLER
    // Total mixture = Sum of mixture, opening stock and scrap
    const newMixtureKg = Number((pp + ll + filler).toFixed(2));
    const openingStockKg = Number(meta.openingStockKg.toFixed(2));
    const scrapAddedKg = Number(meta.scrapInWipKg.toFixed(2));
    const totalMixtureKg = Number((newMixtureKg + openingStockKg + scrapAddedKg).toFixed(2));

    const batch = await ProductionBatchModel.create({
      batchNo,
      batchDate: input.batchDate,
      ppUsedKg: pp,
      llUsedKg: ll,
      fillerUsedKg: filler,
      newMixtureKg,
      openingStockKg,
      scrapAddedKg,
      totalMixtureKg,
      status: 'IN_PROGRESS',
      notes: input.notes,
    });

    // Deduct raw materials from inventory balances
    if (pp > 0) {
      await MaterialModel.findOneAndUpdate({ code: 'PP' }, { $inc: { currentStockKg: -pp } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'PP' }, { $inc: { currentStock: -pp } });
      await StockMovementModel.create({
        movementType: 'MIXTURE_CONSUMPTION',
        itemCode: 'PP',
        quantity: -pp,
        unit: 'kg',
        referenceId: batch._id.toString(),
        referenceType: 'ProductionBatch',
        date: input.batchDate,
        user: user || 'system',
        notes: `Mixture Prep Batch #${batchNo}`,
      });
    }

    if (ll > 0) {
      await MaterialModel.findOneAndUpdate({ code: 'LL' }, { $inc: { currentStockKg: -ll } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'LL' }, { $inc: { currentStock: -ll } });
      await StockMovementModel.create({
        movementType: 'MIXTURE_CONSUMPTION',
        itemCode: 'LL',
        quantity: -ll,
        unit: 'kg',
        referenceId: batch._id.toString(),
        referenceType: 'ProductionBatch',
        date: input.batchDate,
        user: user || 'system',
        notes: `Mixture Prep Batch #${batchNo}`,
      });
    }

    if (filler > 0) {
      await MaterialModel.findOneAndUpdate({ code: 'FILLER' }, { $inc: { currentStockKg: -filler } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'FILLER' }, { $inc: { currentStock: -filler } });
      await StockMovementModel.create({
        movementType: 'MIXTURE_CONSUMPTION',
        itemCode: 'FILLER',
        quantity: -filler,
        unit: 'kg',
        referenceId: batch._id.toString(),
        referenceType: 'ProductionBatch',
        date: input.batchDate,
        user: user || 'system',
        notes: `Mixture Prep Batch #${batchNo}`,
      });
    }

    // Deduct consumed scrap in WIP
    if (scrapAddedKg > 0) {
      await InventoryBalanceModel.findOneAndUpdate(
        { itemCode: 'SCRAP_IN_WIP' },
        { $inc: { currentStock: -scrapAddedKg } }
      );
    }

    // Reset remaining mixture balance since it is absorbed into this batch's opening stock
    if (openingStockKg > 0) {
      await InventoryBalanceModel.findOneAndUpdate(
        { itemCode: 'REMAINING_MIXTURE' },
        { $set: { currentStock: 0 } }
      );
    }

    await AuditLogModel.create({
      user: user || 'system',
      action: 'CREATE_BATCH',
      entity: 'ProductionBatch',
      entityId: batch._id.toString(),
      details: { batchNo, totalMixtureKg, newMixtureKg, openingStockKg, scrapAddedKg },
    });

    return batch;
  }

  static async getBatches(filter: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;

    const [rows, totalCount] = await Promise.all([
      ProductionBatchModel.find(query).sort({ batchNo: -1 }).skip(skip).limit(limit),
      ProductionBatchModel.countDocuments(query),
    ]);

    // Aggregate summary totals
    const all = await ProductionBatchModel.find(query);
    let totalPP = 0;
    let totalLL = 0;
    let totalFiller = 0;
    let totalNewMixture = 0;
    let totalOpeningStock = 0;
    let totalScrapAdded = 0;
    let grandTotalMixture = 0;

    for (const b of all) {
      totalPP += b.ppUsedKg;
      totalLL += b.llUsedKg;
      totalFiller += b.fillerUsedKg;
      totalNewMixture += b.newMixtureKg;
      totalOpeningStock += b.openingStockKg;
      totalScrapAdded += b.scrapAddedKg;
      grandTotalMixture += b.totalMixtureKg;
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
        totalNewMixture: Number(totalNewMixture.toFixed(2)),
        totalOpeningStock: Number(totalOpeningStock.toFixed(2)),
        totalScrapAdded: Number(totalScrapAdded.toFixed(2)),
        grandTotalMixture: Number(grandTotalMixture.toFixed(2)),
      },
    };
  }

  static async getActiveBatch() {
    return ProductionBatchModel.findOne({ status: 'IN_PROGRESS' }).sort({ batchNo: -1 });
  }

  static async getBatchByNo(batchNo: number) {
    return ProductionBatchModel.findOne({ batchNo });
  }

  static async updateBatch(id: string, input: Partial<CreateBatchInput>, user?: string) {
    const existing = await ProductionBatchModel.findById(id);
    if (!existing) {
      throw new Error('Production batch not found');
    }

    const oldPP = existing.ppUsedKg;
    const oldLL = existing.llUsedKg;
    const oldFiller = existing.fillerUsedKg;

    const newPP = input.ppUsedKg !== undefined ? Number(input.ppUsedKg) : oldPP;
    const newLL = input.llUsedKg !== undefined ? Number(input.llUsedKg) : oldLL;
    const newFiller = input.fillerUsedKg !== undefined ? Number(input.fillerUsedKg) : oldFiller;

    const diffPP = oldPP - newPP;
    const diffLL = oldLL - newLL;
    const diffFiller = oldFiller - newFiller;

    if (diffPP !== 0) {
      await MaterialModel.findOneAndUpdate({ code: 'PP' }, { $inc: { currentStockKg: diffPP } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'PP' }, { $inc: { currentStock: diffPP } });
    }
    if (diffLL !== 0) {
      await MaterialModel.findOneAndUpdate({ code: 'LL' }, { $inc: { currentStockKg: diffLL } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'LL' }, { $inc: { currentStock: diffLL } });
    }
    if (diffFiller !== 0) {
      await MaterialModel.findOneAndUpdate({ code: 'FILLER' }, { $inc: { currentStockKg: diffFiller } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'FILLER' }, { $inc: { currentStock: diffFiller } });
    }

    const newMixtureKg = Number((newPP + newLL + newFiller).toFixed(2));
    const totalMixtureKg = Number((newMixtureKg + existing.openingStockKg + existing.scrapAddedKg).toFixed(2));

    if (input.batchDate) existing.batchDate = input.batchDate;
    if (input.notes !== undefined) existing.notes = input.notes;
    existing.ppUsedKg = newPP;
    existing.llUsedKg = newLL;
    existing.fillerUsedKg = newFiller;
    existing.newMixtureKg = newMixtureKg;
    existing.totalMixtureKg = totalMixtureKg;

    await existing.save();

    await AuditLogModel.create({
      action: 'UPDATE',
      entity: 'ProductionBatch',
      entityId: existing._id.toString(),
      module: 'ProductionBatch',
      referenceId: existing._id.toString(),
      user: user || 'system',
      details: { batchNo: existing.batchNo, updatedFields: Object.keys(input) },
    });

    return existing;
  }

  static async deleteBatch(id: string, user?: string) {
    const existing = await ProductionBatchModel.findById(id);
    if (!existing) {
      throw new Error('Production batch not found');
    }

    if (existing.ppUsedKg > 0) {
      await MaterialModel.findOneAndUpdate({ code: 'PP' }, { $inc: { currentStockKg: existing.ppUsedKg } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'PP' }, { $inc: { currentStock: existing.ppUsedKg } });
    }
    if (existing.llUsedKg > 0) {
      await MaterialModel.findOneAndUpdate({ code: 'LL' }, { $inc: { currentStockKg: existing.llUsedKg } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'LL' }, { $inc: { currentStock: existing.llUsedKg } });
    }
    if (existing.fillerUsedKg > 0) {
      await MaterialModel.findOneAndUpdate({ code: 'FILLER' }, { $inc: { currentStockKg: existing.fillerUsedKg } });
      await InventoryBalanceModel.findOneAndUpdate({ itemCode: 'FILLER' }, { $inc: { currentStock: existing.fillerUsedKg } });
    }

    await AuditLogModel.create({
      action: 'DELETE',
      entity: 'ProductionBatch',
      entityId: existing._id.toString(),
      module: 'ProductionBatch',
      referenceId: existing._id.toString(),
      user: user || 'system',
      details: { batchNo: existing.batchNo },
    });

    await ProductionBatchModel.findByIdAndDelete(id);
    return { success: true, message: `Batch #${existing.batchNo} deleted successfully` };
  }
}
