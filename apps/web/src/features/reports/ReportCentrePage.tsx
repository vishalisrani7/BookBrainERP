import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { REPORT_TYPES } from '@bookbrain/shared';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Layers,
} from 'lucide-react';

export const ReportCentrePage: React.FC = () => {
  const [activeReportId, setActiveReportId] = useState<string>('purchases');
  const [reportData, setReportData] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchReport = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    apiClient<any>(`/reports/${activeReportId}?${query.toString()}`)
      .then((data) => setReportData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [activeReportId]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await apiClient<Blob>(`/reports/${activeReportId}/export-excel`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BookBrain_${activeReportId}_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export spreadsheet file';
      alert(`Export error: ${msg}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await apiClient<Blob>(`/reports/${activeReportId}/export-csv`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BookBrain_${activeReportId}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export CSV file';
      alert(`Export error: ${msg}`);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentReportMeta = REPORT_TYPES.find((r) => r.id === activeReportId);
  const rows = reportData?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Printable Company Letterhead (Visible ONLY when printing) */}
      <div className="hidden print-only mb-6 border-b-2 border-black pb-4 text-center">
        <h1 className="text-2xl font-black uppercase text-black">BookBrain Pvt Ltd</h1>
        <p className="text-sm text-black">
          Plot No. 36, 37 Sector-C, Behind Padmini Resort, Hatundi Road, Badgaon, Ajmer 305001 &bull; Mob: 7014638667
        </p>
        <h2 className="text-lg font-bold uppercase mt-2 text-black underline">
          {currentReportMeta?.title}
        </h2>
        <p className="text-xs text-black">Generated Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Top Controls Header (Hidden on print) */}
      <div className="no-print space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-xs font-semibold mb-2">
                <Printer size={13} />
                <span>Production &amp; Stock Report Centre</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Production &amp; Stock Reports</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Export verified transactional records in Spreadsheet (.xlsx), CSV, or high-fidelity print layout.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition shadow-sm"
              >
                <Printer size={14} className="text-sky-600 dark:text-sky-400" />
                <span>Print Report</span>
              </button>

              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 transition shadow-sm"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Export Spreadsheet (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-300 dark:border-indigo-800 transition shadow-sm"
              >
                <Download size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 8 Report Selection Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 pb-1">
            {REPORT_TYPES.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setActiveReportId(rep.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeReportId === rep.id
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {rep.title}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search report..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 dark:text-slate-400">From:</label>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono w-28 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 dark:text-slate-400">To:</label>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono w-28 focus:outline-none"
              />
            </div>

            <button
              onClick={fetchReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition"
            >
              <Filter size={13} />
              <span>Filter</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            Records Found: <span className="text-slate-900 dark:text-white font-bold">{rows.length}</span>
          </div>
        </div>
      </div>

      {/* Main Report Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-sky-600 dark:text-sky-400" />
            {currentReportMeta?.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentReportMeta?.description}</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw size={24} className="animate-spin text-sky-500" />
            <span className="text-xs">Generating report data...</span>
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 font-bold">
                      {col.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-3 text-slate-800 dark:text-slate-200">
                        {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
            No records found for the selected report filters.
          </div>
        )}

        {/* Summary Totals Footer */}
        {reportData?.summaryTotals && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Report Summary Totals:
            </span>
            <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
              {Object.entries(reportData.summaryTotals).map(([key, val]: any) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">
                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
