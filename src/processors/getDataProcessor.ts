import { BaseProcessor } from "./baseProcessor";
import { TwelvedataProcessor } from "./twelvedataProcessor";

export default function getDataProcessor(
  name: string,
  logger: any,
): BaseProcessor {
  if (name === "twelvedata") {
    return new TwelvedataProcessor(name, logger);
  }

  logger.warn(`Unexpected name passed for data processor: (${name})`);
  return new BaseProcessor(name, logger);
}
