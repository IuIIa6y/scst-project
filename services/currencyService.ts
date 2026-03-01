
import { ExchangeRate, ChartDataPoint, TimeInterval } from '../types';

// Using open.er-api.com for latest rates as it supports a wider range of currencies including RUB.
// Frankfurter API (the previous provider) deprecated RUB support.
const LATEST_URL = 'https://open.er-api.com/v6/latest';
const HISTORICAL_URL = 'https://api.frankfurter.app';

export const fetchLatestRates = async (base: string): Promise<ExchangeRate> => {
  const response = await fetch(`${LATEST_URL}/${base}`);
  if (!response.ok) throw new Error('Failed to fetch rates');
  const data = await response.json();
  
  return {
    base: data.base_code,
    date: new Date(data.time_last_update_unix * 1000).toISOString().split('T')[0],
    rates: data.rates
  };
};

export const fetchHistoricalData = async (
  from: string,
  to: string,
  interval: TimeInterval
): Promise<ChartDataPoint[]> => {
  const end = new Date();
  let start = new Date();

  switch (interval) {
    case '1D':
      start.setDate(end.getDate() - 1);
      break;
    case '1W':
      start.setDate(end.getDate() - 7);
      break;
    case '1M':
      start.setMonth(end.getMonth() - 1);
      break;
    case '3M':
      start.setMonth(end.getMonth() - 3);
      break;
    case '1Y':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  try {
    const response = await fetch(`${HISTORICAL_URL}/${startStr}..${endStr}?from=${from}&to=${to}`);
    if (!response.ok) {
        // Fallback for currencies not supported by Frankfurter's historical data endpoint (like RUB)
        return [];
    }
    const data = await response.json();
    
    return Object.entries(data.rates).map(([date, rates]: [string, any]) => ({
      date,
      value: rates[to] || 0,
    }));
  } catch (e) {
    console.warn('Historical data fetch failed, likely currency not supported by provider.');
    return [];
  }
};
