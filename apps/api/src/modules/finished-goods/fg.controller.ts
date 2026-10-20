import { Response } from 'express';
import { FinishedGoodsService } from './fg.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class FinishedGoodsController {
  static async getNextMeta(_req: AuthenticatedRequest, res: Response) {
    try {
      const meta = await FinishedGoodsService.getNextMeta();
      return res.json({ success: true, data: meta });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get FG metadata';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async createEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const entry = await FinishedGoodsService.createEntry(req.body, req.user?.username);
      return res.status(201).json({ success: true, data: entry });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record finished goods';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async getEntries(req: AuthenticatedRequest, res: Response) {
    try {
      const { productName, startDate, endDate, page, limit } = req.query;
      const data = await FinishedGoodsService.getEntries({
        productName: productName as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list finished goods entries';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async updateEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const updated = await FinishedGoodsService.updateEntry(req.params.id, req.body, req.user?.username);
      return res.json({ success: true, data: updated, message: 'Finished goods entry updated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update finished goods entry';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async deleteEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await FinishedGoodsService.deleteEntry(req.params.id, req.user?.username);
      return res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete finished goods entry';
      return res.status(400).json({ success: false, error: msg });
    }
  }
}
