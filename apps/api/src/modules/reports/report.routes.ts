import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/:reportType', ReportController.getReport);
router.get('/:reportType/export-excel', ReportController.exportReportExcel);
router.get('/:reportType/export-csv', ReportController.exportReportCsv);

export const reportRoutes = router;
