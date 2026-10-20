import { ScrapTransactionModel, IScrapTransactionDocument } from '../../models/ScrapTransaction';
import { InventoryBalanceModel } from '../../models/InventoryBalance';
import { AuditLogModel } from '../../models/AuditLog';

export class ScrapService {
  static async getScrapBalances() {
    const totalScrapBal = await InventoryBalanceModel.findOne({ itemCode: 'TOTAL_SCRAP' });
    const scrapInWipBal = await InventoryBalanceModel.findOne({ itemCode: 'SCRAP_IN_WIP' });

    return {
      totalScrapKg: totalScrapBal?.currentStock || 0,
      scrapInWipKg: scrapInWipBal?.currentStock || 0,
    };
  }

  static async allocateScrapToWip(
    scrapInWipKg: number,
    notes?: string,
    user?: string
  ): Promise<IScrapTransactionDocument> {
    const balances = await this.getScrapBalances();

    if (scrapInWipKg <= 0) {
      throw new Error('Scrap amount must be greater than 0');
    }

    if (scrapInWipKg > balances.totalScrapKg) {
      throw new Error(
        `Cannot allocate ${scrapInWipKg} kg scrap. Total scrap in stock is only ${balances.totalScrapKg} kg.`
      );
    }

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayDate = `${day}-${month}-${year}`;

    // Deduct from TOTAL_SCRAP and add to SCRAP_IN_WIP
    await InventoryBalanceModel.findOneAndUpdate(
      { itemCode: 'TOTAL_SCRAP' },
      { $inc: { currentStock: -scrapInWipKg } }
    );

    await InventoryBalanceModel.findOneAndUpdate(
      { itemCode: 'SCRAP_IN_WIP' },
      { $inc: { currentStock: scrapInWipKg } },
      { upsert: true }
    );

    const transaction = await ScrapTransactionModel.create({
      transactionDate: todayDate,
      type: 'ALLOCATED_TO_WIP',
      quantityKg: scrapInWipKg,
      notes: notes || 'Allocated to WIP mixture preparation',
    });

    await AuditLogModel.create({
      user: user || 'system',
      action: 'ALLOCATE_SCRAP_TO_WIP',
      entity: 'ScrapTransaction',
      entityId: transaction._id.toString(),
      details: { scrapInWipKg },
    });

    return transaction;
  }

  static async getScrapTransactions(filter: { page?: number; limit?: number }) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 50));
    const skip = (page - 1) * limit;

    const [rows, totalCount] = await Promise.all([
      ScrapTransactionModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      ScrapTransactionModel.countDocuments(),
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
