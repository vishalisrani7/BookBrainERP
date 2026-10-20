import { Response } from 'express';
import { PurchaseService } from './purchase.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class PurchaseController {
  static async getNextMeta(_req: AuthenticatedRequest, res: Response) {
    try {
      const meta = await PurchaseService.getNextMeta();
      return res.json({ success: true, data: meta });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get purchase metadata';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async createPurchase(req: AuthenticatedRequest, res: Response) {
    try {
      const purchase = await PurchaseService.createPurchase(req.body, req.user?.username);
      return res.status(201).json({ success: true, data: purchase });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create purchase';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async getPurchases(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, search, page, limit } = req.query;
      const data = await PurchaseService.getPurchases({
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list purchases';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async getPurchaseById(req: AuthenticatedRequest, res: Response) {
    try {
      const purchase = await PurchaseService.getPurchaseById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ success: false, error: 'Purchase not found' });
      }
      return res.json({ success: true, data: purchase });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve purchase';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async updatePurchase(req: AuthenticatedRequest, res: Response) {
    try {
      const updated = await PurchaseService.updatePurchase(req.params.id, req.body, req.user?.username);
      return res.json({ success: true, data: updated, message: 'Purchase updated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update purchase';
      return res.status(400).json({ success: false, error: msg });
    }
  }

  static async deletePurchase(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await PurchaseService.deletePurchase(req.params.id, req.user?.username);
      return res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete purchase';
      return res.status(400).json({ success: false, error: msg });
    }
  }
}
