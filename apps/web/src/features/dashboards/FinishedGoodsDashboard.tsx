import React, { useEffect, useState } from 'react';
import { DashboardTabs } from './DashboardTabs';
import { StatCard } from '../../components/ui/StatCard';
import { TableModal } from '../../components/ui/TableModal';
import { apiClient } from '../../services/api-client';
import { PackageCheck, Trash2, Calendar, Scale, Maximize2, RefreshCw } from 'lucide-react';
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

const FG_PIE_COLORS = [
  '#38bdf8',
  '#818cf8',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#2dd4bf',
  '#06b6d4',
  '#6366f1',
  '#d946ef',
];

export const FinishedGoodsDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    const query = selectedProduct !== 'ALL' ? `?product=${encodeURIComponent(selectedProduct)}` : '';
    apiClient<any>(`/dashboard/finished-goods${query}`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiClient<any[]>('/products').then((p) => setProducts(p)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedProduct]);

  const overviewRows = data?.overviewTable || [];
  const totals = overviewRows.reduce(
    (acc: any, r: any) => ({
      totalMixture: acc.totalMixture + r.totalMixtureKg,
      pieces: acc.pieces + r.piecesProduced,
      mixtureUsed: acc.mixtureUsed + r.totalMixtureUsedKg,
    }),
    { totalMixture: 0, pieces: 0, mixtureUsed: 0 }
  );

  const renderTableContent = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <th className="py-2.5 px-3 font-bold">S_no</th>
            <th className="py-2.5 px-3 font-bold">FG_Date</th>
            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Total_Mixture(kg)</th>
            <th className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">Finish_Good_Name</th>
            <th className="py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400">Item_Weight(g)</th>
            <th className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">Finish_Good_pieces</th>
            <th className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400 text-right">Total_Mixture_Used (kg)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
          {overviewRows.map((r: any) => (
            <tr key={r.sNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{r.sNo}</td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.fgDate}</td>
              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{r.totalMixtureKg.toFixed(2)}</td>
              <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">{r.productName}</td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.itemWeightGrams}g</td>
              <td className="py-2 px-3 text-indigo-600 dark:text-indigo-300 font-bold">{r.piecesProduced.toLocaleString()}</td>
              <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                {r.totalMixtureUsedKg.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 dark:bg-slate-950 font-mono font-bold text-slate-800 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
            <td className="py-3 px-3 uppercase text-slate-500 dark:text-slate-400">Total</td>
            <td className="py-3 px-3"></td>
            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{totals.totalMixture.toFixed(2)}</td>
            <td className="py-3 px-3"></td>
            <td className="py-3 px-3"></td>
            <td className="py-3 px-3 text-indigo-600 dark:text-indigo-300 text-sm font-bold">
              {totals.pieces.toLocaleString()}
            </td>
            <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
              {totals.mixtureUsed.toFixed(2)}
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

      {/* 4 KPI Cards (Matching PDF Page 20 Top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Finish Goods"
          value={data?.kpis.totalFinishGoods ?? 0}
          unit="pieces"
          icon={PackageCheck}
          colorScheme="blue"
          subtitle="Cumulative count produced to date"
        />
        <StatCard
          title="Today's Scrap"
          value={data?.kpis.todayScrap ?? 0}
          unit="kg"
          icon={Trash2}
          colorScheme="amber"
          subtitle="Generated in current day"
        />
        <StatCard
          title="Today's Finish Goods"
          value={data?.kpis.todayFinishGoods ?? 0}
          unit="pieces"
          icon={Calendar}
          colorScheme="indigo"
          subtitle="Produced in current day"
        />
        <StatCard
          title="Today's Average Mix. Per Piece"
          value={data?.kpis.avgMixPerPieceGrams ?? 0}
          unit="g"
          icon={Scale}
          colorScheme="emerald"
          subtitle="Average mixture consumed per piece"
        />
      </div>

      {/* Product Slicers Buttons matching PDF Page 20 Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Select Product Filter:
          </span>
          <button
            onClick={fetchDashboard}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedProduct('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedProduct === 'ALL'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            ALL PRODUCTS
          </button>
          {products.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedProduct(p.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedProduct === p.name
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Visuals Row: Bar Chart & Pie Chart (PDF Pages 20-21) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Finish Good Type vs Quantity */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Finish Good Type vs Quantity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total pieces produced across product categories</p>
          </div>

          <div className="h-72 w-full">
            {data?.typeVsQuantity ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.typeVsQuantity} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="productName"
                    stroke="#64748b"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="pieces" name="Pieces Produced" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Pie Chart: Mixture Usage % by Item */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Mixture Usage % by Item
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Percentage contribution toward total mixture consumption
            </p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {data?.mixtureUsagePercent ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.mixtureUsagePercent}
                    dataKey="usedKg"
                    nameKey="productName"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {data.mixtureUsagePercent.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={FG_PIE_COLORS[idx % FG_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(val, name, item: any) => [
                      `${val} kg (${item.payload.percentage}%)`,
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', maxHeight: '70px', overflowY: 'auto' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Finish Good Overview Table (PDF Page 21) with Focus Mode */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <PackageCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
              Finish Good Overview Table
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete list of finished goods transactions with total row calculations
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
        title="Finish Good Overview (Focus Mode)"
      >
        {renderTableContent()}
      </TableModal>
    </div>
  );
};
