import React, { useEffect, useState } from 'react';
import { DashboardTabs } from './DashboardTabs';
import { StatCard } from '../../components/ui/StatCard';
import { TableModal } from '../../components/ui/TableModal';
import { apiClient } from '../../services/api-client';
import { Layers, Maximize2, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#38bdf8', '#818cf8', '#34d399'];

export const RawMaterialDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [materialFilter, setMaterialFilter] = useState<'ALL' | 'PP' | 'LL' | 'FILLER'>('ALL');
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    const query = materialFilter !== 'ALL' ? `?material=${materialFilter}` : '';
    apiClient<any>(`/dashboard/raw-materials${query}`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [materialFilter]);

  // Calculate table summary totals
  const reportRows = data?.rawMaterialReport || [];
  const totals = reportRows.reduce(
    (acc: any, r: any) => ({
      ppKg: acc.ppKg + r.ppKg,
      llKg: acc.llKg + r.llKg,
      fillerKg: acc.fillerKg + r.fillerKg,
      mixtureKg: acc.mixtureKg + r.mixtureKg,
      openingStockKg: acc.openingStockKg + r.openingStockKg,
      totalMixtureKg: acc.totalMixtureKg + r.totalMixtureKg,
    }),
    { ppKg: 0, llKg: 0, fillerKg: 0, mixtureKg: 0, openingStockKg: 0, totalMixtureKg: 0 }
  );

  const renderTableContent = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <th className="py-2.5 px-3 font-bold">S_no</th>
            <th className="py-2.5 px-3 font-bold">Mixture_date</th>
            <th className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">PP (kg)</th>
            <th className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">LL (kg)</th>
            <th className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">FILLER (kg)</th>
            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-200">Mixture (kg)</th>
            <th className="py-2.5 px-3 font-bold text-purple-600 dark:text-purple-400">Opening_stock (kg)</th>
            <th className="py-2.5 px-3 font-bold text-slate-900 dark:text-white text-right">Total_mixture (kg)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
          {reportRows.map((r: any) => (
            <tr key={r.sNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{r.sNo}</td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.mixtureDate}</td>
              <td className="py-2 px-3 text-sky-600 dark:text-sky-400">{r.ppKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">{r.llKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">{r.fillerKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{r.mixtureKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-purple-600 dark:text-purple-400">{r.openingStockKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{r.totalMixtureKg.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 dark:bg-slate-950 font-mono font-bold text-slate-800 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
            <td className="py-3 px-3 uppercase text-slate-500 dark:text-slate-400">Total</td>
            <td className="py-3 px-3"></td>
            <td className="py-3 px-3 text-sky-600 dark:text-sky-400">{totals.ppKg.toFixed(2)}</td>
            <td className="py-3 px-3 text-indigo-600 dark:text-indigo-400">{totals.llKg.toFixed(2)}</td>
            <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">{totals.fillerKg.toFixed(2)}</td>
            <td className="py-3 px-3 text-slate-700 dark:text-slate-200">{totals.mixtureKg.toFixed(2)}</td>
            <td className="py-3 px-3 text-purple-600 dark:text-purple-400">{totals.openingStockKg.toFixed(2)}</td>
            <td className="py-3 px-3 text-right text-slate-900 dark:text-white text-sm">{totals.totalMixtureKg.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Tabs */}
      <DashboardTabs />

      {/* 5 Mixture Overview Top Cards (PDF Page 12) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Total Mixture Prepared"
          value={data?.kpis.totalMixturePrepared ?? 0}
          unit="kg"
          colorScheme="blue"
          subtitle="Total quantity prepared to date"
        />
        <StatCard
          title="Total Mixture Used Today"
          value={data?.kpis.totalMixtureUsedToday ?? 0}
          unit="kg"
          colorScheme="indigo"
          subtitle="Consumed in today's production"
        />
        <StatCard
          title="Remaining Mixture Today"
          value={data?.kpis.remainingMixtureToday ?? 0}
          unit="kg"
          colorScheme="emerald"
          subtitle="Balance of today's mixture"
        />
        <StatCard
          title="Opening Stock"
          value={data?.kpis.openingStock ?? 0}
          unit="kg"
          colorScheme="slate"
          subtitle="Carry-forward from prev batch"
        />
        <StatCard
          title="Closing Stock"
          value={data?.kpis.closingStock ?? 0}
          unit="kg"
          colorScheme="slate"
          subtitle="Computed current closing stock"
        />
      </div>

      {/* Material Filter Toggle Buttons matching PDF Page 13 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Material Filter:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['ALL', 'PP', 'LL', 'FILLER'] as const).map((mat) => (
              <button
                key={mat}
                onClick={() => setMaterialFilter(mat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  materialFilter === mat
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchDashboard}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Visuals Row: Bar Chart & Donut Chart (PDF Pages 12-13) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual 1: Raw Material Quantity in Stock (Bar Chart) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Raw Material Quantity In Stock
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Current available quantity of each raw material (kg)</p>
          </div>

          <div className="h-64 w-full">
            {data?.stockInStock ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stockInStock} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                  <XAxis dataKey="material" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="quantityKg" name="Stock (kg)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Visual 2: Raw Material Trend Over Time (Donut Chart) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Raw Material Trend Over Time
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cumulative usage &amp; percentage share of PP, LL, Filler</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {data?.cumulativeUsage ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.cumulativeUsage}
                    dataKey="quantityKg"
                    nameKey="material"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.cumulativeUsage.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Raw Material Report Table (PDF Page 14) with Focus Mode */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-sky-600 dark:text-sky-400" />
              Raw Material Report Table
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily logs of raw material mixture batches with total row calculation
            </p>
          </div>

          <button
            onClick={() => setFocusMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-semibold transition"
          >
            <Maximize2 size={14} />
            <span>Focus Mode</span>
          </button>
        </div>

        {renderTableContent()}
      </div>

      {/* Focus Mode Full-Screen Modal */}
      <TableModal
        isOpen={focusMode}
        onClose={() => setFocusMode(false)}
        title="Raw Material Report (Focus Mode)"
      >
        {renderTableContent()}
      </TableModal>
    </div>
  );
};
