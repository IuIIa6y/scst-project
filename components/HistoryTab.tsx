
import React, { useMemo } from 'react';
import { HistoryItem } from '../types';
import { Download, Trash, ArrowRightLeft } from './Icons';

interface Props {
  history: HistoryItem[];
  onClear: () => void;
  onRepeat: (item: HistoryItem) => void;
}

export const HistoryTab: React.FC<Props> = ({ history, onClear, onRepeat }) => {
  const exportToCSV = () => {
    if (history.length === 0) return;
    const headers = ['Date', 'From', 'To', 'Amount', 'Result', 'Rate'];
    const rows = history.map(h => [
      new Date(h.timestamp).toLocaleString(),
      h.fromCurrency,
      h.toCurrency,
      h.amount.toFixed(2),
      h.result.toFixed(2),
      h.rate.toFixed(4)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SCST_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedHistory = useMemo(() => {
    // Ensuring strict descending order by timestamp
    return [...history].sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-brand-500" />
          Conversion History
        </h3>
        <div className="flex gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-brand-500 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={onClear}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
              >
                <Trash className="w-4 h-4" />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {sortedHistory.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Conversion</th>
                  <th className="px-6 py-4">Total Result</th>
                  <th className="px-6 py-4">Exchange Rate</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium">
                        <span className="text-slate-900 dark:text-slate-100">{item.amount.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-bold ml-1">{item.fromCurrency}</span>
                        <ArrowRightLeft className="w-3 h-3 mx-2 text-slate-300" />
                        <span className="text-xs text-slate-400 font-bold">{item.toCurrency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-brand-600 dark:text-brand-500">
                      {item.result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      1 {item.fromCurrency} = {item.rate.toFixed(4)} {item.toCurrency}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onRepeat(item)}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white rounded-md text-[10px] font-bold uppercase transition-all"
                      >
                        Re-run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <HistoryIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm">No historical data found. Try converting some currencies!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Internal icon for HistoryTab as the import was conflicting with component name
const HistoryIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);
