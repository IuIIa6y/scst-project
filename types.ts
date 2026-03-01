
export interface Currency {
  code: string;
  name: string;
  symbol?: string;
}

export interface ExchangeRate {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  rate: number;
}

export interface PriceAlert {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  targetValue: number;
  condition: 'greater' | 'less' | 'equal';
  isActive: boolean;
}

export type TimeInterval = '1D' | '1W' | '1M' | '3M' | '1Y';

export interface ChartDataPoint {
  date: string;
  value: number;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}
