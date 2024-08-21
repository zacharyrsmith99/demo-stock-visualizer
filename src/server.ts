import createApp from "./app";
import { Lightship } from "lightship";
import http from "http";
import createStockRelayWebSocket from "./websockets/createWebsockets";
import { WebSocketServer } from "ws";
import path from "path";
import BaseLogger from "./utils/logger";

export default async function createServer(kubernetesHandler: Lightship) {
  const logger = new BaseLogger(path.join(__dirname, "app.log"));
  const app = await createApp();
  const server = http.createServer(app);
  const stockRelay = await createStockRelayWebSocket(logger);
  await stockRelay.start();

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");

    const handlePriceUpdate = (data: any) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ data }));
      }
    };

    stockRelay.on("priceUpdate", handlePriceUpdate);

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      stockRelay.off("priceUpdate", handlePriceUpdate);
    });
  });

  kubernetesHandler.registerShutdownHandler(async () => {
    stockRelay.close();
    server.close();
    process.exit(0);
  });

  return server;
}
