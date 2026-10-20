import { InventoryBalanceModel } from '../../models/InventoryBalance';
import { StockMovementModel } from '../../models/StockMovement';
import { MaterialModel } from '../../models/Material';

export class InventoryService {
  static async getBalances() {
    const balances = await InventoryBalanceModel.find();
    const balanceMap: Record<string, number> = {
      PP: 0,
      LL: 0,
      FILLER: 0,
      TOTAL_SCRAP: 0,
      SCRAP_IN_WIP: 0,
      REMAINING_MIXTURE: 0,
    };

    for (const b of balances) {
      balanceMap[b.itemCode] = b.currentStock;
    }

    // Also double check raw materials
    const materials = await MaterialModel.find();
    for (const m of materials) {
      if (balanceMap[m.code] === undefined || balanceMap[m.code] === 0) {
        balanceMap[m.code] = m.currentStockKg;
      }
    }

    return balanceMap;
  }

  static async getMovements(filter: {
    itemCode?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 50));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filter.itemCode) query.itemCode = filter.itemCode;
    if (filter.movementType) query.movementType = filter.movementType;
    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) (query.date as Record<string, unknown>).$gte = filter.startDate;
      if (filter.endDate) (query.date as Record<string, unknown>).$lte = filter.endDate;
    }

    const [rows, totalCount] = await Promise.all([
      StockMovementModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      StockMovementModel.countDocuments(query),
    ]);

    return {
      rows,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
}
