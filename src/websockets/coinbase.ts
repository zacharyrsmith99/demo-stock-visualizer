import WebSocket from "ws";
import {
  BaseWebSocketClient,
  BaseWebSocketClientParams,
} from "./externalWebSocketClientBase";
import { sign, SignOptions } from "jsonwebtoken";
import crypto from "crypto";

interface CoinbaseWebSocketClientParams extends BaseWebSocketClientParams {
  apiKey: string;
  signingKey: string;
}

export default class CoinbaseWebsocketClient extends BaseWebSocketClient {
  private signingKey: string;

  constructor(params: CoinbaseWebSocketClientParams) {
    super({
      logger: params.logger,
      wsUrl: params.wsUrl,
      symbolSubscriptions: params.symbolSubscriptions,
      name: params.name,
      apiKey: params.apiKey,
    });
    this.signingKey = params.signingKey;
  }

  protected startHealthcheck(): void {
    // const healthcheckMsg = {
    //   type: "subscribe",
    //   channel: "heartbeats",
    //   jwt: this.generateJWT(),
    // };
    // try {
    //   this.ws.send(JSON.stringify(healthcheckMsg));
    // } catch (error) {
    //   this.logger.error(
    //     `Failed to send subscription message for external websocket client (${this.getName()}): (${error})`,
    //   );
    // }
  }

  protected setupEventListeners(): void {
    super.setupEventListeners();

    this.ws.on("open", () => {
      this.logger.info(`WebSocket opened for ${this.getName()}`);
      this.subscribeToSymbols(this.symbolSubscriptions);
    });
  }

  protected handleMessage(data: WebSocket.Data) {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      this.logger.warn(
        `Failed to parse incoming message event for external websocket client ${this.getName()}: (${JSON.stringify(error)})`,
      );
      return;
    }

    switch (message.type) {
      case "heartbeat":
        this.emit("healthcheck", message);
        break;
      case "subscriptions":
        this.logger.info(`Subscription status: (${JSON.stringify(message)})`);
        break;
      case "price":
        this.emit("priceUpdate", this.dataProcessor.process(message));
        break;
      default:
        this.logger.warn(
          `External Websocket Client (${this.getName()}) received unexpected event: (${message.type}), message: (${JSON.stringify(message)})`,
        );
    }
  }

  public async subscribeToSymbols(symbols: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const subscribeMsg = {
        type: "subscribe",
        product_ids: symbols,
        channel: "level2",
      };

      const handleSubscribeStatus = (response: any) => {
        if (response.type === "subscriptions") {
          this.removeListener("subscribe-status", handleSubscribeStatus);
          this.logger.info(
            `Successfully subscribed to symbols for ${this.getName()}: ${symbols.join(", ")}`,
          );
          resolve();
        }
      };

      this.once("subscribe-status", handleSubscribeStatus);

      try {
        this.ws.send(JSON.stringify(subscribeMsg));
        this.logger.info(
          `Sent subscription request for ${this.getName()}: ${JSON.stringify(subscribeMsg)}`,
        );
      } catch (error) {
        this.removeListener("subscribe-status", handleSubscribeStatus);
        reject(
          new Error(
            `Failed to send subscription message for ${this.getName()}: ${error}`,
          ),
        );
      }
    });
  }
}
