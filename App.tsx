
import React, { useState, useEffect, useCallback } from 'react';
import { CurrencySelector } from './components/CurrencySelector';
import { CurrencyChart } from './components/CurrencyChart';
import { HistoryTab } from './components/HistoryTab';
import { AlertsTab } from './components/AlertsTab';
import { ArrowRightLeft, History as HistoryIcon, Bell, Moon, Sun, Plus, Trash, Star, Download } from './components/Icons';
import { STORAGE_KEYS, CURRENCIES } from './constants';
import { HistoryItem, PriceAlert, Theme } from './types';
import { fetchLatestRates } from './services/currencyService';

const App: React.FC = () => {
  // --- State ---
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || Theme.LIGHT);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrencies, setTargetCurrencies] = useState<string[]>(['EUR']);
  const [amount, setAmount] = useState<number>(1);
  const [percentage, setPercentage] = useState<number>(0);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]'));
  const [history, setHistory] = useState<HistoryItem[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'));
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]'));
  const [activeTab, setActiveTab] = useState<'convert' | 'history' | 'alerts'>('convert');
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});

  // --- Effects ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === Theme.DARK);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }, [alerts]);

  const loadRates = useCallback(async () => {
    try {
      const data = await fetchLatestRates(baseCurrency);
      setRates(data.rates);
      setLastUpdate(new Date().toLocaleString());
    } catch (err) {
      console.error('Error loading rates:', err);
    }
  }, [baseCurrency]);

  useEffect(() => {
    loadRates();
    const interval = setInterval(loadRates, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [loadRates]);

  // Alert Checker
  useEffect(() => {
    const checkAlerts = () => {
      alerts.forEach(priceAlert => {
        if (!priceAlert.isActive) return;
        const currentRate = rates[priceAlert.toCurrency];
        if (!currentRate) return;

        let triggered = false;
        if (priceAlert.condition === 'greater' && currentRate > priceAlert.targetValue) triggered = true;
        if (priceAlert.condition === 'less' && currentRate < priceAlert.targetValue) triggered = true;
        if (priceAlert.condition === 'equal' && Math.abs(currentRate - priceAlert.targetValue) < 0.0001) triggered = true;

        if (triggered) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Price Alert!`, { body: `${priceAlert.fromCurrency}/${priceAlert.toCurrency} reached ${currentRate.toFixed(4)}` });
          } else {
            alert(`Price Alert: ${priceAlert.fromCurrency}/${priceAlert.toCurrency} reached ${currentRate.toFixed(4)}`);
          }
          setAlerts(prev => prev.map(a => a.id === priceAlert.id ? { ...a, isActive: false } : a));
        }
      });
    };
    checkAlerts();
  }, [rates, alerts]);

  // --- Handlers ---
  const toggleTheme = () => setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  const toggleFavorite = (code: string) => setFavorites(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const addTargetCurrency = () => {
    if (targetCurrencies.length < 5) {
      const unused = CURRENCIES.find(c => !targetCurrencies.includes(c.code) && c.code !== baseCurrency);
      if (unused) setTargetCurrencies([...targetCurrencies, unused.code]);
    }
  };

  const removeTargetCurrency = (code: string) => {
    if (targetCurrencies.length > 1) setTargetCurrencies(targetCurrencies.filter(c => c !== code));
  };

  const handleConvert = (targetCode: string) => {
    const rate = rates[targetCode];
    if (!rate || amount <= 0) return;
    
    const calcAmount = amount * (1 + percentage / 100);
    const result = calcAmount * rate;

    // Duplicate check: don't add if the last item is identical
    const lastItem = history[0];
    if (lastItem && 
        lastItem.fromCurrency === baseCurrency && 
        lastItem.toCurrency === targetCode && 
        lastItem.amount === calcAmount && 
        Math.abs(lastItem.rate - rate) < 0.0001) {
      // Still show feedback but don't add to list
      triggerFeedback(targetCode);
      return;
    }

    const newItem: HistoryItem = {
      id: `${Date.now()}-${targetCode}`,
      timestamp: Date.now(),
      fromCurrency: baseCurrency,
      toCurrency: targetCode,
      amount: calcAmount,
      result: result,
      rate: rate
    };

    setHistory(prev => [newItem, ...prev].slice(0, 100));
    triggerFeedback(targetCode);
  };

  const saveAllConversions = () => {
    targetCurrencies.forEach(code => handleConvert(code));
  };

  const triggerFeedback = (code: string) => {
    setSaveStatus(prev => ({ ...prev, [code]: true }));
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, [code]: false }));
    }, 1500);
  };

  const handleRepeatHistory = (item: HistoryItem) => {
    setBaseCurrency(item.fromCurrency);
    setTargetCurrencies([item.toCurrency]);
    setAmount(item.amount);
    setActiveTab('convert');
  };

  const calculateResult = (targetCode: string) => {
    const rate = rates[targetCode];
    if (!rate) return 0;
    return (amount * (1 + percentage / 100)) * rate;
  };

  // --- Render ---
  const renderConvertTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencySelector label="From" value={baseCurrency} onChange={setBaseCurrency} favorites={favorites} onToggleFavorite={toggleFavorite} />
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{baseCurrency}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Extra % (Tax/Fee)
              <input 
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-brand-500"
              />
            </label>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Convert to</h4>
              <div className="flex gap-4">
                <button onClick={saveAllConversions} className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors">
                   <Download className="w-3.5 h-3.5" /> Save All
                </button>
                {targetCurrencies.length < 5 && (
                  <button onClick={addTargetCurrency} className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1 transition-colors">
                    <Plus className="w-4 h-4" /> Add Multi-Target
                  </button>
                )}
              </div>
            </div>
            {targetCurrencies.map((targetCode, idx) => (
              <div key={targetCode} className="group flex items-center gap-4">
                <div className="flex-1">
                  <CurrencySelector 
                    value={targetCode} 
                    onChange={(newCode) => {
                      const newTargets = [...targetCurrencies];
                      newTargets[idx] = newCode;
                      setTargetCurrencies(newTargets);
                    }} 
                    favorites={favorites} 
                    onToggleFavorite={toggleFavorite} 
                  />
                </div>
                <div className="flex-1 min-w-[120px] px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-lg text-brand-600 dark:text-brand-500 truncate">
                    {calculateResult(targetCode).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-400 text-sm font-bold ml-2">{targetCode}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleConvert(targetCode)}
                    className={`p-3 rounded-xl transition-all active:scale-95 ${saveStatus[targetCode] ? 'bg-green-500 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'}`}
                    title="Save to History"
                  >
                    {saveStatus[targetCode] ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                  {targetCurrencies.length > 1 && (
                    <button onClick={() => removeTargetCurrency(targetCode)} className="p-3 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                      <Trash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Updated: {lastUpdate}</div>
            <div className="text-sm text-slate-500">1 {baseCurrency} = {rates[targetCurrencies[0]]?.toFixed(4) || '...'} {targetCurrencies[0]}</div>
          </div>
        </div>

        <div className="bg-brand-600 rounded-3xl p-6 text-white overflow-hidden relative">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-brand-100 text-sm font-medium mb-1">Market Insights</p>
              <h3 className="text-2xl font-bold">Real-time Data Ready</h3>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <CurrencyChart from={baseCurrency} to={targetCurrencies[0]} />
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Favorites
          </h4>
          <div className="flex flex-wrap gap-2">
            {favorites.length > 0 ? favorites.map(f => (
              <button key={f} onClick={() => setBaseCurrency(f)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${baseCurrency === f ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}>
                {f}
              </button>
            )) : <p className="text-xs text-slate-400 italic">Add favorites using the star icon.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">SCST<span className="text-brand-500 ml-1">Project</span></span>
          </div>
          <button onClick={toggleTheme} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">
            {theme === Theme.LIGHT ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1.5 rounded-2xl w-fit">
            <button onClick={() => setActiveTab('convert')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'convert' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm' : 'text-slate-500'}`}>
              <ArrowRightLeft className="w-4 h-4" /> Convert
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm' : 'text-slate-500'}`}>
              <HistoryIcon className="w-4 h-4" /> History
            </button>
            <button onClick={() => setActiveTab('alerts')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'alerts' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm' : 'text-slate-500'}`}>
              <Bell className="w-4 h-4" /> Alerts
            </button>
          </div>

          <div className="animate-in fade-in duration-500">
            {activeTab === 'convert' && renderConvertTab()}
            {activeTab === 'history' && <HistoryTab history={history} onClear={() => { if(confirm('Clear all history?')) setHistory([]); }} onRepeat={handleRepeatHistory} />}
            {activeTab === 'alerts' && <AlertsTab alerts={alerts} onAddAlert={(a) => setAlerts(prev => [...prev, { ...a, id: Date.now().toString(), isActive: true }])} onDeleteAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))} />}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around">
        <button onClick={() => setActiveTab('convert')} className={`p-2 ${activeTab === 'convert' ? 'text-brand-500' : 'text-slate-400'}`}><ArrowRightLeft className="w-6 h-6" /></button>
        <button onClick={() => setActiveTab('history')} className={`p-2 ${activeTab === 'history' ? 'text-brand-500' : 'text-slate-400'}`}><HistoryIcon className="w-6 h-6" /></button>
        <button onClick={() => setActiveTab('alerts')} className={`p-2 ${activeTab === 'alerts' ? 'text-brand-500' : 'text-slate-400'}`}><Bell className="w-6 h-6" /></button>
      </footer>
    </div>
  );
};

export default App;
