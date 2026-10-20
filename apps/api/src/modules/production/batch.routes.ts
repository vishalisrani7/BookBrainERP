import { Router } from 'express';
import { BatchController } from './batch.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { CreateWipBatchSchema } from '@bookbrain/shared';

const router = Router();

router.use(authenticate);

router.get('/current-meta', BatchController.getCurrentMeta);
router.get('/active', BatchController.getActiveBatch);
router.get('/', BatchController.getBatches);
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION_OPERATOR']),
  validateBody(CreateWipBatchSchema),
  BatchController.createBatch
);
router.put(
  '/:id',
  authorize(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION_OPERATOR']),
  BatchController.updateBatch
);
router.delete(
  '/:id',
  authorize(['SUPER_ADMIN', 'ADMIN']),
  BatchController.deleteBatch
);

export const batchRoutes = router;
