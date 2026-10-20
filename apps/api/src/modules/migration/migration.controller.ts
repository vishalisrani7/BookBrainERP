import { Response } from 'express';
import { MigrationService } from './migration.service';
import { AuthenticatedRequest } from '../../middleware/authenticate';

export class MigrationController {
  static async seedHistorical(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await MigrationService.seedHistoricalData();
      return res.json({ success: true, message: 'Historical data seeded successfully', data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Historical seeding failed';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async reconcile(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await MigrationService.reconcileBalances();
      return res.json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reconciliation check failed';
      return res.status(500).json({ success: false, error: msg });
    }
  }
}
