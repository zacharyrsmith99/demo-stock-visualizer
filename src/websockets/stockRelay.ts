import { EventEmitter } from "events";
import { BaseWebSocketClient } from "./externalWebSocketClientBase";

export default class StockRelay extends EventEmitter {
  private externalClients: BaseWebSocketClient[] = [];

  addExternalClient(client: BaseWebSocketClient) {
    this.externalClients.push(client);
    client.on("priceUpdate", (data: any) => {
      this.handlePriceUpdate(client.getName(), data);
    });
    client.on("healthcheck", (data: any) => {
      this.handleHealthcheck(data);
    });
  }

  async start() {
    for (const client of this.externalClients) {
      await client.start();
    }
  }

  async close() {
    for (const client of this.externalClients) {
      await client.close();
    }
  }

  async handlePriceUpdate(clientName: string, data: any) {
    console.log(clientName, data);
    this.emit('priceUpdate', data);
  }

  async handleHealthcheck(data: any) {
    console.log("healthcheck", data);
  }
}
