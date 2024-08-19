import CoinbaseWebsocketClient from "./coinbase";
import StockRelay from "./stockRelay";
import TwelvedataWebSocketClient from "./twelvedata";

export default async function createStockRelayWebSocket() {
  const twelveDataWebSocketClient = new TwelvedataWebSocketClient({
    logger: console,
    apiKey: process.env.TWELVEDATA_API_KEY!,
    wsUrl: process.env.TWELVEDATA_WS_URL!,
    symbolSubscriptions: ["AAPL", "QQQ", "ABML", "IXIC", "BTC/USD", "EUR/USD"],
    name: "twelvedata",
  });

  // const coinbaseWebsocketClient = new CoinbaseWebsocketClient({
  //   logger: console,
  //   wsUrl: process.env.COINBASE_WS_URL!,
  //   symbolSubscriptions: ["ETH/USD", "DOGE/USD"],
  //   name: "coinbase",
  //   apiKey: process.env.COINBASE_API_KEY!,
  //   signingKey: process.env.COINBASE_API_PRIVATE_KEY!,
  // });

  const stockRelay = new StockRelay();

  stockRelay.addExternalClient(twelveDataWebSocketClient);
  // stockRelay.addExternalClient(coinbaseWebsocketClient);

  return stockRelay;
}
