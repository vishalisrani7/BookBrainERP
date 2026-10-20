import { Response } from 'express';
import { InventoryService } from './inventory.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class InventoryController {
  static async getBalances(_req: AuthenticatedRequest, res: Response) {
    try {
      const balances = await InventoryService.getBalances();
      return res.json({ success: true, data: balances });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get inventory balances';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async getMovements(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemCode, movementType, startDate, endDate, page, limit } = req.query;
      const data = await InventoryService.getMovements({
        itemCode: itemCode as string,
        movementType: movementType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get stock movements';
      return res.status(500).json({ success: false, error: msg });
    }
  }
}
