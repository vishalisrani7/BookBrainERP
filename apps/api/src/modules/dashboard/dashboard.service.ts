import { ProductionBatchModel } from '../../models/ProductionBatch';
import { FinishedGoodsModel } from '../../models/FinishedGoods';
import { WipOutModel } from '../../models/WipOut';
import { InventoryBalanceModel } from '../../models/InventoryBalance';
import { MaterialModel } from '../../models/Material';
import { ScrapTransactionModel } from '../../models/ScrapTransaction';

export class DashboardService {
  private static getTodayFormatted(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // 1. Dashboard One: Home Overview
  static async getHomeOverview(filter: { itemName?: string; year?: string }) {
    const today = this.getTodayFormatted();

    // Query filters
    const fgQuery: Record<string, unknown> = {};
    if (filter.itemName && filter.itemName !== 'ALL') {
      fgQuery.productName = filter.itemName;
    }
    if (filter.year) {
      fgQuery.fgDate = { $regex: filter.year };
    }

    const [allWipOut, allFG, totalScrapBal, remainingMixBal, batches] = await Promise.all([
      WipOutModel.find(),
      FinishedGoodsModel.find(fgQuery),
      InventoryBalanceModel.findOne({ itemCode: 'TOTAL_SCRAP' }),
      InventoryBalanceModel.findOne({ itemCode: 'REMAINING_MIXTURE' }),
      ProductionBatchModel.find().sort({ batchNo: 1 }),
    ]);

    const totalScrap = allWipOut.reduce((sum, w) => sum + w.scrapLeftKg, 0);
    const totalWastage = allWipOut.reduce((sum, w) => sum + w.wastageKg, 0);
    const totalFinishGoods = allFG.reduce((sum, f) => sum + f.piecesProduced, 0);
    const remainingMixture = remainingMixBal ? remainingMixBal.currentStock : 0;

    // Mixture vs Used chart (grouped by batch / date)
    const batchVsUsedMap: Record<string, { batchNo: number; date: string; preparedKg: number; usedKg: number }> = {};
    for (const b of batches) {
      batchVsUsedMap[b.batchNo] = {
        batchNo: b.batchNo,
        date: b.batchDate,
        preparedKg: b.totalMixtureKg,
        usedKg: 0,
      };
    }
    for (const f of allFG) {
      if (batchVsUsedMap[f.batchNo]) {
        batchVsUsedMap[f.batchNo].usedKg += f.totalMixtureUsedKg;
      }
    }

    const mixtureVsUsedChart = Object.values(batchVsUsedMap).map((item) => ({
      ...item,
      preparedKg: Number(item.preparedKg.toFixed(2)),
      usedKg: Number(item.usedKg.toFixed(2)),
    }));

    // Step-by-step summary: Prepared, Used in FG, Remaining, Scrap, Wastage
    const totalPrepared = batches.reduce((sum, b) => sum + b.totalMixtureKg, 0);
    const totalUsedInFG = allFG.reduce((sum, f) => sum + f.totalMixtureUsedKg, 0);

    const quantityByStepChart = [
      { step: 'Total Mixture Prepared', value: Number(totalPrepared.toFixed(2)) },
      { step: 'Mixture Used in FG', value: Number(totalUsedInFG.toFixed(2)) },
      { step: 'Remaining Mixture', value: Number(remainingMixture.toFixed(2)) },
      { step: 'Total Scrap', value: Number(totalScrap.toFixed(2)) },
      { step: 'Wastage', value: Number(totalWastage.toFixed(2)) },
    ];

    return {
      kpis: {
        totalScrap: Number(totalScrap.toFixed(2)),
        wastage: Number(totalWastage.toFixed(2)),
        remainingMixture: Number(remainingMixture.toFixed(2)),
        totalFinishGoods,
      },
      mixtureVsUsedChart,
      quantityByStepChart,
    };
  }

  // 2. Dashboard Two: Raw Material Details
  static async getRawMaterialDetails(materialFilter?: 'PP' | 'LL' | 'FILLER' | 'ALL') {
    const today = this.getTodayFormatted();

    const [batches, rawStock, todayFG, latestWipOut] = await Promise.all([
      ProductionBatchModel.find().sort({ batchNo: 1 }),
      InventoryBalanceModel.find({ itemCode: { $in: ['PP', 'LL', 'FILLER'] } }),
      FinishedGoodsModel.find({ fgDate: today }),
      WipOutModel.findOne().sort({ serialNo: -1 }),
    ]);

    const stockMap: Record<string, number> = { PP: 0, LL: 0, FILLER: 0 };
    for (const s of rawStock) {
      stockMap[s.itemCode] = s.currentStock;
    }

    // Cumulative usage from all batches
    let totalPPUsed = 0;
    let totalLLUsed = 0;
    let totalFillerUsed = 0;
    let totalMixturePrepared = 0;

    const rawMaterialReport = batches.map((b) => {
      totalPPUsed += b.ppUsedKg;
      totalLLUsed += b.llUsedKg;
      totalFillerUsed += b.fillerUsedKg;
      totalMixturePrepared += b.totalMixtureKg;

      return {
        sNo: b.batchNo,
        mixtureDate: b.batchDate,
        ppKg: b.ppUsedKg,
        llKg: b.llUsedKg,
        fillerKg: b.fillerUsedKg,
        mixtureKg: b.newMixtureKg,
        openingStockKg: b.openingStockKg,
        totalMixtureKg: b.totalMixtureKg,
      };
    });

    const totalMixtureUsedToday = todayFG.reduce((sum, f) => sum + f.totalMixtureUsedKg, 0);
    const openingStock = batches.length > 0 ? batches[batches.length - 1].openingStockKg : 0;
    const remainingMixtureToday = latestWipOut ? latestWipOut.remainingMixtureKg : 0;
    const closingStock = remainingMixtureToday;

    // Filter table and stock if material selected
    const filteredReport =
      materialFilter && materialFilter !== 'ALL'
        ? rawMaterialReport.filter((r) => {
            if (materialFilter === 'PP') return r.ppKg > 0;
            if (materialFilter === 'LL') return r.llKg > 0;
            if (materialFilter === 'FILLER') return r.fillerKg > 0;
            return true;
          })
        : rawMaterialReport;

    return {
      kpis: {
        totalMixturePrepared: Number(totalMixturePrepared.toFixed(2)),
        totalMixtureUsedToday: Number(totalMixtureUsedToday.toFixed(2)),
        remainingMixtureToday: Number(remainingMixtureToday.toFixed(2)),
        openingStock: Number(openingStock.toFixed(2)),
        closingStock: Number(closingStock.toFixed(2)),
      },
      stockInStock: [
        { material: 'PP', quantityKg: stockMap.PP },
        { material: 'LL', quantityKg: stockMap.LL },
        { material: 'FILLER', quantityKg: stockMap.FILLER },
      ],
      cumulativeUsage: [
        { material: 'PP', quantityKg: Number(totalPPUsed.toFixed(2)) },
        { material: 'LL', quantityKg: Number(totalLLUsed.toFixed(2)) },
        { material: 'FILLER', quantityKg: Number(totalFillerUsed.toFixed(2)) },
      ],
      rawMaterialReport: filteredReport,
    };
  }

  // 3. Dashboard Three: WIP In & Out Progress
  static async getWipProgress() {
    const today = this.getTodayFormatted();

    const [batches, wipOutEntries, todayFG, todayBatch, scrapBal, latestWipOut] = await Promise.all([
      ProductionBatchModel.find().sort({ batchNo: 1 }),
      WipOutModel.find().sort({ serialNo: 1 }),
      FinishedGoodsModel.find({ fgDate: today }),
      ProductionBatchModel.findOne({ batchDate: today }),
      InventoryBalanceModel.findOne({ itemCode: 'TOTAL_SCRAP' }),
      WipOutModel.findOne().sort({ serialNo: -1 }),
    ]);

    const todayTotalMixturePrepared = todayBatch ? todayBatch.totalMixtureKg : (batches.length > 0 ? batches[batches.length - 1].totalMixtureKg : 0);
    const openingStock = batches.length > 0 ? batches[batches.length - 1].openingStockKg : 0;
    const totalWastage = wipOutEntries.reduce((sum, w) => sum + w.wastageKg, 0);
    const todayScrapUsed = todayBatch ? todayBatch.scrapAddedKg : 0;
    const scrapLeftToday = scrapBal ? scrapBal.currentStock : 0;
    const totalMixtureUsedToday = todayFG.reduce((sum, f) => sum + f.totalMixtureUsedKg, 0);
    const remainingMixtureToday = latestWipOut ? latestWipOut.remainingMixtureKg : 0;

    // Last 7 entries trend
    const last7Batches = batches.slice(-7);
    const last7DaysMixture = last7Batches.map((b) => {
      const relatedFG = wipOutEntries.find((w) => w.batchNo === b.batchNo);
      return {
        batchNo: b.batchNo,
        date: b.batchDate,
        mixturePrepared: b.totalMixtureKg,
        mixtureUsed: relatedFG ? relatedFG.totalMixtureUsedKg : 0,
      };
    });

    // Mixture breakdown from today or recent batches
    let totalPP = 0;
    let totalLL = 0;
    let totalFiller = 0;
    for (const b of batches) {
      totalPP += b.ppUsedKg;
      totalLL += b.llUsedKg;
      totalFiller += b.fillerUsedKg;
    }
    const sumRM = totalPP + totalLL + totalFiller || 1;

    const mixtureBreakdown = [
      { name: 'PP', value: Number(((totalPP / sumRM) * 100).toFixed(1)), quantityKg: totalPP },
      { name: 'LL', value: Number(((totalLL / sumRM) * 100).toFixed(1)), quantityKg: totalLL },
      { name: 'Filler', value: Number(((totalFiller / sumRM) * 100).toFixed(1)), quantityKg: totalFiller },
    ];

    const wipInReport = batches.map((b) => ({
      sNo: b.batchNo,
      mixtureDate: b.batchDate,
      ppKg: b.ppUsedKg,
      llKg: b.llUsedKg,
      fillerKg: b.fillerUsedKg,
      mixtureKg: b.newMixtureKg,
      openingStockKg: b.openingStockKg,
      totalMixtureKg: b.totalMixtureKg,
    }));

    const wipOutReport = wipOutEntries.map((w) => ({
      sNo: w.serialNo,
      wipOutDate: w.wipOutDate,
      totalMixturePrepKg: w.totalMixturePrepKg,
      totalMixtureUsedKg: w.totalMixtureUsedKg,
      scrapLeftKg: w.scrapLeftKg,
      wastageKg: w.wastageKg,
      remainingMixtureKg: w.remainingMixtureKg,
    }));

    return {
      kpis: {
        todayTotalMixturePrepared: Number(todayTotalMixturePrepared.toFixed(2)),
        openingStock: Number(openingStock.toFixed(2)),
        wastage: Number(totalWastage.toFixed(2)),
        todayScrapUsed: Number(todayScrapUsed.toFixed(2)),
        scrapLeftToday: Number(scrapLeftToday.toFixed(2)),
        totalMixtureUsedToday: Number(totalMixtureUsedToday.toFixed(2)),
        remainingMixtureToday: Number(remainingMixtureToday.toFixed(2)),
      },
      last7DaysMixture,
      mixtureBreakdown,
      wipInReport,
      wipOutReport,
    };
  }

  // 4. Dashboard Four: Finish Goods
  static async getFinishedGoodsDashboard(productFilter?: string) {
    const today = this.getTodayFormatted();

    const query: Record<string, unknown> = {};
    if (productFilter && productFilter !== 'ALL') {
      query.productName = productFilter;
    }

    const [allFG, todayFG, scrapBal] = await Promise.all([
      FinishedGoodsModel.find(query).sort({ serialNo: 1 }),
      FinishedGoodsModel.find({ ...query, fgDate: today }),
      InventoryBalanceModel.findOne({ itemCode: 'TOTAL_SCRAP' }),
    ]);

    const totalFinishGoods = allFG.reduce((sum, f) => sum + f.piecesProduced, 0);
    const todayFinishGoods = todayFG.reduce((sum, f) => sum + f.piecesProduced, 0);
    const todayScrap = scrapBal ? scrapBal.currentStock : 0;

    const totalMixtureUsedAllKg = allFG.reduce((sum, f) => sum + f.totalMixtureUsedKg, 0);
    const avgMixPerPieceGrams =
      totalFinishGoods > 0 ? Number(((totalMixtureUsedAllKg * 1000) / totalFinishGoods).toFixed(1)) : 0;

    // Finish Good Type vs Quantity
    const qtyByProductMap: Record<string, number> = {};
    const mixtureByProductMap: Record<string, number> = {};

    for (const f of allFG) {
      qtyByProductMap[f.productName] = (qtyByProductMap[f.productName] || 0) + f.piecesProduced;
      mixtureByProductMap[f.productName] = (mixtureByProductMap[f.productName] || 0) + f.totalMixtureUsedKg;
    }

    const typeVsQuantity = Object.entries(qtyByProductMap).map(([productName, pieces]) => ({
      productName,
      pieces,
    }));

    const totalUsageForPie = Object.values(mixtureByProductMap).reduce((a, b) => a + b, 0) || 1;
    const mixtureUsagePercent = Object.entries(mixtureByProductMap).map(([productName, usedKg]) => ({
      productName,
      usedKg: Number(usedKg.toFixed(2)),
      percentage: Number(((usedKg / totalUsageForPie) * 100).toFixed(1)),
    }));

    const overviewTable = allFG.map((f) => ({
      sNo: f.serialNo,
      fgDate: f.fgDate,
      totalMixtureKg: f.totalMixturePrepKg,
      productName: f.productName,
      itemWeightGrams: f.itemWeightGrams,
      piecesProduced: f.piecesProduced,
      totalMixtureUsedKg: f.totalMixtureUsedKg,
    }));

    return {
      kpis: {
        totalFinishGoods,
        todayScrap: Number(todayScrap.toFixed(2)),
        todayFinishGoods,
        avgMixPerPieceGrams,
      },
      typeVsQuantity,
      mixtureUsagePercent,
      overviewTable,
    };
  }
}
