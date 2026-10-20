import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../services/api-client';
import {
  FileEdit,
  Trash2,
  Search,
  RefreshCw,
  ShoppingCart,
  Boxes,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  ArrowUpDown,
  Calendar,
  Hash,
  Scale,
  IndianRupee,
} from 'lucide-react';

type ModuleTab = 'purchases' | 'batches' | 'finished-goods';

interface PurchaseItem {
  materialCode: 'PP' | 'LL' | 'FILLER';
  weightKg: number;
  qtyBags: number;
  pricePerKg: number;
  amount: number;
}

interface PurchaseRecord {
  _id: string;
  billNo: number;
  billDate: string;
  uniqueId: string;
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

interface BatchRecord {
  _id: string;
  batchNo: number;
  batchDate: string;
  ppUsedKg: number;
  llUsedKg: number;
  fillerUsedKg: number;
  newMixtureKg: number;
  openingStockKg: number;
  scrapAddedKg: number;
  totalMixtureKg: number;
  status: string;
  notes?: string;
}

interface FGRecord {
  _id: string;
  serialNo: number;
  fgDate: string;
  batchNo: number;
  productName: string;
  itemWeightGrams: number;
  piecesProduced: number;
  totalMixtureUsedKg: number;
  notes?: string;
}

export const EditRecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModuleTab>('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [fgEntries, setFgEntries] = useState<FGRecord[]>([]);

  // Edit modal states
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [editingFG, setEditingFG] = useState<FGRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deletingItem, setDeletingItem] = useState<{
    type: ModuleTab;
    id: string;
    title: string;
  } | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'purchases') {
        const res = await apiClient<{ rows: PurchaseRecord[] }>('/purchases?limit=100');
        setPurchases(res.rows || []);
      } else if (activeTab === 'batches') {
        const res = await apiClient<{ rows: BatchRecord[] }>('/production?limit=100');
        setBatches(res.rows || []);
      } else if (activeTab === 'finished-goods') {
        const res = await apiClient<{ rows: FGRecord[] }>('/finished-goods?limit=100');
        setFgEntries(res.rows || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  // Handle Purchase Edit Save
  const handleSavePurchase = async () => {
    if (!editingPurchase) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient(`/purchases/${editingPurchase._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          billDate: editingPurchase.billDate,
          uniqueId: editingPurchase.uniqueId,
          notes: editingPurchase.notes,
          items: editingPurchase.items.map((it) => ({
            materialCode: it.materialCode,
            weightKg: Number(it.weightKg) || 0,
            pricePerKg: Number(it.pricePerKg) || 0,
          })),
        }),
      });
      setMessage(`Purchase Bill #${editingPurchase.billNo} updated successfully! Stock balances adjusted.`);
      setEditingPurchase(null);
      fetchRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update purchase');
    } finally {
      setSaving(false);
    }
  };

  // Handle Batch Edit Save
  const handleSaveBatch = async () => {
    if (!editingBatch) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient(`/production/${editingBatch._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          batchDate: editingBatch.batchDate,
          ppUsedKg: Number(editingBatch.ppUsedKg) || 0,
          llUsedKg: Number(editingBatch.llUsedKg) || 0,
          fillerUsedKg: Number(editingBatch.fillerUsedKg) || 0,
          notes: editingBatch.notes,
        }),
      });
      setMessage(`Production Batch #${editingBatch.batchNo} updated successfully! Raw material balances adjusted.`);
      setEditingBatch(null);
      fetchRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update batch');
    } finally {
      setSaving(false);
    }
  };

  // Handle FG Edit Save
  const handleSaveFG = async () => {
    if (!editingFG) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient(`/finished-goods/${editingFG._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fgDate: editingFG.fgDate,
          productName: editingFG.productName,
          piecesProduced: Number(editingFG.piecesProduced) || 0,
          itemWeightGrams: Number(editingFG.itemWeightGrams) || 0,
        }),
      });
      setMessage(`Finished Goods Entry #${editingFG.serialNo} updated successfully!`);
      setEditingFG(null);
      fetchRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update finished goods entry');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    setError(null);
    try {
      let endpoint = '';
      if (deletingItem.type === 'purchases') endpoint = `/purchases/${deletingItem.id}`;
      if (deletingItem.type === 'batches') endpoint = `/production/${deletingItem.id}`;
      if (deletingItem.type === 'finished-goods') endpoint = `/finished-goods/${deletingItem.id}`;

      await apiClient(endpoint, { method: 'DELETE' });
      setMessage(`${deletingItem.title} deleted successfully! Inventories safely reversed.`);
      setDeletingItem(null);
      fetchRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        String(p.billNo).includes(q) ||
        p.billDate.toLowerCase().includes(q) ||
        p.uniqueId.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [purchases, searchTerm]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchTerm.toLowerCase();
      return (
        String(b.batchNo).includes(q) ||
        b.batchDate.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    });
  }, [batches, searchTerm]);

  // Filtered FG
  const filteredFG = useMemo(() => {
    return fgEntries.filter((f) => {
      const q = searchTerm.toLowerCase();
      return (
        String(f.serialNo).includes(q) ||
        String(f.batchNo).includes(q) ||
        f.fgDate.toLowerCase().includes(q) ||
        f.productName.toLowerCase().includes(q)
      );
    });
  }, [fgEntries, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 border border-sky-800/40 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-2">
              <FileEdit size={14} />
              <span>Operational Data Management</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Data Corrections &amp; Edit Center
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Agar kisi operator ne entry karte waqt date, quantity ya weight galat daal diya ho, to aap yaha se records ko modify ya delete kar sakte hain. System inventory balances ko automatically recalculate karta hai.
            </p>
          </div>

          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Message & Error Alerts */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Module Selector Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'purchases'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShoppingCart size={15} />
            <span>Raw Material Purchases</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'batches'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Boxes size={15} />
            <span>WIP Mixture Batches</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finished-goods')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'finished-goods'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <PackageCheck size={15} />
            <span>Finished Goods Production</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records by ID, date, name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Tab 1: Purchases Table */}
      {activeTab === 'purchases' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Raw Material Purchase Entries ({filteredPurchases.length})
            </h3>
            <span className="text-[11px] text-slate-500">Formulas: Bags = Weight/25 | Amount = Weight * Rate</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Unique ID</th>
                  <th className="py-3 px-4">Materials Breakdown</th>
                  <th className="py-3 px-4 text-right">Total Invoice</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No purchase entries found.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">#{p.billNo}</td>
                      <td className="py-3 px-4">{p.billDate}</td>
                      <td className="py-3 px-4 font-mono">{p.uniqueId}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {p.items.map((it) => (
                            <span
                              key={it.materialCode}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono border border-slate-200 dark:border-slate-700"
                            >
                              <strong>{it.materialCode}:</strong> {it.weightKg.toLocaleString()} kg ({it.qtyBags} bags @ ₹{it.pricePerKg})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{p.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingPurchase(JSON.parse(JSON.stringify(p)))}
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition"
                            title="Edit Purchase Record"
                          >
                            <FileEdit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingItem({
                                type: 'purchases',
                                id: p._id,
                                title: `Purchase Bill #${p.billNo} (₹${p.totalAmount})`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition"
                            title="Delete Purchase Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: WIP Batches Table */}
      {activeTab === 'batches' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              WIP Mixture Preparation Batches ({filteredBatches.length})
            </h3>
            <span className="text-[11px] text-slate-500">Formula: New Mixture = PP + LL + FILLER</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">PP Used</th>
                  <th className="py-3 px-4 text-right">LL Used</th>
                  <th className="py-3 px-4 text-right">Filler Used</th>
                  <th className="py-3 px-4 text-right">New Mix</th>
                  <th className="py-3 px-4 text-right">Opening + Scrap</th>
                  <th className="py-3 px-4 text-right">Total Batch Mix</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No production batches found.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{b.batchNo}</td>
                      <td className="py-3 px-4">{b.batchDate}</td>
                      <td className="py-3 px-4 text-right font-mono">{b.ppUsedKg.toLocaleString()} kg</td>
                      <td className="py-3 px-4 text-right font-mono">{b.llUsedKg.toLocaleString()} kg</td>
                      <td className="py-3 px-4 text-right font-mono">{b.fillerUsedKg.toLocaleString()} kg</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-sky-600 dark:text-sky-400">
                        {b.newMixtureKg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        +{(b.openingStockKg + b.scrapAddedKg).toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">
                        {b.totalMixtureKg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingBatch(JSON.parse(JSON.stringify(b)))}
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition"
                            title="Edit Batch Quantities"
                          >
                            <FileEdit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingItem({
                                type: 'batches',
                                id: b._id,
                                title: `Batch #${b.batchNo} (${b.totalMixtureKg} kg)`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition"
                            title="Delete Batch Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Finished Goods Table */}
      {activeTab === 'finished-goods' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Finished Goods Production Output ({filteredFG.length})
            </h3>
            <span className="text-[11px] text-slate-500">Formula: Mix Used = (Pieces * Weight in Grams) / 1000</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Serial No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-right">Std Weight</th>
                  <th className="py-3 px-4 text-right">Pieces Produced</th>
                  <th className="py-3 px-4 text-right">Mixture Consumed</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredFG.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No finished goods entries found.
                    </td>
                  </tr>
                ) : (
                  filteredFG.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">#{f.serialNo}</td>
                      <td className="py-3 px-4">{f.fgDate}</td>
                      <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">Batch #{f.batchNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{f.productName}</td>
                      <td className="py-3 px-4 text-right font-mono">{f.itemWeightGrams}g</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {f.piecesProduced.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                        {f.totalMixtureUsedKg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingFG(JSON.parse(JSON.stringify(f)))}
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition"
                            title="Edit FG Output"
                          >
                            <FileEdit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingItem({
                                type: 'finished-goods',
                                id: f._id,
                                title: `FG #${f.serialNo} (${f.productName} - ${f.piecesProduced} pcs)`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition"
                            title="Delete FG Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PURCHASE RECORD */}
      {/* ========================================================================= */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileEdit size={18} className="text-sky-500" />
                  Edit Purchase Bill #{editingPurchase.billNo}
                </h3>
                <p className="text-xs text-slate-500">Correct bill date, supplier Unique ID, or material weights.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bill Date (DD-MM-YYYY)</label>
                <input
                  type="text"
                  value={editingPurchase.billDate}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, billDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier Unique ID</label>
                <input
                  type="text"
                  value={editingPurchase.uniqueId}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, uniqueId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Purchased Materials (Weights &amp; Rates)
              </label>

              <div className="space-y-2">
                {editingPurchase.items.map((item, idx) => (
                  <div
                    key={item.materialCode}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-3 items-center"
                  >
                    <div>
                      <span className="text-xs font-black text-sky-600 dark:text-sky-400">{item.materialCode}</span>
                      <div className="text-[10px] text-slate-500">Bag: 25 kg</div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Weight (Kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.weightKg}
                        onChange={(e) => {
                          const w = Number(e.target.value) || 0;
                          const updated = [...editingPurchase.items];
                          updated[idx].weightKg = w;
                          updated[idx].qtyBags = Number((w / 25).toFixed(2));
                          updated[idx].amount = Number((w * updated[idx].pricePerKg).toFixed(2));
                          const newTotal = updated.reduce((acc, curr) => acc + curr.amount, 0);
                          setEditingPurchase({ ...editingPurchase, items: updated, totalAmount: newTotal });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Price / Kg (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.pricePerKg}
                        onChange={(e) => {
                          const p = Number(e.target.value) || 0;
                          const updated = [...editingPurchase.items];
                          updated[idx].pricePerKg = p;
                          updated[idx].amount = Number((updated[idx].weightKg * p).toFixed(2));
                          const newTotal = updated.reduce((acc, curr) => acc + curr.amount, 0);
                          setEditingPurchase({ ...editingPurchase, items: updated, totalAmount: newTotal });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs font-bold text-sky-800 dark:text-sky-300">
                <span>Calculated Invoice Total:</span>
                <span className="font-mono text-sm">₹{editingPurchase.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Remarks</label>
              <input
                type="text"
                value={editingPurchase.notes || ''}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, notes: e.target.value })}
                placeholder="Optional correction remarks"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePurchase}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'Updating...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT WIP BATCH */}
      {/* ========================================================================= */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileEdit size={18} className="text-indigo-500" />
                  Edit WIP Batch #{editingBatch.batchNo}
                </h3>
                <p className="text-xs text-slate-500">Modify raw material mixture consumption amounts.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Batch Date (DD-MM-YYYY)</label>
              <input
                type="text"
                value={editingBatch.batchDate}
                onChange={(e) => setEditingBatch({ ...editingBatch, batchDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Mixture Ingredients (Used in Kg)
              </label>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">PP Used (Kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingBatch.ppUsedKg}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      const newMix = v + editingBatch.llUsedKg + editingBatch.fillerUsedKg;
                      const totalMix = newMix + editingBatch.openingStockKg + editingBatch.scrapAddedKg;
                      setEditingBatch({ ...editingBatch, ppUsedKg: v, newMixtureKg: newMix, totalMixtureKg: totalMix });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">LL Used (Kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingBatch.llUsedKg}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      const newMix = editingBatch.ppUsedKg + v + editingBatch.fillerUsedKg;
                      const totalMix = newMix + editingBatch.openingStockKg + editingBatch.scrapAddedKg;
                      setEditingBatch({ ...editingBatch, llUsedKg: v, newMixtureKg: newMix, totalMixtureKg: totalMix });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Filler Used (Kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingBatch.fillerUsedKg}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      const newMix = editingBatch.ppUsedKg + editingBatch.llUsedKg + v;
                      const totalMix = newMix + editingBatch.openingStockKg + editingBatch.scrapAddedKg;
                      setEditingBatch({ ...editingBatch, fillerUsedKg: v, newMixtureKg: newMix, totalMixtureKg: totalMix });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>New Mixture (PP + LL + Filler):</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{editingBatch.newMixtureKg} kg</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Opening Stock + Scrap Added:</span>
                  <span className="font-mono">{editingBatch.openingStockKg + editingBatch.scrapAddedKg} kg</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-indigo-200 dark:border-indigo-800">
                  <span>Total Batch Mixture:</span>
                  <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{editingBatch.totalMixtureKg} kg</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatch}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'Updating...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT FINISHED GOODS RECORD */}
      {/* ========================================================================= */}
      {editingFG && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileEdit size={18} className="text-emerald-500" />
                  Edit FG Output #{editingFG.serialNo}
                </h3>
                <p className="text-xs text-slate-500">Correct product name, pieces produced or standard weight.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingFG(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Production Date</label>
                <input
                  type="text"
                  value={editingFG.fgDate}
                  onChange={(e) => setEditingFG({ ...editingFG, fgDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Batch No</label>
                <input
                  type="text"
                  disabled
                  value={`Batch #${editingFG.batchNo}`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
              <input
                type="text"
                value={editingFG.productName}
                onChange={(e) => setEditingFG({ ...editingFG, productName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pieces Produced</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editingFG.piecesProduced}
                  onChange={(e) => {
                    const pcs = Number(e.target.value) || 0;
                    const mix = Number(((pcs * editingFG.itemWeightGrams) / 1000).toFixed(2));
                    setEditingFG({ ...editingFG, piecesProduced: pcs, totalMixtureUsedKg: mix });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Item Weight (Grams)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editingFG.itemWeightGrams}
                  onChange={(e) => {
                    const wt = Number(e.target.value) || 0;
                    const mix = Number(((editingFG.piecesProduced * wt) / 1000).toFixed(2));
                    setEditingFG({ ...editingFG, itemWeightGrams: wt, totalMixtureUsedKg: mix });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs flex justify-between items-center font-bold text-purple-900 dark:text-purple-300">
              <span>Recalculated Mixture Used:</span>
              <span className="font-mono text-sm">{editingFG.totalMixtureUsedKg} kg</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFG(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFG}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'Updating...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Transaction Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-slate-800 dark:text-slate-200">{deletingItem.title}</strong>?
                This action will automatically reverse any deducted or added stock balances.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
