import { Response } from 'express';
import { BatchService } from './batch.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class BatchController {
  static async getCurrentMeta(_req: AuthenticatedRequest, res: Response) {
    try {
      const meta = await BatchService.getCurrentMeta();
      return res.json({ success: true, data: meta });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get batch metadata';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async getActiveBatch(_req: AuthenticatedRequest, res: Response) {
    try {
      const batch = await BatchService.getActiveBatch();
      return res.json({ success: true, data: batch });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get active batch';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async createBatch(req: AuthenticatedRequest, res: Response) {
    try {
      const batch = await BatchService.createBatch(req.body, req.user?.username);
      return res.status(201).json({ success: true, data: batch });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create batch';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async getBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, status, page, limit } = req.query;
      const data = await BatchService.getBatches({
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list batches';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async updateBatch(req: AuthenticatedRequest, res: Response) {
    try {
      const updated = await BatchService.updateBatch(req.params.id, req.body, req.user?.username);
      return res.json({ success: true, data: updated, message: 'Batch updated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update batch';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async deleteBatch(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await BatchService.deleteBatch(req.params.id, req.user?.username);
      return res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete batch';
      return res.status(400).json({ success: false, error: msg });
    }
  }
}
