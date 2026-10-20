import { Response } from 'express';
import { WipOutService } from './wip-out.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class WipOutController {
  static async getNextMeta(_req: AuthenticatedRequest, res: Response) {
    try {
      const meta = await WipOutService.getNextMeta();
      return res.json({ success: true, data: meta });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get WIP OUT metadata';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async createEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const entry = await WipOutService.createEntry(req.body, req.user?.username);
      return res.status(201).json({ success: true, data: entry });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record WIP OUT';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async getEntries(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, page, limit } = req.query;
      const data = await WipOutService.getEntries({
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list WIP OUT entries';
      return res.status(500).json({ success: false, error: msg });
    }
  }
}
