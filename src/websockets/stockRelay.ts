import { EventEmitter } from "events";
import {
  BaseWebSocketClient,
  BaseWebSocketClientParams,
} from "./externalWebSocketClientBase";
import { Producer } from "kafkajs";
import BaseLogger from "../utils/logger";
import getWebSocketClient from "./getWebSocketClient";
import { ProcessedStockData } from "../types/stockDataTypes";
import { DateTime } from "luxon";

interface ExternalClient {
  client: BaseWebSocketClient;
  params: BaseWebSocketClientParams;
}

interface ExternalClients {
  [name: string]: ExternalClient;
}

export default class StockRelay extends EventEmitter {
  private externalClients: ExternalClients = {};
  private logger: BaseLogger;
  private kafkaProducer: Producer;

  constructor(logger: BaseLogger, kafkaProducer: Producer) {
    super();
    this.logger = logger;
    this.kafkaProducer = kafkaProducer;
  }

  async addExternalClient(
    clientName: string,
    clientParams: BaseWebSocketClientParams,
  ) {
    const client = getWebSocketClient(clientName, clientParams, this.logger);

    this.externalClients[client.getName()] = {
      client: client,
      params: clientParams,
    };
    await client.start();
    this.setupClientListeners(client);
    await client.subscribeToSymbols();
  }

  private setupClientListeners(client: BaseWebSocketClient) {
    client.on("priceUpdate", (data: any) => {
      this.handlePriceUpdate(client.getName(), data);
    });
    client.on("healthcheck", (data: any) => {
      this.handleHealthcheck(client.getName(), data);
    });
    client.on("error", (error: Error) => {
      this.handleClientError(client.getName(), error);
    });
  }

  async close() {
    for (const externalClient of Object.entries(this.externalClients)) {
      await externalClient[1].client.close();
    }
  }

  private generateKafkaKey(data: ProcessedStockData): string {
    const dateTime = DateTime.fromMillis(data.timestamp * 1000);
    return `${dateTime.toFormat("yyyy-MM-dd HH:mm")}.${data.symbol}`;
  }

  async handlePriceUpdate(clientName: string, data: ProcessedStockData) {
    this.logger.debug(
      `Price update from ${clientName}: ${JSON.stringify(data)}`,
    );
    this.emit("priceUpdate", data);

    const key = this.generateKafkaKey(data);

    try {
      await this.kafkaProducer.send({
        topic: "raw-financial-updates",
        messages: [
          {
            key: key,
            value: JSON.stringify(data),
          },
        ],
      });
      this.logger.debug(`Sent raw financial data to Kafka with key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to send raw financial data to Kafka with key ${key}: ${error}`,
      );
    }
  }

  async handleHealthcheck(clientName: string, data: any) {
    this.logger.debug(
      `Healthcheck from ${clientName}: ${JSON.stringify(data)}`,
    );
  }

  private async handleClientError(clientName: string, error: Error) {
    this.logger.error(`Error in client ${clientName}: ${error.message}`);
    await this.restartClient(clientName);
  }

  private async restartClient(clientName: string) {
    const clientInfo = this.externalClients[clientName];
    this.logger.info(
      `Attempting restart for Websocket client (${clientName})...`,
    );

    if (!clientInfo) {
      this.logger.error(
        `There is no client named (${clientName}) to restart a WebSocket connection for!`,
      );
    }

    const client = clientInfo.client;
    const clientParams = clientInfo.params;

    await client.close();

    delete this.externalClients[clientName];

    this.logger.info(
      `Successfully closed WebSocket client (${clientName}). Commencing startup of Websocket client (${clientName})...`,
    );

    this.addExternalClient("twelvedata", clientParams);
  }
}
