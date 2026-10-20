import { Router } from 'express';
import { MigrationController } from './migration.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

router.post('/seed-historical', authorize(['SUPER_ADMIN', 'ADMIN']), MigrationController.seedHistorical);
router.get('/reconcile', authorize(['SUPER_ADMIN', 'ADMIN']), MigrationController.reconcile);

export const migrationRoutes = router;
