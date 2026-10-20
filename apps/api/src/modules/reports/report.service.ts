import { PurchaseModel } from '../../models/Purchase';
import { ProductionBatchModel } from '../../models/ProductionBatch';
import { FinishedGoodsModel } from '../../models/FinishedGoods';
import { WipOutModel } from '../../models/WipOut';
import { ScrapTransactionModel } from '../../models/ScrapTransaction';
import { InventoryBalanceModel } from '../../models/InventoryBalance';
import ExcelJS from 'exceljs';

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ReportService {
  // 1. Raw Material Purchase Report
  static async getPurchaseReport(params: ReportQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(500, params.limit || 50));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (params.search) {
      query.$or = [
        { uniqueId: { $regex: params.search, $options: 'i' } },
        { billDate: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [purchases, totalCount] = await Promise.all([
      PurchaseModel.find(query).sort({ billNo: 1 }).skip(skip).limit(limit),
      PurchaseModel.countDocuments(query),
    ]);

    const rows = purchases.map((p) => {
      let ppKg = 0;
      let ppBags = 0;
      let llKg = 0;
      let llBags = 0;
      let fillerKg = 0;
      let fillerBags = 0;

      for (const it of p.items) {
        if (it.materialCode === 'PP') {
          ppKg += it.weightKg;
          ppBags += it.qtyBags;
        } else if (it.materialCode === 'LL') {
          llKg += it.weightKg;
          llBags += it.qtyBags;
        } else if (it.materialCode === 'FILLER') {
          fillerKg += it.weightKg;
          fillerBags += it.qtyBags;
        }
      }

      return {
        billNo: p.billNo,
        billDate: p.billDate,
        uniqueId: p.uniqueId,
        ppKg,
        ppBags,
        llKg,
        llBags,
        fillerKg,
        fillerBags,
        totalAmount: p.totalAmount,
      };
    });

    const all = await PurchaseModel.find(query);
    const summaryTotals = {
      totalPPKg: all.reduce((acc, p) => acc + (p.items.find((i) => i.materialCode === 'PP')?.weightKg || 0), 0),
      totalLLKg: all.reduce((acc, p) => acc + (p.items.find((i) => i.materialCode === 'LL')?.weightKg || 0), 0),
      totalFillerKg: all.reduce((acc, p) => acc + (p.items.find((i) => i.materialCode === 'FILLER')?.weightKg || 0), 0),
      grandTotalAmount: all.reduce((acc, p) => acc + p.totalAmount, 0),
    };

    return { rows, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit), summaryTotals };
  }

  // 2. Raw Material Purchase Stock Used Report
  static async getPurchaseStockUsedReport(params: ReportQueryParams) {
    const batches = await ProductionBatchModel.find().sort({ batchNo: 1 });
    const purchases = await PurchaseModel.find();

    let purchasedPP = 0;
    let purchasedLL = 0;
    let purchasedFiller = 0;
    for (const p of purchases) {
      for (const it of p.items) {
        if (it.materialCode === 'PP') purchasedPP += it.weightKg;
        if (it.materialCode === 'LL') purchasedLL += it.weightKg;
        if (it.materialCode === 'FILLER') purchasedFiller += it.weightKg;
      }
    }

    let cumPPUsed = 0;
    let cumLLUsed = 0;
    let cumFillerUsed = 0;

    const rows = batches.map((b) => {
      cumPPUsed += b.ppUsedKg;
      cumLLUsed += b.llUsedKg;
      cumFillerUsed += b.fillerUsedKg;

      return {
        batchNo: b.batchNo,
        batchDate: b.batchDate,
        ppUsedKg: b.ppUsedKg,
        cumPPUsedKg: cumPPUsed,
        remPPKg: Math.max(0, purchasedPP - cumPPUsed),
        llUsedKg: b.llUsedKg,
        cumLLUsedKg: cumLLUsed,
        remLLKg: Math.max(0, purchasedLL - cumLLUsed),
        fillerUsedKg: b.fillerUsedKg,
        cumFillerUsedKg: cumFillerUsed,
        remFillerKg: Math.max(0, purchasedFiller - cumFillerUsed),
      };
    });

    const summaryTotals = {
      totalPurchasedPP: purchasedPP,
      totalPurchasedLL: purchasedLL,
      totalPurchasedFiller: purchasedFiller,
      totalPPUsed: cumPPUsed,
      totalLLUsed: cumLLUsed,
      totalFillerUsed: cumFillerUsed,
    };

    return { rows, totalCount: rows.length, summaryTotals };
  }

  // 3. WIP IN Report
  static async getWipInReport(params: ReportQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(500, params.limit || 50));
    const skip = (page - 1) * limit;

    const [batches, totalCount] = await Promise.all([
      ProductionBatchModel.find().sort({ batchNo: 1 }).skip(skip).limit(limit),
      ProductionBatchModel.countDocuments(),
    ]);

    const rows = batches.map((b) => ({
      sNo: b.batchNo,
      mixtureDate: b.batchDate,
      ppKg: b.ppUsedKg,
      llKg: b.llUsedKg,
      fillerKg: b.fillerUsedKg,
      mixtureKg: b.newMixtureKg,
      openingStockKg: b.openingStockKg,
      scrapAddedKg: b.scrapAddedKg,
      totalMixtureKg: b.totalMixtureKg,
    }));

    const all = await ProductionBatchModel.find();
    const summaryTotals = {
      totalPP: all.reduce((sum, b) => sum + b.ppUsedKg, 0),
      totalLL: all.reduce((sum, b) => sum + b.llUsedKg, 0),
      totalFiller: all.reduce((sum, b) => sum + b.fillerUsedKg, 0),
      totalMixture: all.reduce((sum, b) => sum + b.newMixtureKg, 0),
      totalOpeningStock: all.reduce((sum, b) => sum + b.openingStockKg, 0),
      totalScrapAdded: all.reduce((sum, b) => sum + b.scrapAddedKg, 0),
      grandTotalMixture: all.reduce((sum, b) => sum + b.totalMixtureKg, 0),
    };

    return { rows, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit), summaryTotals };
  }

  // 4. Scrap Report
  static async getScrapReport(params: ReportQueryParams) {
    const txs = await ScrapTransactionModel.find().sort({ createdAt: 1 });
    const balances = await InventoryBalanceModel.findOne({ itemCode: 'TOTAL_SCRAP' });

    let runningScrap = 0;
    const rows = txs.map((tx) => {
      if (tx.type === 'GENERATED_FROM_WIP_OUT') {
        runningScrap += tx.quantityKg;
      } else {
        runningScrap -= tx.quantityKg;
      }

      return {
        transactionDate: tx.transactionDate,
        type: tx.type,
        quantityKg: tx.quantityKg,
        batchNo: tx.batchNo || '-',
        runningBalanceKg: runningScrap,
        notes: tx.notes || '',
      };
    });

    const summaryTotals = {
      totalGenerated: txs
        .filter((t) => t.type === 'GENERATED_FROM_WIP_OUT')
        .reduce((sum, t) => sum + t.quantityKg, 0),
      totalAllocated: txs
        .filter((t) => t.type === 'ALLOCATED_TO_WIP')
        .reduce((sum, t) => sum + t.quantityKg, 0),
      currentStockScrap: balances?.currentStock || 0,
    };

    return { rows, totalCount: rows.length, summaryTotals };
  }

  // 5. Mixture Report
  static async getMixtureReport(params: ReportQueryParams) {
    const batches = await ProductionBatchModel.find().sort({ batchNo: 1 });
    const fg = await FinishedGoodsModel.find();

    const rows = batches.map((b) => {
      const relatedFG = fg.filter((f) => f.batchNo === b.batchNo);
      const usedInFG = relatedFG.reduce((sum, f) => sum + f.totalMixtureUsedKg, 0);
      const remaining = Number((b.totalMixtureKg - usedInFG).toFixed(2));

      return {
        batchNo: b.batchNo,
        batchDate: b.batchDate,
        ppKg: b.ppUsedKg,
        llKg: b.llUsedKg,
        fillerKg: b.fillerUsedKg,
        openingStockKg: b.openingStockKg,
        scrapAddedKg: b.scrapAddedKg,
        totalMixturePrepKg: b.totalMixtureKg,
        mixtureUsedKg: Number(usedInFG.toFixed(2)),
        remainingMixtureKg: remaining,
      };
    });

    const summaryTotals = {
      totalPrepared: rows.reduce((s, r) => s + r.totalMixturePrepKg, 0),
      totalUsed: rows.reduce((s, r) => s + r.mixtureUsedKg, 0),
      totalRemaining: rows.reduce((s, r) => s + r.remainingMixtureKg, 0),
    };

    return { rows, totalCount: rows.length, summaryTotals };
  }

  // 6. Closing Report
  static async getClosingReport(params: ReportQueryParams) {
    const closings = await WipOutModel.find().sort({ serialNo: 1 });

    const rows = closings.map((c) => ({
      serialNo: c.serialNo,
      date: c.wipOutDate,
      batchNo: c.batchNo,
      totalMixturePrepKg: c.totalMixturePrepKg,
      totalMixtureUsedKg: c.totalMixtureUsedKg,
      scrapLeftKg: c.scrapLeftKg,
      wastageKg: c.wastageKg,
      remainingMixtureKg: c.remainingMixtureKg,
      carriedForward: c.carriedForward ? 'Yes' : 'No',
    }));

    const summaryTotals = {
      totalMixturePrepKg: rows.reduce((s, r) => s + r.totalMixturePrepKg, 0),
      totalMixtureUsedKg: rows.reduce((s, r) => s + r.totalMixtureUsedKg, 0),
      totalScrapLeftKg: rows.reduce((s, r) => s + r.scrapLeftKg, 0),
      totalWastageKg: rows.reduce((s, r) => s + r.wastageKg, 0),
      totalRemainingMixtureKg: rows.reduce((s, r) => s + r.remainingMixtureKg, 0),
    };

    return { rows, totalCount: rows.length, summaryTotals };
  }

  // 7. Finished Goods Report
  static async getFinishedGoodsReport(params: ReportQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(500, params.limit || 50));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (params.search) {
      query.productName = { $regex: params.search, $options: 'i' };
    }

    const [entries, totalCount] = await Promise.all([
      FinishedGoodsModel.find(query).sort({ serialNo: 1 }).skip(skip).limit(limit),
      FinishedGoodsModel.countDocuments(query),
    ]);

    const rows = entries.map((e) => ({
      sNo: e.serialNo,
      fgDate: e.fgDate,
      batchNo: e.batchNo,
      totalMixtureKg: e.totalMixturePrepKg,
      productName: e.productName,
      itemWeightGrams: e.itemWeightGrams,
      piecesProduced: e.piecesProduced,
      totalMixtureUsedKg: e.totalMixtureUsedKg,
    }));

    const all = await FinishedGoodsModel.find(query);
    const summaryTotals = {
      totalPieces: all.reduce((s, e) => s + e.piecesProduced, 0),
      totalMixtureUsedKg: Number(all.reduce((s, e) => s + e.totalMixtureUsedKg, 0).toFixed(2)),
    };

    return { rows, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit), summaryTotals };
  }

  // 8. WIP OUT Report
  static async getWipOutReport(params: ReportQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(500, params.limit || 50));
    const skip = (page - 1) * limit;

    const [rowsDB, totalCount] = await Promise.all([
      WipOutModel.find().sort({ serialNo: 1 }).skip(skip).limit(limit),
      WipOutModel.countDocuments(),
    ]);

    const rows = rowsDB.map((w) => ({
      sNo: w.serialNo,
      wipOutDate: w.wipOutDate,
      totalMixturePrepKg: w.totalMixturePrepKg,
      totalMixtureUsedKg: w.totalMixtureUsedKg,
      scrapLeftKg: w.scrapLeftKg,
      wastageKg: w.wastageKg,
      remainingMixtureKg: w.remainingMixtureKg,
    }));

    const all = await WipOutModel.find();
    const summaryTotals = {
      totalMixturePrepKg: Number(all.reduce((s, w) => s + w.totalMixturePrepKg, 0).toFixed(2)),
      totalMixtureUsedKg: Number(all.reduce((s, w) => s + w.totalMixtureUsedKg, 0).toFixed(2)),
      scrapLeftKg: Number(all.reduce((s, w) => s + w.scrapLeftKg, 0).toFixed(2)),
      wastageKg: Number(all.reduce((s, w) => s + w.wastageKg, 0).toFixed(2)),
      remainingMixtureKg: Number(all.reduce((s, w) => s + w.remainingMixtureKg, 0).toFixed(2)),
    };

    return { rows, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit), summaryTotals };
  }

  // Generate Excel workbook for any report
  static async exportToExcel(reportId: string, data: Record<string, unknown>[]): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BookBrain Pvt Ltd';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(reportId.toUpperCase());

    if (data.length > 0) {
      const columns = Object.keys(data[0]).map((key) => ({
        header: key.toUpperCase().replace(/_/g, ' '),
        key,
        width: 18,
      }));
      sheet.columns = columns;

      // Header row styling
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };

      for (const row of data) {
        sheet.addRow(row);
      }
    }

    return workbook.xlsx.writeBuffer();
  }
}
