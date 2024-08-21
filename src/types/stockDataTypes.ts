export enum AssetType {
  Cryptocurrency = "CRYPTOCURRENCY",
  Currency = "CURRENCY",
  Stock = "STOCK",
  Index = "INDEX",
  Bond = "BOND",
  Commodity = "COMMODITY",
  ETF = "ETF",
  Future = "FUTURE",
  Option = "OPTION",
  REIT = "REIT",
  MutualFund = "MUTUAL_FUND",
  ForexPair = "FOREX_PAIR",
}

export interface ProcessedStockData {
  symbol: string;
  price: number;
  timestamp: number;
  type: AssetType;
  bid?: number;
  ask?: number;
  exchange?: string;
  currency_base?: string;
  currency_quote?: string;
  day_volume?: number;
}

export interface TwelvedataPriceUpdate {
  event: string;
  symbol: string;
  price: number;
  timestamp: number;
  exchange?: string;
  type: AssetType;
  bid?: number;
  ask?: number;
  day_volume: number;
  currency_base?: string;
  currency_quote?: string;
}
