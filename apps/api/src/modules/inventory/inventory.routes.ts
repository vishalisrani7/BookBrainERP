import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', InventoryController.getBalances);
router.get('/balances', InventoryController.getBalances);
router.get('/movements', InventoryController.getMovements);

export const inventoryRoutes = router;
