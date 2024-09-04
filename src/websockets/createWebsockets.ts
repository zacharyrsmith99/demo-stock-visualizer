import BaseLogger from "../utils/logger";
import StockRelay from "./stockRelay";

export default async function createStockRelayWebSocket(logger: BaseLogger) {
  const twelveDataWebSocketClientParams = {
    logger: logger,
    apiKey: process.env.TWELVEDATA_API_KEY!,
    wsUrl: process.env.TWELVEDATA_WS_URL!,
    symbolSubscriptions: ["AAPL", "QQQ", "ABML", "IXIC", "BTC/USD", "EUR/USD"],
    name: "twelvedata",
  };
  // const coinbaseWebsocketClient = new CoinbaseWebsocketClient({
  //   logger: logger,
  //   wsUrl: process.env.COINBASE_WS_URL!,
  //   symbolSubscriptions: ["ETH/USD", "DOGE/USD"],
  //   name: "coinbase",
  //   apiKey: process.env.COINBASE_API_KEY!,
  //   signingKey: process.env.COINBASE_API_PRIVATE_KEY!,
  // });

  const stockRelay = new StockRelay(logger);

  stockRelay.addExternalClient("twelvedata", twelveDataWebSocketClientParams);
  // stockRelay.addExternalClient(coinbaseWebsocketClient);

  return stockRelay;
}
