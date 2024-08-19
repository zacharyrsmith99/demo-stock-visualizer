import {
  AssetType,
  TwelvedataPriceUpdate,
  ProcessedStockData,
} from "../types/stockDataTypes";
import { BaseProcessor } from "./baseProcessor";

type AssetMapping = {
  [key: string]: AssetType;
};

export class TwelvedataProcessor extends BaseProcessor {
  constructor(name: string, logger: any) {
    super(name, logger);
  }

  getAssetype(type: string) {
    const twelvedataAssetToGeneralAsset: AssetMapping = {
      "Digital Currency": AssetType.Cryptocurrency,
      Index: AssetType.Index,
    };

    if (type in twelvedataAssetToGeneralAsset) {
      return twelvedataAssetToGeneralAsset[type];
    }

    this.logger.warn(
      `Received unexpected asset type (${type}) while processing incoming price update from twelvedata!`,
    );

    return type as AssetType;
  }

  process(data: TwelvedataPriceUpdate): ProcessedStockData {
    return {
      symbol: data.symbol,
      price: data.price,
      timestamp: data.timestamp,
      type: this.getAssetype(data.type),
      exchange: data.exchange,
      bid: data.bid,
      ask: data.ask,
      currency_base: data.currency_base,
      currency_quote: data.currency_quote,
      day_volume: data.day_volume,
    };
  }
}
