import { ProcessedStockData } from "../types/stockDataTypes";

export class BaseProcessor {
  protected name: string;
  protected logger: any;

  constructor(name: string, logger: any) {
    this.name = name;
    this.logger = logger;
  }

  process(data: object): ProcessedStockData {
    return data as ProcessedStockData;
  }

  getName(): string {
    return this.name;
  }
}