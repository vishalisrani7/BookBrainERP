import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static async getHomeOverview(req: Request, res: Response) {
    try {
      const { itemName, year } = req.query;
      const data = await DashboardService.getHomeOverview({
        itemName: itemName as string,
        year: year as string,
      });
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get Home dashboard';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async getRawMaterials(req: Request, res: Response) {
    try {
      const { material } = req.query;
      const data = await DashboardService.getRawMaterialDetails(
        material as 'PP' | 'LL' | 'FILLER' | 'ALL'
      );
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get Raw Material dashboard';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async getWipProgress(_req: Request, res: Response) {
    try {
      const data = await DashboardService.getWipProgress();
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get WIP Progress dashboard';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async getFinishedGoods(req: Request, res: Response) {
    try {
      const { product } = req.query;
      const data = await DashboardService.getFinishedGoodsDashboard(product as string);
      return res.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get Finished Goods dashboard';
      return res.status(500).json({ success: false, error: msg });
    }
  }
}
