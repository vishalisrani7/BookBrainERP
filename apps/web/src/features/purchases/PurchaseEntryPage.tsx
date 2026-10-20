import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { ShoppingCart, CheckCircle, AlertCircle, RefreshCw, History, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PurchaseLine {
  materialCode: 'PP' | 'LL' | 'FILLER';
  name: string;
  weightKg: number;
  qtyBags: number;
  pricePerKg: number;
  amount: number;
}

export const PurchaseEntryPage: React.FC = () => {
  const navigate = useNavigate();

  const [meta, setMeta] = useState<{
    nextBillNo: number;
    nextUniqueId: string;
    todayDate: string;
  } | null>(null);

  const [lines, setLines] = useState<PurchaseLine[]>([
    { materialCode: 'PP', name: 'PP (Polypropylene)', weightKg: 0, qtyBags: 0, pricePerKg: 105, amount: 0 },
    { materialCode: 'LL', name: 'LL (Linear Low-density PE)', weightKg: 0, qtyBags: 0, pricePerKg: 98, amount: 0 },
    { materialCode: 'FILLER', name: 'Filler Compound', weightKg: 0, qtyBags: 0, pricePerKg: 45, amount: 0 },
  ]);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  const fetchMeta = () => {
    apiClient<{ nextBillNo: number; nextUniqueId: string; todayDate: string }>('/purchases/next-meta')
      .then((data) => setMeta(data))
      .catch((err) => setErrorMsg(err.message));
  };

  const fetchRecent = () => {
    apiClient<{ rows: any[] }>('/purchases?limit=5')
      .then((data) => setRecentPurchases(data.rows || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMeta();
    fetchRecent();
  }, []);

  const handleWeightChange = (index: number, weightVal: number) => {
    const updated = [...lines];
    const weight = Math.max(0, weightVal);
    const price = updated[index].pricePerKg;
    // Formula from PDF: Qty = Weight / 25
    const qtyBags = Number((weight / 25).toFixed(2));
    // Formula from PDF: Amount = Weight * Price
    const amount = Number((weight * price).toFixed(2));

    updated[index] = { ...updated[index], weightKg: weight, qtyBags, amount };
    setLines(updated);
  };

  const handlePriceChange = (index: number, priceVal: number) => {
    const updated = [...lines];
    const price = Math.max(0, priceVal);
    const weight = updated[index].weightKg;
    const amount = Number((weight * price).toFixed(2));

    updated[index] = { ...updated[index], pricePerKg: price, amount };
    setLines(updated);
  };

  const totalAmount = lines.reduce((sum, item) => sum + item.amount, 0);
  const totalWeight = lines.reduce((sum, item) => sum + item.weightKg, 0);
  const totalBags = lines.reduce((sum, item) => sum + item.qtyBags, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (totalWeight <= 0) {
      setErrorMsg('Please enter a weight greater than 0 for at least one raw material.');
      return;
    }

    setLoading(true);
    try {
      await apiClient('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          billNo: meta?.nextBillNo,
          billDate: meta?.todayDate,
          uniqueId: meta?.nextUniqueId,
          items: lines.map((l) => ({
            materialCode: l.materialCode,
            weightKg: l.weightKg,
            pricePerKg: l.pricePerKg,
          })),
          notes,
        }),
      });

      setSuccessMsg(`Purchase bill #${meta?.nextBillNo} created successfully! Stock updated.`);
      // Reset weights
      setLines([
        { materialCode: 'PP', name: 'PP (Polypropylene)', weightKg: 0, qtyBags: 0, pricePerKg: 105, amount: 0 },
        { materialCode: 'LL', name: 'LL (Linear Low-density PE)', weightKg: 0, qtyBags: 0, pricePerKg: 98, amount: 0 },
        { materialCode: 'FILLER', name: 'Filler Compound', weightKg: 0, qtyBags: 0, pricePerKg: 45, amount: 0 },
      ]);
      setNotes('');
      fetchMeta();
      fetchRecent();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save purchase bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Purchase Card Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-900/40 p-5 text-center relative text-white">
          <h2 className="text-xl font-black text-white tracking-wide">BookBrain Pvt Ltd</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Plot No. 36,37 Sector-C, Behind Padmini Resort, Hatundi Road, Badgaon, Ajmer &bull; Mob.No. 7014638667
          </p>
          <div className="inline-block mt-2 px-4 py-1 rounded-full bg-sky-900/60 border border-sky-700 text-sky-300 text-xs font-bold uppercase tracking-wider">
            Raw Material Purchase Form
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

          {/* Auto-Generated Metadata Fields (Bill No, Bill Date, Unique ID) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Bill No
              </label>
              <input
                type="text"
                readOnly
                value={meta?.nextBillNo ?? '...'}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Bill Date
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
                Unique Id
              </label>
              <input
                type="text"
                readOnly
                value={meta?.nextUniqueId ?? '...'}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sky-600 dark:text-sky-400 text-sm font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Purchase Line Items Table (PDF Page 5) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Item</th>
                  <th className="py-3 px-4 font-bold">Weight(Kg)</th>
                  <th className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">Qty(Bag) [Weight/25]</th>
                  <th className="py-3 px-4 font-bold">Price (₹/Kg)</th>
                  <th className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {lines.map((line, idx) => (
                  <tr key={line.materialCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      {line.materialCode}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">({line.name})</span>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.weightKg === 0 ? '' : line.weightKg}
                        onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-28 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-sky-700 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/20">
                      {line.qtyBags} bags
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.pricePerKg === 0 ? '' : line.pricePerKg}
                        onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right bg-emerald-50/50 dark:bg-emerald-950/10">
                      ₹{line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs md:text-sm">
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 uppercase">Total Invoice Amount</td>
                  <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-300">{totalWeight} kg</td>
                  <td className="py-3.5 px-4 font-mono text-sky-600 dark:text-sky-400">{totalBags} bags</td>
                  <td className="py-3.5 px-4"></td>
                  <td className="py-3.5 px-4 font-mono text-lg text-emerald-600 dark:text-emerald-400 text-right">
                    ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Supplier / Invoice Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Supplier name, truck number, challan reference"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || totalWeight <= 0}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-600/30 text-sm transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Submitting Purchase...</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={16} />
                  <span>Submit Purchase Bill</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Purchases Quick History */}
      {recentPurchases.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-4xl mx-auto shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <History size={14} className="text-sky-500 dark:text-sky-400" />
              Recent Purchase Receipts
            </h3>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              View Full Purchase Report &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-2 px-3">Bill No</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Unique ID</th>
                  <th className="py-2 px-3">PP (kg)</th>
                  <th className="py-2 px-3">LL (kg)</th>
                  <th className="py-2 px-3">Filler (kg)</th>
                  <th className="py-2 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                {recentPurchases.map((p) => {
                  const pp = p.items.find((i: any) => i.materialCode === 'PP')?.weightKg || 0;
                  const ll = p.items.find((i: any) => i.materialCode === 'LL')?.weightKg || 0;
                  const filler = p.items.find((i: any) => i.materialCode === 'FILLER')?.weightKg || 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{p.billNo}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{p.billDate}</td>
                      <td className="py-2 px-3 text-sky-600 dark:text-sky-400">{p.uniqueId}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{pp}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{ll}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{filler}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{p.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
