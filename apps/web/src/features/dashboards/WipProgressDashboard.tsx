import React, { useEffect, useState } from 'react';
import { DashboardTabs } from './DashboardTabs';
import { StatCard } from '../../components/ui/StatCard';
import { TableModal } from '../../components/ui/TableModal';
import { apiClient } from '../../services/api-client';
import { Maximize2, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const BREAKDOWN_COLORS = ['#38bdf8', '#818cf8', '#34d399'];

export const WipProgressDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Focus mode states for each table
  const [focusWipIn, setFocusWipIn] = useState(false);
  const [focusWipOut, setFocusWipOut] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    apiClient<any>('/dashboard/wip-progress')
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const wipInRows = data?.wipInReport || [];
  const wipInTotals = wipInRows.reduce(
    (acc: any, r: any) => ({
      pp: acc.pp + r.ppKg,
      ll: acc.ll + r.llKg,
      filler: acc.filler + r.fillerKg,
      mixture: acc.mixture + r.mixtureKg,
      opening: acc.opening + r.openingStockKg,
      total: acc.total + r.totalMixtureKg,
    }),
    { pp: 0, ll: 0, filler: 0, mixture: 0, opening: 0, total: 0 }
  );

  const wipOutRows = data?.wipOutReport || [];
  const wipOutTotals = wipOutRows.reduce(
    (acc: any, r: any) => ({
      prep: acc.prep + r.totalMixturePrepKg,
      used: acc.used + r.totalMixtureUsedKg,
      scrap: acc.scrap + r.scrapLeftKg,
      wastage: acc.wastage + r.wastageKg,
      remaining: acc.remaining + r.remainingMixtureKg,
    }),
    { prep: 0, used: 0, scrap: 0, wastage: 0, remaining: 0 }
  );

  const renderWipInTable = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
            <th className="py-2.5 px-3 font-bold">S_no</th>
            <th className="py-2.5 px-3 font-bold">Mixture_date</th>
            <th className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">PP (kg)</th>
            <th className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">LL (kg)</th>
            <th className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">FILLER (kg)</th>
            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-200">Mixture (kg)</th>
            <th className="py-2.5 px-3 font-bold text-purple-600 dark:text-purple-400">Opening_stock</th>
            <th className="py-2.5 px-3 font-bold text-slate-900 dark:text-white text-right">Total_mixture</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
          {wipInRows.map((r: any) => (
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
            <td className="py-3 px-3 text-sky-600 dark:text-sky-400">{wipInTotals.pp.toFixed(2)}</td>
            <td className="py-3 px-3 text-indigo-600 dark:text-indigo-400">{wipInTotals.ll.toFixed(2)}</td>
            <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">{wipInTotals.filler.toFixed(2)}</td>
            <td className="py-3 px-3 text-slate-700 dark:text-slate-200">{wipInTotals.mixture.toFixed(2)}</td>
            <td className="py-3 px-3 text-purple-600 dark:text-purple-400">{wipInTotals.opening.toFixed(2)}</td>
            <td className="py-3 px-3 text-right text-slate-900 dark:text-white text-sm">{wipInTotals.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderWipOutTable = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
            <th className="py-2.5 px-3 font-bold">S_no</th>
            <th className="py-2.5 px-3 font-bold">WIP_OUT_Date</th>
            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-200">Total_Mixture_Prep</th>
            <th className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">Total_Mixture_Used</th>
            <th className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">Scrap_left</th>
            <th className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400">Wastage</th>
            <th className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400 text-right">Remaining_Mixture</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
          {wipOutRows.map((r: any) => (
            <tr key={r.sNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{r.sNo}</td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.wipOutDate}</td>
              <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{r.totalMixturePrepKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">{r.totalMixtureUsedKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-amber-600 dark:text-amber-400">{r.scrapLeftKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-rose-600 dark:text-rose-400">{r.wastageKg.toFixed(2)}</td>
              <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                {r.remainingMixtureKg.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 dark:bg-slate-950 font-mono font-bold text-slate-800 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
            <td className="py-3 px-3 uppercase text-slate-500 dark:text-slate-400">Total</td>
            <td className="py-3 px-3"></td>
            <td className="py-3 px-3 text-slate-700 dark:text-slate-200">{wipOutTotals.prep.toFixed(2)}</td>
            <td className="py-3 px-3 text-indigo-600 dark:text-indigo-400">{wipOutTotals.used.toFixed(2)}</td>
            <td className="py-3 px-3 text-amber-600 dark:text-amber-400">{wipOutTotals.scrap.toFixed(2)}</td>
            <td className="py-3 px-3 text-rose-600 dark:text-rose-400">{wipOutTotals.wastage.toFixed(2)}</td>
            <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
              {wipOutTotals.remaining.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Tabs */}
      <DashboardTabs />

      {/* 7 KPI Cards (Matching PDF Page 16 Top) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          title="Today's Prepared"
          value={data?.kpis.todayTotalMixturePrepared ?? 0}
          unit="kg"
          colorScheme="blue"
          subtitle="Mixture prepared today"
        />
        <StatCard
          title="Opening Stock"
          value={data?.kpis.openingStock ?? 0}
          unit="kg"
          colorScheme="slate"
          subtitle="From previous day"
        />
        <StatCard
          title="Wastage"
          value={data?.kpis.wastage ?? 0}
          unit="kg"
          colorScheme="rose"
          subtitle="Total damaged mixture"
        />
        <StatCard
          title="Today's Scrap Used"
          value={data?.kpis.todayScrapUsed ?? 0}
          unit="kg"
          colorScheme="amber"
          subtitle="Reused in today's mix"
        />
        <StatCard
          title="Scrap Left Today"
          value={data?.kpis.scrapLeftToday ?? 0}
          unit="kg"
          colorScheme="amber"
          subtitle="Scrap left in stock"
        />
        <StatCard
          title="Mixture Used Today"
          value={data?.kpis.totalMixtureUsedToday ?? 0}
          unit="kg"
          colorScheme="indigo"
          subtitle="Consumed in FG today"
        />
        <StatCard
          title="Remaining Today"
          value={data?.kpis.remainingMixtureToday ?? 0}
          unit="kg"
          colorScheme="emerald"
          subtitle="Available at end of day"
        />
      </div>

      {/* Visuals Row: Line Chart & Donut Chart (PDF Pages 16-17) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart: Last 7 Days Mixture Preparation */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Last 7 Days Mixture Preparation &amp; Usage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily trend to track performance spikes or inconsistencies
              </p>
            </div>
            <button
              onClick={fetchDashboard}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="h-64 w-full">
            {data?.last7DaysMixture ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.last7DaysMixture} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="mixturePrepared"
                    name="Mixture Prepared (kg)"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mixtureUsed"
                    name="Mixture Used (kg)"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Donut Chart: Total Mixture Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Total Mixture Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Percentage contribution of raw materials (PP, LL, Filler)
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {data?.mixtureBreakdown ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.mixtureBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.mixtureBreakdown.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(val) => [`${val}%`, 'Contribution']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Dual Tables Row: WIP IN (Left) & WIP OUT (Right) matching PDF Pages 17-19 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Table: WIP IN Report */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">WIP In Report Table</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Raw material batch preparation logs</p>
            </div>
            <button
              onClick={() => setFocusWipIn(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-semibold transition"
            >
              <Maximize2 size={13} />
              <span>Focus Mode</span>
            </button>
          </div>
          {renderWipInTable()}
        </div>

        {/* Right Table: WIP OUT Report */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">WIP Out Report Table</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mixture consumption, scrap &amp; remaining stock</p>
            </div>
            <button
              onClick={() => setFocusWipOut(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-semibold transition"
            >
              <Maximize2 size={13} />
              <span>Focus Mode</span>
            </button>
          </div>
          {renderWipOutTable()}
        </div>
      </div>

      {/* Full-Screen Modals for Focus Mode */}
      <TableModal
        isOpen={focusWipIn}
        onClose={() => setFocusWipIn(false)}
        title="WIP IN Report (Focus Mode)"
      >
        {renderWipInTable()}
      </TableModal>

      <TableModal
        isOpen={focusWipOut}
        onClose={() => setFocusWipOut(false)}
        title="WIP OUT Report (Focus Mode)"
      >
        {renderWipOutTable()}
      </TableModal>
    </div>
  );
};
