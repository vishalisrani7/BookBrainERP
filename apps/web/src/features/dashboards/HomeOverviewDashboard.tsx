import React, { useEffect, useState } from 'react';
import { DashboardTabs } from './DashboardTabs';
import { StatCard } from '../../components/ui/StatCard';
import { apiClient } from '../../services/api-client';
import { Trash2, Flame, Layers, PackageCheck, Filter, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const HomeOverviewDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (selectedItem !== 'ALL') query.append('itemName', selectedItem);
    if (selectedYear !== 'ALL') query.append('year', selectedYear);

    apiClient<any>(`/dashboard/home-overview?${query.toString()}`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiClient<any[]>('/products').then((p) => setProducts(p)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedItem, selectedYear]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top 4 Dashboard Navigation Tabs */}
      <DashboardTabs />

      {/* Slicers Header Bar matching PDF Page 11 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            Home Overview Dashboard
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Slicer: Item_Name */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Item Filter:</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Items</option>
              {products.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Slicer: Year */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <button
            onClick={fetchDashboard}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4 KPI Cards (Matching PDF Page 11 Top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scrap"
          value={data?.kpis.totalScrap ?? 0}
          unit="kg"
          icon={Trash2}
          colorScheme="amber"
          subtitle="Total scrap recorded from WIP out"
        />
        <StatCard
          title="Wastage"
          value={data?.kpis.wastage ?? 0}
          unit="kg"
          icon={Flame}
          colorScheme="rose"
          subtitle="Total mixture wastage recorded"
        />
        <StatCard
          title="Remaining Mixture"
          value={data?.kpis.remainingMixture ?? 0}
          unit="kg"
          icon={Layers}
          colorScheme="blue"
          subtitle="Current stock of usable mixture"
        />
        <StatCard
          title="Total Finish Goods"
          value={data?.kpis.totalFinishGoods ?? 0}
          unit="pieces"
          icon={PackageCheck}
          colorScheme="emerald"
          subtitle="Cumulative count of all finished goods"
        />
      </div>

      {/* Visuals Grid: 2 Power BI Charts (PDF Page 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Total Mixture vs Used Mixture */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Total Mixture Prepared vs. Used Mixture
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison of mixture prepared vs consumed across batches (kg)
            </p>
          </div>

          <div className="h-72 w-full">
            {data?.mixtureVsUsedChart && data.mixtureVsUsedChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mixtureVsUsedChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                  <XAxis dataKey="batchNo" stroke="#64748b" tickFormatter={(v) => `B#${v}`} />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="preparedKg" name="Mixture Prepared (kg)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="usedKg" name="Mixture Used in FG (kg)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                No batch transactions found.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Quantity-by-Step Waterfall/Step Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              7 Days Mixture Utilization Flow (Step by Step)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prepared &bull; Used in FG &bull; Remaining &bull; Scrap &bull; Wastage (kg)
            </p>
          </div>

          <div className="h-72 w-full">
            {data?.quantityByStepChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.quantityByStepChart} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis type="category" dataKey="step" stroke="#64748b" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="value" name="Quantity (kg)" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                No step metrics available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
