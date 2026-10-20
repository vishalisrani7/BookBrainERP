import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { DatabaseZap, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MigrationPage: React.FC = () => {
  const navigate = useNavigate();

  const [seeding, setSeeding] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReconcile = () => {
    setReconciling(true);
    apiClient<any>('/migration/reconcile')
      .then((data) => setReconcileResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setReconciling(false));
  };

  useEffect(() => {
    fetchReconcile();
  }, []);

  const handleSeedHistorical = async () => {
    if (!confirm('This will load verified historical baseline batches (11 batches from 16-07-2025 to 18-07-2025). Continue?')) {
      return;
    }

    setSeeding(true);
    setMessage(null);
    setError(null);

    try {
      const res = await apiClient<any>('/migration/seed-historical', { method: 'POST' });
      setMessage('Historical batches successfully imported! Audit balances verified.');
      fetchReconcile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Seed & Reconcile Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
              <DatabaseZap size={14} />
              <span>Historical Legacy Migration</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Legacy Data Import &amp; Reconciliation Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Inspects historical manufacturing batches (PP: 9,590 kg, LL: 7,840 kg, Filler: 5,260 kg, Total Mixture: 22,690 kg, FG: 93,569+ pieces) and performs real-time mathematical integrity checks.
            </p>
          </div>

          <button
            onClick={handleSeedHistorical}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {seeding ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Importing Historical Batches...</span>
              </>
            ) : (
              <>
                <DatabaseZap size={14} />
                <span>Import Historical Batches</span>
              </>
            )}
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Reconciliation Report Card */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
              Automated Mathematical Reconciliation Status
            </h3>
            <button
              onClick={fetchReconcile}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
            >
              <RefreshCw size={12} className={reconciling ? 'animate-spin' : ''} />
              <span>Re-check Parity</span>
            </button>
          </div>

          {reconcileResult ? (
            <div className="space-y-6">
              {/* Material Balances Reconciled Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-bold">Raw Material</th>
                      <th className="py-2.5 px-4 font-bold">Total Purchased (kg)</th>
                      <th className="py-2.5 px-4 font-bold">Consumed in Mix (kg)</th>
                      <th className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">Theoretical Stock (kg)</th>
                      <th className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">Actual Ledger Stock (kg)</th>
                      <th className="py-2.5 px-4 font-bold text-right">Variance / Discrepancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                    {['PP', 'LL', 'FILLER'].map((code) => {
                      const m = reconcileResult.materials[code];
                      return (
                        <tr key={code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {code}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{m?.purchasedKg.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{m?.consumedKg.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-sky-600 dark:text-sky-400 font-bold">{m?.theoreticalBalanceKg.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">{m?.actualBalanceKg.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right">
                            {m?.discrepancyKg === 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold">
                                0 kg (MATCHED)
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800 font-bold">
                                {m?.discrepancyKg} kg
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mixture and Scrap Reconciliation Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase text-sky-600 dark:text-sky-400 tracking-wider mb-2">
                    Mixture Accounting
                  </h4>
                  <div className="space-y-1.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Total Mixture Prepared:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{reconcileResult.mixture.totalPreparedKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Total Consumed in Finished Goods:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{reconcileResult.mixture.totalConsumedInFGKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Latest Active Remaining Mixture:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{reconcileResult.mixture.latestRemainingKg} kg</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider mb-2">
                    Scrap &amp; Wastage Accounting
                  </h4>
                  <div className="space-y-1.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Total Scrap Generated (WIP OUT):</span>
                      <span className="font-bold text-slate-900 dark:text-white">{reconcileResult.scrapAndWastage.totalScrapGeneratedKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Current Stock Scrap in Ledger:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{reconcileResult.scrapAndWastage.inventoryTotalScrapKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Total Wastage Recorded:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">{reconcileResult.scrapAndWastage.totalWastageKg} kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              Loading reconciliation state...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
