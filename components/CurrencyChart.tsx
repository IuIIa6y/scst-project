import React, { useState, useEffect } from 'react';
// Corrected XBox to XAxis as XBox is not a valid recharts component
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { fetchHistoricalData } from '../services/currencyService';
import { TimeInterval, ChartDataPoint } from '../types';

interface Props {
  from: string;
  to: string;
}

export const CurrencyChart: React.FC<Props> = ({ from, to }) => {
  const [interval, setInterval] = useState<TimeInterval>('1M');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const historicalData = await fetchHistoricalData(from, to, interval);
        setData(historicalData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [from, to, interval]);

  const intervals: TimeInterval[] = ['1D', '1W', '1M', '3M', '1Y'];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Price Analysis: {from}/{to}</h3>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {intervals.map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${interval === i ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              {/* Added XAxis and YAxis for proper visualization and to resolve unused import warnings */}
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderColor: '#334155', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#0ea5e9' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#0ea5e9" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="text-[10px] text-slate-400 text-right uppercase tracking-widest font-bold">
        Data provided by Frankfurter API
      </div>
    </div>
  );
};
