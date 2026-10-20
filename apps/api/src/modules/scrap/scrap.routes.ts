import { Router } from 'express';
import { ScrapController } from './scrap.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { AllocateScrapSchema } from '@bookbrain/shared';

const router = Router();

router.use(authenticate);

router.get('/balances', ScrapController.getBalances);
router.get('/transactions', ScrapController.getTransactions);
router.post(
  '/allocate',
  authorize(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION_OPERATOR']),
  validateBody(AllocateScrapSchema),
  ScrapController.allocate
);

export const scrapRoutes = router;
