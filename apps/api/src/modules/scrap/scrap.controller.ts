import { Response } from 'express';
import { ScrapService } from './scrap.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class ScrapController {
  static async getBalances(_req: AuthenticatedRequest, res: Response) {
    try {
      const balances = await ScrapService.getScrapBalances();
      return res.json({ success: true, data: balances });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get scrap balances';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async allocate(req: AuthenticatedRequest, res: Response) {
    try {
      const { scrapInWipKg, notes } = req.body;
      const tx = await ScrapService.allocateScrapToWip(scrapInWipKg, notes, req.user?.username);
      return res.status(201).json({ success: true, data: tx });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to allocate scrap';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const { page, limit } = req.query;
      const data = await ScrapService.getScrapTransactions({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get scrap transactions';
      return res.status(500).json({ success: false, error: msg });
    }
  }
}
