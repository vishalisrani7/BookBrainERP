import { Router } from 'express';
import { WipOutController } from './wip-out.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { CreateWipOutSchema } from '@bookbrain/shared';

const router = Router();

router.use(authenticate);

router.get('/next-meta', WipOutController.getNextMeta);
router.get('/', WipOutController.getEntries);
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION_OPERATOR']),
  validateBody(CreateWipOutSchema),
  WipOutController.createEntry
);

export const wipOutRoutes = router;
