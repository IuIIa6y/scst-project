
import React, { useState } from 'react';
import { PriceAlert } from '../types';
import { CURRENCIES } from '../constants';
import { Bell, Plus, Trash } from './Icons';

interface Props {
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'isActive'>) => void;
  onDeleteAlert: (id: string) => void;
}

export const AlertsTab: React.FC<Props> = ({ alerts, onAddAlert, onDeleteAlert }) => {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [value, setValue] = useState(0.9);
  const [condition, setCondition] = useState<PriceAlert['condition']>('greater');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAlert({ fromCurrency: from, toCurrency: to, targetValue: value, condition });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-brand-500" />
        <h3 className="text-lg font-bold">Price Alerts</h3>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Pair</label>
            <div className="flex items-center gap-2">
              <select 
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-brand-500"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
              <span className="text-slate-400">/</span>
              <select 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-brand-500"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Condition</label>
            <select 
              value={condition} 
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-brand-500"
            >
              <option value="greater">Greater than (&gt;)</option>
              <option value="less">Less than (&lt;)</option>
              <option value="equal">Equal to (=)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Target Value</label>
            <input 
              type="number" 
              step="0.0001"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value))}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Alert
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group shadow-sm">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                {alert.fromCurrency}/{alert.toCurrency}
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${alert.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {alert.isActive ? 'Active' : 'Triggered'}
                </span>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {alert.condition === 'greater' ? '>' : alert.condition === 'less' ? '<' : '='} {alert.targetValue}
              </div>
            </div>
            <button 
              onClick={() => onDeleteAlert(alert.id)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400">Set alerts to get notified when rates hit your target.</p>
          </div>
        )}
      </div>
    </div>
  );
};
