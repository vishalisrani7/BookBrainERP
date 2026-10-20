import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api-client';
import {
  ShoppingCart,
  Boxes,
  PackageCheck,
  Truck,
  BarChart3,
  Printer,
  FileEdit,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [balances, setBalances] = useState<{
    PP: number;
    LL: number;
    FILLER: number;
    TOTAL_SCRAP: number;
    REMAINING_MIXTURE: number;
  } | null>(null);

  useEffect(() => {
    apiClient<{
      PP: number;
      LL: number;
      FILLER: number;
      TOTAL_SCRAP: number;
      REMAINING_MIXTURE: number;
    }>('/inventory/balances')
      .then((data) => setBalances(data))
      .catch(() => {});
  }, []);

  const navTiles = [
    {
      title: 'Purchase Raw Material',
      subtitle: 'Record raw material receipts and stock updates for PP, LL, and Filler',
      path: '/purchases',
      icon: ShoppingCart,
      color: 'from-blue-600 to-sky-600',
      badge: 'RM PURCHASE',
    },
    {
      title: 'Working Progress Stock (IN)',
      subtitle: 'Batch-wise mixture preparation, opening stock & scrap allocation',
      path: '/wip-in',
      icon: Boxes,
      color: 'from-emerald-600 to-teal-600',
      badge: 'WIP IN',
    },
    {
      title: 'Finish Good Entry',
      subtitle: 'Log daily production pieces, standard weights & mixture consumption',
      path: '/finished-goods',
      icon: PackageCheck,
      color: 'from-indigo-600 to-blue-600',
      badge: 'PRODUCTION',
    },
    {
      title: 'Working Progress Stock (OUT)',
      subtitle: 'Close production batches, log scrap & calculate remaining mixture',
      path: '/wip-out',
      icon: Truck,
      color: 'from-cyan-600 to-blue-700',
      badge: 'WIP OUT',
    },
    {
      title: 'Production Analytics',
      subtitle: 'Real-time management overview, inventory levels & progress charts',
      path: '/dashboards',
      icon: BarChart3,
      color: 'from-purple-600 to-indigo-700',
      badge: 'ANALYTICS',
    },
    {
      title: 'Print Report',
      subtitle: 'View, filter, print and export comprehensive system reports',
      path: '/reports',
      icon: Printer,
      color: 'from-amber-600 to-orange-700',
      badge: 'REPORTS',
    },
    {
      title: 'Data Correction & Edit',
      subtitle: 'Modify, correct or delete wrong purchase, WIP batch or FG entries',
      path: '/edit-records',
      icon: FileEdit,
      color: 'from-rose-600 to-pink-700',
      badge: 'EDIT & AUDIT',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Central Welcome Card */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 border border-sky-800/40 rounded-2xl p-6 md:p-8 shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-700 text-sky-300 text-xs font-semibold mb-3">
              <Sparkles size={14} />
              <span>Central Production Control Panel</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Manufacturing Inventory & WIP Management System
            </h2>
            <p className="text-sm text-slate-200 mt-1 max-w-2xl">
              Welcome to the centralized digital control platform for BookBrain Pvt Ltd. Automating raw material receipts, mixture preparation batches, finished goods tracking, scrap reconciliation, and real-time production analytics.
            </p>
          </div>

          <button
            onClick={() => navigate('/edit-records')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-semibold transition shrink-0 shadow-sm"
          >
            <FileEdit size={16} className="text-sky-400" />
            <span>Data Correction & Edit Center</span>
          </button>
        </div>

        {/* Live Balance Ribbon */}
        {balances && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/10 dark:bg-slate-950/60 border border-white/10 dark:border-slate-800 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-[11px] uppercase font-semibold text-slate-300 dark:text-slate-400">PP Stock</div>
              <div className="text-lg font-bold font-mono text-sky-300 dark:text-sky-400">{balances.PP.toLocaleString()} kg</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-950/60 border border-white/10 dark:border-slate-800 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-[11px] uppercase font-semibold text-slate-300 dark:text-slate-400">LL Stock</div>
              <div className="text-lg font-bold font-mono text-indigo-300 dark:text-indigo-400">{balances.LL.toLocaleString()} kg</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-950/60 border border-white/10 dark:border-slate-800 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-[11px] uppercase font-semibold text-slate-300 dark:text-slate-400">Filler Stock</div>
              <div className="text-lg font-bold font-mono text-emerald-300 dark:text-emerald-400">{balances.FILLER.toLocaleString()} kg</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-950/60 border border-white/10 dark:border-slate-800 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-[11px] uppercase font-semibold text-slate-300 dark:text-slate-400">Total Scrap</div>
              <div className="text-lg font-bold font-mono text-amber-300 dark:text-amber-400">{balances.TOTAL_SCRAP.toLocaleString()} kg</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-950/60 border border-white/10 dark:border-slate-800 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-[11px] uppercase font-semibold text-slate-300 dark:text-slate-400">Remaining Mixture</div>
              <div className="text-lg font-bold font-mono text-purple-300 dark:text-purple-400">{balances.REMAINING_MIXTURE.toLocaleString()} kg</div>
            </div>
          </div>
        )}
      </div>

      {/* 6 Documented Main Navigation Tiles (Matching PDF Page 3) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={18} className="text-sky-600 dark:text-sky-400" />
            Manufacturing Workflow Modules
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Click a module to enter or review transactions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.title}
                onClick={() => navigate(tile.path)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 shadow-sm dark:shadow-lg transition-all duration-300 hover:shadow-sky-500/10 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${tile.color} flex items-center justify-center text-white shadow-md shadow-sky-950/20`}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700 group-hover:border-sky-500/40">
                      {tile.badge}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition">
                    {tile.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {tile.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 mt-6 group-hover:translate-x-1 transition-transform">
                  <span>Open Module</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

  );
};
