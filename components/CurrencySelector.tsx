
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Currency } from '../types';
import { CURRENCIES } from '../constants';
import { Star, Search } from './Icons';

interface Props {
  value: string;
  onChange: (code: string) => void;
  favorites: string[];
  onToggleFavorite: (code: string) => void;
  label?: string;
}

export const CurrencySelector: React.FC<Props> = ({ value, onChange, favorites, onToggleFavorite, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = useMemo(() => 
    CURRENCIES.find(c => c.code === value) || CURRENCIES[0],
  [value]);

  const filteredCurrencies = useMemo(() => {
    const search = searchTerm.toLowerCase();
    const list = CURRENCIES.filter(c => 
      c.code.toLowerCase().includes(search) || 
      c.name.toLowerCase().includes(search)
    );
    
    // Sort favorites to top
    return list.sort((a, b) => {
      const aFav = favorites.includes(a.code);
      const bFav = favorites.includes(b.code);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [searchTerm, favorites]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-brand-500 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-brand-600 dark:text-brand-500">{selectedCurrency.code}</span>
          <span className="text-slate-600 dark:text-slate-400 text-sm truncate">{selectedCurrency.name}</span>
        </div>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[400px] flex flex-col">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search currency..."
              className="w-full bg-transparent border-none focus:ring-0 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto custom-scrollbar">
            {filteredCurrencies.map((currency) => (
              <div
                key={currency.code}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                onClick={() => {
                  onChange(currency.code);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${currency.code === value ? 'text-brand-500' : 'text-slate-700 dark:text-slate-200'}`}>
                    {currency.code}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{currency.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(currency.code);
                  }}
                  className={`p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${favorites.includes(currency.code) ? 'text-yellow-400' : 'text-slate-300 group-hover:text-slate-400'}`}
                >
                  <Star className="w-4 h-4" fill={favorites.includes(currency.code) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
