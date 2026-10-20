import { Router } from 'express';
import { FinishedGoodsController } from './fg.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { CreateFinishedGoodsSchema } from '@bookbrain/shared';

const router = Router();

router.use(authenticate);

router.get('/next-meta', FinishedGoodsController.getNextMeta);
router.get('/', FinishedGoodsController.getEntries);
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION_OPERATOR']),
  validateBody(CreateFinishedGoodsSchema),
  FinishedGoodsController.createEntry
);
router.put(
  '/:id',
  authorize(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION_OPERATOR']),
  FinishedGoodsController.updateEntry
);
router.delete(
  '/:id',
  authorize(['SUPER_ADMIN', 'ADMIN']),
  FinishedGoodsController.deleteEntry
);

export const finishedGoodsRoutes = router;
