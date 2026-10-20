import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { Truck, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Layers, ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WipOutPage: React.FC = () => {
  const navigate = useNavigate();

  const [meta, setMeta] = useState<{
    nextSerialNo: number;
    todayDate: string;
    activeBatch: {
      batchNo: number;
      batchDate: string;
      totalMixturePrepKg: number;
      totalMixtureUsedKg: number;
      remainingMixtureKg: number;
    } | null;
  } | null>(null);

  const [scrapLeft, setScrapLeft] = useState<number>(0);
  const [wastage, setWastage] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentClosings, setRecentClosings] = useState<any[]>([]);

  const fetchMeta = () => {
    apiClient<any>('/wip-out/next-meta')
      .then((data) => setMeta(data))
      .catch((err) => setErrorMsg(err.message));
  };

  const fetchRecent = () => {
    apiClient<{ rows: any[] }>('/wip-out?limit=5')
      .then((data) => setRecentClosings(data.rows || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMeta();
    fetchRecent();
  }, []);

  // Formula from PDF Page 10:
  // Remaining mixture = Total mixture preparation - Total mixture used
  const totalPrep = meta?.activeBatch?.totalMixturePrepKg || 0;
  const totalUsed = meta?.activeBatch?.totalMixtureUsedKg || 0;
  const remainingMixture = Number((totalPrep - totalUsed).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!meta?.activeBatch) {
      setErrorMsg('No active production batch found to close.');
      return;
    }

    setLoading(true);
    try {
      await apiClient('/wip-out', {
        method: 'POST',
        body: JSON.stringify({
          serialNo: meta.nextSerialNo,
          wipOutDate: meta.todayDate,
          batchNo: meta.activeBatch.batchNo,
          scrapLeftKg: scrapLeft,
          wastageKg: wastage,
        }),
      });

      setSuccessMsg(
        `Batch #${meta.activeBatch.batchNo} closed successfully! Remaining mixture (${remainingMixture} kg) carried forward to next opening stock. Scrap (${scrapLeft} kg) added to total scrap.`
      );
      setScrapLeft(0);
      setWastage(0);
      fetchMeta();
      fetchRecent();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to record WIP OUT');
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

      {/* Main Form matching PDF Page 10 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border-b border-cyan-800/40 p-5 text-center text-white">
          <h2 className="text-xl font-black text-white tracking-wide">BookBrain Pvt Ltd</h2>
          <div className="inline-block mt-1 px-4 py-1 rounded-full bg-cyan-900/60 border border-cyan-700 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            WIP Stock Out
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Batch Indicator */}
          {meta?.activeBatch ? (
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-cyan-200 dark:border-cyan-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Ready to Close Production Batch #{meta.activeBatch.batchNo}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Batch Date: {meta.activeBatch.batchDate} &bull; Total Prepared:{' '}
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{meta.activeBatch.totalMixturePrepKg} kg</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700">
                  S NO: {meta.nextSerialNo}
                </span>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Date: {meta.todayDate}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs text-center">
              No open production batches requiring WIP OUT closing.
            </div>
          )}

          {/* Mixture Closing Metrics Table (PDF Page 10) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Total Mixture Preparation</th>
                  <th className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">Total Mixture Used</th>
                  <th className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">Scrap Left In Stock (kg)</th>
                  <th className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">Wastage (kg)</th>
                  <th className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-right">Remaining Mixture (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white dark:bg-slate-900/60 font-mono">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-base">
                    {totalPrep} kg
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-300 text-base">
                    {totalUsed} kg
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={scrapLeft === 0 ? '' : scrapLeft}
                      onChange={(e) => setScrapLeft(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-28 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-amber-600 dark:text-amber-300 font-mono text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={wastage === 0 ? '' : wastage}
                      onChange={(e) => setWastage(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-28 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-rose-600 dark:text-rose-300 font-mono text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-right text-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                    {remainingMixture} kg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Automation Logic Callout (PDF Page 10 items 9 & 10) */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <div className="font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <ArrowRightCircle size={14} />
              <span>Automated Carry-Forward Rules:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
              <li>
                <span className="font-medium text-slate-800 dark:text-slate-200">Remaining Mixture ({remainingMixture} kg)</span> will automatically carry forward into the <span className="text-purple-600 dark:text-purple-400 font-semibold">Opening Stock (WIP_IN)</span> of the next batch.
              </li>
              <li>
                <span className="font-medium text-slate-800 dark:text-slate-200">Scrap Left ({scrapLeft} kg)</span> will be recorded in the scrap ledger and automatically add to <span className="text-amber-600 dark:text-amber-400 font-semibold">Total Scrap (WIP_IN)</span>.
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !meta?.activeBatch}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-600/30 text-sm transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Closing WIP Batch...</span>
                </>
              ) : (
                <>
                  <Truck size={16} />
                  <span>Submit WIP Stock Out</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent WIP OUT Closings Table */}
      {recentClosings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-4xl mx-auto shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <Layers size={14} className="text-cyan-600 dark:text-cyan-400" />
              Recent WIP OUT Closing Dispatches
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
                  <th className="py-2 px-3">S_No</th>
                  <th className="py-2 px-3">WIP OUT Date</th>
                  <th className="py-2 px-3">Batch</th>
                  <th className="py-2 px-3">Total Prep (kg)</th>
                  <th className="py-2 px-3">Total Used (kg)</th>
                  <th className="py-2 px-3">Scrap Left (kg)</th>
                  <th className="py-2 px-3">Wastage (kg)</th>
                  <th className="py-2 px-3 text-right">Remaining Mixture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {recentClosings.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{c.serialNo}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{c.wipOutDate}</td>
                    <td className="py-2 px-3 text-sky-600 dark:text-sky-400">Batch #{c.batchNo}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{c.totalMixturePrepKg}</td>
                    <td className="py-2 px-3 text-indigo-600 dark:text-indigo-300">{c.totalMixtureUsedKg}</td>
                    <td className="py-2 px-3 text-amber-600 dark:text-amber-400">{c.scrapLeftKg}</td>
                    <td className="py-2 px-3 text-rose-600 dark:text-rose-400">{c.wastageKg}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {c.remainingMixtureKg} kg
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
