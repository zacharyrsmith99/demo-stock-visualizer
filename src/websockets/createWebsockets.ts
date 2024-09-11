import BaseLogger from "../utils/logger";
import StockRelay from "./stockRelay";
import { Kafka } from "kafkajs";

export default async function createStockRelayWebSocket(logger: BaseLogger) {
  const brokers = process.env.KAFKA_BOOTSTRAP_SERVERS
    ? process.env.KAFKA_BOOTSTRAP_SERVERS!.split(",")
    : ["localhost:9092"];

  const kafka = new Kafka({
    clientId: "stockzrs-relay-service",
    brokers: brokers,
    sasl: {
      mechanism: "scram-sha-512",
      username: process.env.KAFKA_USERNAME!,
      password: process.env.KAFKA_PASSWORD!,
    },
    connectionTimeout: 3000,
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  });

  const producer = kafka.producer();
  await producer.connect();

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

  const stockRelay = new StockRelay(logger, producer);

  stockRelay.addExternalClient("twelvedata", twelveDataWebSocketClientParams);
  // stockRelay.addExternalClient(coinbaseWebsocketClient);

  return stockRelay;
}
