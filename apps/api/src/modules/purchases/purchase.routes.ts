import { Router } from 'express';
import { PurchaseController } from './purchase.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { CreatePurchaseSchema } from '@bookbrain/shared';

const router = Router();

router.use(authenticate);

router.get('/next-meta', PurchaseController.getNextMeta);
router.get('/', PurchaseController.getPurchases);
router.get('/:id', PurchaseController.getPurchaseById);
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'ADMIN', 'INVENTORY_OPERATOR']),
  validateBody(CreatePurchaseSchema),
  PurchaseController.createPurchase
);
router.put(
  '/:id',
  authorize(['SUPER_ADMIN', 'ADMIN', 'INVENTORY_OPERATOR']),
  PurchaseController.updatePurchase
);
router.delete(
  '/:id',
  authorize(['SUPER_ADMIN', 'ADMIN']),
  PurchaseController.deletePurchase
);

export const purchaseRoutes = router;
