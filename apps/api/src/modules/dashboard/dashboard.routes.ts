import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/home-overview', DashboardController.getHomeOverview);
router.get('/raw-materials', DashboardController.getRawMaterials);
router.get('/wip-progress', DashboardController.getWipProgress);
router.get('/finished-goods', DashboardController.getFinishedGoods);

export const dashboardRoutes = router;
