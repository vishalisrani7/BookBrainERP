import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { Boxes, CheckCircle, AlertCircle, Save, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WipInPage: React.FC = () => {
  const navigate = useNavigate();

  const [meta, setMeta] = useState<{
    nextBatchNo: number;
    todayDate: string;
    stocks: { ppKg: number; llKg: number; fillerKg: number };
    openingStockKg: number;
    scrapInWipKg: number;
    totalScrapKg: number;
  } | null>(null);

  // Form Area A: Mixture Preparation
  const [ppUsed, setPpUsed] = useState<number>(0);
  const [llUsed, setLlUsed] = useState<number>(0);
  const [fillerUsed, setFillerUsed] = useState<number>(0);
  const [batchNotes, setBatchNotes] = useState('');

  // Form Area B: Adding Scrap IN Mixture
  const [scrapInput, setScrapInput] = useState<number>(0);
  const [scrapLoading, setScrapLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentBatches, setRecentBatches] = useState<any[]>([]);

  const fetchMeta = () => {
    apiClient<any>('/production/current-meta')
      .then((data) => setMeta(data))
      .catch((err) => setErrorMsg(err.message));
  };

  const fetchRecent = () => {
    apiClient<{ rows: any[] }>('/production?limit=5')
      .then((data) => setRecentBatches(data.rows || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMeta();
    fetchRecent();
  }, []);

  // Formulas from PDF Page 7:
  // Mixture = Sum of PP, LL and FILLER
  // Total mixture = Sum of mixture, opening stock and scrap
  const newMixture = Number((ppUsed + llUsed + fillerUsed).toFixed(2));
  const openingStock = meta?.openingStockKg || 0;
  const scrapAdded = meta?.scrapInWipKg || 0;
  const totalMixture = Number((newMixture + openingStock + scrapAdded).toFixed(2));

  // Area B: Save Scrap (allocate from Total Scrap to Scrap in WIP)
  const handleSaveScrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (scrapInput <= 0) {
      setErrorMsg('Please enter a scrap quantity greater than 0.');
      return;
    }

    if (meta && scrapInput > meta.totalScrapKg) {
      setErrorMsg(`Cannot allocate ${scrapInput} kg. Total available scrap is only ${meta.totalScrapKg} kg.`);
      return;
    }

    setScrapLoading(true);
    try {
      await apiClient('/scrap/allocate', {
        method: 'POST',
        body: JSON.stringify({ scrapInWipKg: scrapInput }),
      });
      setSuccessMsg(`Successfully allocated ${scrapInput} kg scrap into WIP mixture preparation!`);
      setScrapInput(0);
      fetchMeta();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to allocate scrap');
    } finally {
      setScrapLoading(false);
    }
  };

  // Area A: Submit Mixture Preparation
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newMixture <= 0 && openingStock <= 0 && scrapAdded <= 0) {
      setErrorMsg('Please enter valid quantities for PP, LL, or Filler to prepare mixture.');
      return;
    }

    if (meta) {
      if (ppUsed > meta.stocks.ppKg) {
        setErrorMsg(`Insufficient PP stock. Available: ${meta.stocks.ppKg} kg, Entered: ${ppUsed} kg`);
        return;
      }
      if (llUsed > meta.stocks.llKg) {
        setErrorMsg(`Insufficient LL stock. Available: ${meta.stocks.llKg} kg, Entered: ${llUsed} kg`);
        return;
      }
      if (fillerUsed > meta.stocks.fillerKg) {
        setErrorMsg(`Insufficient Filler stock. Available: ${meta.stocks.fillerKg} kg, Entered: ${fillerUsed} kg`);
        return;
      }
    }

    setLoading(true);
    try {
      await apiClient('/production', {
        method: 'POST',
        body: JSON.stringify({
          batchNo: meta?.nextBatchNo,
          batchDate: meta?.todayDate,
          ppUsedKg: ppUsed,
          llUsedKg: llUsed,
          fillerUsedKg: fillerUsed,
          notes: batchNotes,
        }),
      });

      setSuccessMsg(`Production Batch #${meta?.nextBatchNo} created with Total Mixture: ${totalMixture} kg!`);
      setPpUsed(0);
      setLlUsed(0);
      setFillerUsed(0);
      setBatchNotes('');
      fetchMeta();
      fetchRecent();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create mixture batch');
    } finally {
      setLoading(false);
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

      {/* Main Container matching PDF Page 6 WIP Stock IN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-sky-950 border-b border-teal-800/40 p-5 text-center text-white">
          <h2 className="text-xl font-black text-white tracking-wide">BookBrain Pvt Ltd</h2>
          <div className="inline-block mt-1 px-4 py-1 rounded-full bg-teal-900/60 border border-teal-700 text-teal-300 text-xs font-bold uppercase tracking-wider">
            WIP Stock IN
          </div>
        </div>

        {/* Top 3 Material Stock Badges (PDF Page 6 Top) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-500/30 rounded-xl p-3 text-center shadow-inner">
            <span className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Total PP in kg</span>
            <div className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
              {meta ? meta.stocks.ppKg.toLocaleString() : '...'} kg
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-500/30 rounded-xl p-3 text-center shadow-inner">
            <span className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Total LL in kg</span>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {meta ? meta.stocks.llKg.toLocaleString() : '...'} kg
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/30 rounded-xl p-3 text-center shadow-inner">
            <span className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Total FILLER in kg</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {meta ? meta.stocks.fillerKg.toLocaleString() : '...'} kg
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="px-6 pt-4">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Dual Layout: Area B (Left) and Area A (Right) matching PDF Page 6 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* AREA B: Adding Scrap IN Mixture (Left Side) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  Area B — Adding Scrap IN Mixture
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Deduct from accumulated scrap and assign to mixture preparation.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3">
                  <span className="text-[11px] uppercase font-semibold text-slate-600 dark:text-slate-400">Total Scrap Available</span>
                  <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                    {meta ? meta.totalScrapKg.toLocaleString() : '...'} kg
                  </div>
                  <span className="text-[10px] text-slate-500">From previous WIP OUT dispatches</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scrap in WIP (kg to use)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={scrapInput === 0 ? '' : scrapInput}
                    onChange={(e) => setScrapInput(parseFloat(e.target.value) || 0)}
                    placeholder="Enter scrap kg"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">Scrap in WIP Buffer</div>
                  <div className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400">
                    {meta?.scrapInWipKg.toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-teal-600 dark:text-teal-500/80 mt-0.5">Ready to be added to next mixture batch</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={handleSaveScrap}
                disabled={scrapLoading || scrapInput <= 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-900/30 transition disabled:opacity-50"
              >
                {scrapLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Scrap</span>
              </button>
            </div>
          </div>

          {/* AREA A: Mixture Preparation (Right Side) */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Area A — Mixture Preparation
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Prepare new batch using raw materials & carry-forwards.</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700">
                  S NO: {meta?.nextBatchNo ?? '...'}
                </span>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Date: {meta?.todayDate}</div>
              </div>
            </div>

            <form onSubmit={handleSubmitBatch} className="space-y-4">
              {/* 3 Material Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    PP (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ppUsed === 0 ? '' : ppUsed}
                    onChange={(e) => setPpUsed(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    LL (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={llUsed === 0 ? '' : llUsed}
                    onChange={(e) => setLlUsed(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Filler (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={fillerUsed === 0 ? '' : fillerUsed}
                    onChange={(e) => setFillerUsed(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mixture Calculation Display Grid (PDF Page 6 Table) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">New Mixture</span>
                  <div className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400">{newMixture} kg</div>
                  <span className="text-[9px] text-slate-500">PP + LL + Filler</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Opening Stock</span>
                  <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">{openingStock} kg</div>
                  <span className="text-[9px] text-slate-500">From prev WIP OUT</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Scrap Added</span>
                  <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">{scrapAdded} kg</div>
                  <span className="text-[9px] text-slate-500">From Scrap in WIP</span>
                </div>

                <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-lg p-1.5 text-center">
                  <span className="text-[10px] uppercase font-black text-sky-700 dark:text-sky-300">Total Mixture</span>
                  <div className="text-base font-black font-mono text-sky-900 dark:text-white">{totalMixture} kg</div>
                  <span className="text-[9px] text-sky-600 dark:text-sky-400">Sum of All</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Batch Notes (Optional)
                </label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="e.g. Morning shift batch #1"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || totalMixture <= 0}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-600/30 text-xs transition transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Boxes size={14} />}
                  <span>Submit Batch Mixture</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Historical WIP IN Batches Table */}
      {recentBatches.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-5xl mx-auto shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <Layers size={14} className="text-teal-600 dark:text-teal-400" />
              Recent Mixture Preparation Batches
            </h3>
            <button
              onClick={() => navigate('/dashboards/wip-progress')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              View in WIP Progress Dashboard &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3">Batch S_No</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">PP (kg)</th>
                  <th className="py-2 px-3">LL (kg)</th>
                  <th className="py-2 px-3">Filler (kg)</th>
                  <th className="py-2 px-3">New Mix (kg)</th>
                  <th className="py-2 px-3">Opening (kg)</th>
                  <th className="py-2 px-3">Scrap (kg)</th>
                  <th className="py-2 px-3 text-right">Total Mixture</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {recentBatches.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{b.batchNo}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{b.batchDate}</td>
                    <td className="py-2 px-3 text-sky-600 dark:text-sky-400">{b.ppUsedKg}</td>
                    <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">{b.llUsedKg}</td>
                    <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">{b.fillerUsedKg}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{b.newMixtureKg}</td>
                    <td className="py-2 px-3 text-purple-600 dark:text-purple-400">{b.openingStockKg}</td>
                    <td className="py-2 px-3 text-amber-600 dark:text-amber-400">{b.scrapAddedKg}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{b.totalMixtureKg} kg</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          b.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
