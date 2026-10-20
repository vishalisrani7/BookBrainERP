import { Request, Response } from 'express';
import { ReportService } from './report.service';

export class ReportController {
  static async getReport(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      const { startDate, endDate, search, page, limit } = req.query;

      const params = {
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      let result;
      switch (reportType) {
        case 'purchases':
          result = await ReportService.getPurchaseReport(params);
          break;
        case 'purchase-stock-used':
          result = await ReportService.getPurchaseStockUsedReport(params);
          break;
        case 'wip-in':
          result = await ReportService.getWipInReport(params);
          break;
        case 'scrap':
          result = await ReportService.getScrapReport(params);
          break;
        case 'mixture':
          result = await ReportService.getMixtureReport(params);
          break;
        case 'closing':
          result = await ReportService.getClosingReport(params);
          break;
        case 'finished-goods':
          result = await ReportService.getFinishedGoodsReport(params);
          break;
        case 'wip-out':
          result = await ReportService.getWipOutReport(params);
          break;
        default:
          return res.status(404).json({ success: false, error: `Report type '${reportType}' not found` });
      }

      return res.json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate report';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async exportReportExcel(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      let result;
      switch (reportType) {
        case 'purchases':
          result = await ReportService.getPurchaseReport({ limit: 1000 });
          break;
        case 'purchase-stock-used':
          result = await ReportService.getPurchaseStockUsedReport({});
          break;
        case 'wip-in':
          result = await ReportService.getWipInReport({ limit: 1000 });
          break;
        case 'scrap':
          result = await ReportService.getScrapReport({});
          break;
        case 'mixture':
          result = await ReportService.getMixtureReport({});
          break;
        case 'closing':
          result = await ReportService.getClosingReport({});
          break;
        case 'finished-goods':
          result = await ReportService.getFinishedGoodsReport({ limit: 1000 });
          break;
        case 'wip-out':
          result = await ReportService.getWipOutReport({ limit: 1000 });
          break;
        default:
          return res.status(404).json({ success: false, error: 'Unknown report type' });
      }

      const buffer = await ReportService.exportToExcel(
        reportType,
        result.rows as unknown as Record<string, unknown>[]
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=BookBrain_${reportType}_report.xlsx`);
      return res.send(buffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Excel export failed';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async exportReportCsv(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      let result;
      switch (reportType) {
        case 'purchases':
          result = await ReportService.getPurchaseReport({ limit: 1000 });
          break;
        case 'purchase-stock-used':
          result = await ReportService.getPurchaseStockUsedReport({});
          break;
        case 'wip-in':
          result = await ReportService.getWipInReport({ limit: 1000 });
          break;
        case 'scrap':
          result = await ReportService.getScrapReport({});
          break;
        case 'mixture':
          result = await ReportService.getMixtureReport({});
          break;
        case 'closing':
          result = await ReportService.getClosingReport({});
          break;
        case 'finished-goods':
          result = await ReportService.getFinishedGoodsReport({ limit: 1000 });
          break;
        case 'wip-out':
          result = await ReportService.getWipOutReport({ limit: 1000 });
          break;
        default:
          return res.status(404).json({ success: false, error: 'Unknown report type' });
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=BookBrain_${reportType}_report.csv`);

      const rows = (result.rows || []) as unknown as Record<string, unknown>[];
      if (rows.length === 0) {
        return res.send('Message\nNo records found for the selected criteria\n');
      }

      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(',')];

      for (const r of rows) {
        const values = headers.map((h) => {
          const val = r[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val);
        });
        csvLines.push(values.join(','));
      }

      return res.send(csvLines.join('\n'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV export failed';
      return res.status(500).json({ success: false, error: msg });
    }
  }
}
