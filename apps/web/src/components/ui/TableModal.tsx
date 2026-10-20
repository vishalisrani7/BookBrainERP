import React from 'react';
import { ArrowLeft, Maximize2, Minimize2, Download } from 'lucide-react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onExportCsv?: () => void;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col flex-1 overflow-hidden">
        {/* Focus Mode Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border border-sky-300 dark:border-sky-800 dark:hover:bg-sky-900 text-xs font-semibold transition"
            >
              <ArrowLeft size={14} />
              <span>Back to report</span>
            </button>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Maximize2 size={16} className="text-sky-600 dark:text-sky-400" />
              {title}
              <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                Focus Mode (Full Screen)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Exit Focus Mode"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Modal Table Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">{children}</div>
      </div>
    </div>
  );
};
