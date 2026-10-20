import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { PackageCheck, CheckCircle, AlertTriangle, AlertCircle, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  _id: string;
  name: string;
  weightGrams: number;
}

export const FinishedGoodsPage: React.FC = () => {
  const navigate = useNavigate();

  const [meta, setMeta] = useState<{
    nextSerialNo: number;
    todayDate: string;
    activeBatch: {
      batchNo: number;
      batchDate: string;
      totalMixtureKg: number;
      alreadyUsedKg: number;
      availableMixtureKg: number;
    } | null;
  } | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [itemWeight, setItemWeight] = useState<number>(0);
  const [pieces, setPieces] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  const fetchMeta = () => {
    apiClient<any>('/finished-goods/next-meta')
      .then((data) => setMeta(data))
      .catch((err) => setErrorMsg(err.message));
  };

  const fetchProducts = () => {
    apiClient<Product[]>('/products')
      .then((data) => {
        setProducts(data);
        if (data.length > 0 && !selectedProduct) {
          setSelectedProduct(data[0].name);
          setItemWeight(data[0].weightGrams);
        }
      })
      .catch(() => {});
  };

  const fetchRecent = () => {
    apiClient<{ rows: any[] }>('/finished-goods?limit=5')
      .then((data) => setRecentEntries(data.rows || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMeta();
    fetchProducts();
    fetchRecent();
  }, []);

  const handleProductChange = (prodName: string) => {
    setSelectedProduct(prodName);
    const found = products.find((p) => p.name === prodName);
    if (found) {
      setItemWeight(found.weightGrams);
    }
  };

  // Formula from PDF Page 9:
  // Total mixture used = (Finish good pieces * Item weight) / 1000
  const totalMixtureUsed = Number(((pieces * itemWeight) / 1000).toFixed(2));
  const availableMixture = meta?.activeBatch?.availableMixtureKg || 0;
  const isOverconsuming = totalMixtureUsed > availableMixture && availableMixture > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!meta?.activeBatch) {
      setErrorMsg('No active production batch found. Please prepare a WIP IN batch first.');
      return;
    }

    if (pieces <= 0) {
      setErrorMsg('Please enter a valid count of finished goods pieces produced.');
      return;
    }

    if (totalMixtureUsed > meta.activeBatch.availableMixtureKg) {
      setErrorMsg(
        `Warning: Total mixture required (${totalMixtureUsed} kg) exceeds available batch mixture (${meta.activeBatch.availableMixtureKg} kg)!`
      );
      return;
    }

    setLoading(true);
    try {
      await apiClient('/finished-goods', {
        method: 'POST',
        body: JSON.stringify({
          serialNo: meta.nextSerialNo,
          fgDate: meta.todayDate,
          batchNo: meta.activeBatch.batchNo,
          productName: selectedProduct,
          itemWeightGrams: itemWeight,
          piecesProduced: pieces,
        }),
      });

      setSuccessMsg(
        `Finished goods entry recorded! Produced ${pieces} pieces of ${selectedProduct} consuming ${totalMixtureUsed} kg mixture.`
      );
      setPieces(0);
      fetchMeta();
      fetchRecent();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to record finished goods');
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

      {/* Main Finished Goods Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 border-b border-indigo-900/40 p-5 text-center text-white">
          <h2 className="text-xl font-black text-white tracking-wide">BookBrain Pvt Ltd</h2>
          <div className="inline-block mt-1 px-4 py-1 rounded-full bg-indigo-900/60 border border-indigo-700 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            Finished Goods Production Form
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

          {/* Active Batch Summary Banner */}
          {meta?.activeBatch ? (
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-indigo-200 dark:border-indigo-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Active Production Batch #{meta.activeBatch.batchNo}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Batch Date: {meta.activeBatch.batchDate} &bull; Total Mixture Prepared:{' '}
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{meta.activeBatch.totalMixtureKg} kg</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Consumed So Far</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">{meta.activeBatch.alreadyUsedKg} kg</div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-right">
                  <div className="text-sky-600 dark:text-sky-400 text-[10px] uppercase font-bold">Available In Batch</div>
                  <div className="font-bold text-sky-700 dark:text-sky-300 text-base">{meta.activeBatch.availableMixtureKg} kg</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <div>
                <span className="font-bold">No Active WIP Batch Found!</span> Please go to{' '}
                <button
                  type="button"
                  onClick={() => navigate('/wip-in')}
                  className="underline font-bold text-amber-700 dark:text-amber-200"
                >
                  WIP Stock IN
                </button>{' '}
                to prepare a mixture batch before logging finished goods.
              </div>
            </div>
          )}

          {/* Metadata Bar (S No, Date, Total Mixture Prep) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                S NO
              </label>
              <input
                type="text"
                readOnly
                value={meta?.nextSerialNo ?? '...'}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="text"
                readOnly
                value={meta?.todayDate ?? '...'}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Total Mixture Preparation
              </label>
              <input
                type="text"
                readOnly
                value={meta?.activeBatch ? `${meta.activeBatch.totalMixtureKg} kg` : '0 kg'}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400 text-sm font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Input Grid (Product Name, Item Weight, Pieces, Total Mixture Used) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Finish Good Name (Select from Catalogue)
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.weightGrams}g)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Item Weight (grams per piece)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={itemWeight}
                onChange={(e) => setItemWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Finish Goods Pieces Produced
              </label>
              <input
                type="number"
                min="0"
                value={pieces === 0 ? '' : pieces}
                onChange={(e) => setPieces(parseInt(e.target.value, 10) || 0)}
                placeholder="Enter piece count (e.g. 5000)"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sky-600 dark:text-sky-400 mb-1.5">
                Total Mixture Used (kg) [(Pieces &times; Weight)/1000]
              </label>
              <div className="w-full px-3.5 py-2.5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl text-sky-700 dark:text-sky-300 font-mono font-bold text-base flex items-center justify-between">
                <span>{totalMixtureUsed} kg</span>
                <span className="text-[11px] font-normal text-sky-600 dark:text-sky-400/80">Auto-Calculated</span>
              </div>
            </div>
          </div>

          {/* Documented Warning Box (PDF Page 9 Note: "Warning box will be generated if total mixture is less than mixture used") */}
          {isOverconsuming && (
            <div className="p-4 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3 animate-pulse">
              <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-800 dark:text-amber-300 uppercase">Warning Notice:</span> Total mixture required
                ({totalMixtureUsed} kg) is GREATER than available mixture in this batch ({availableMixture} kg)!
                Consumption cannot exceed available mixture stock.
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || pieces <= 0 || !meta?.activeBatch || isOverconsuming}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold shadow-lg shadow-indigo-600/30 text-sm transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Submitting Entry...</span>
                </>
              ) : (
                <>
                  <PackageCheck size={16} />
                  <span>Submit Finish Good Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Finished Goods History Table */}
      {recentEntries.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-4xl mx-auto shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <Layers size={14} className="text-indigo-600 dark:text-indigo-400" />
              Recent Finished Goods Production Records
            </h3>
            <button
              onClick={() => navigate('/dashboards')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              View in Finish Goods Dashboard &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3">S_No</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Batch</th>
                  <th className="py-2 px-3">Product Name</th>
                  <th className="py-2 px-3">Weight (g)</th>
                  <th className="py-2 px-3">Pieces</th>
                  <th className="py-2 px-3 text-right">Mixture Used (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {recentEntries.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{e.serialNo}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{e.fgDate}</td>
                    <td className="py-2 px-3 text-sky-600 dark:text-sky-400">Batch #{e.batchNo}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{e.productName}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{e.itemWeightGrams}g</td>
                    <td className="py-2 px-3 text-indigo-600 dark:text-indigo-300">{e.piecesProduced.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {e.totalMixtureUsedKg} kg
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
