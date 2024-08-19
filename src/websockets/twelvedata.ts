import WebSocket from "ws";
import {
  BaseWebSocketClient,
  BaseWebSocketClientParams,
} from "./externalWebSocketClientBase";

export default class TwelvedataWebSocketClient extends BaseWebSocketClient {
  constructor(params: BaseWebSocketClientParams) {
    if (!params.apiKey) {
      throw new Error("API key is required for twelvedata websocket!");
    }

    super({
      logger: params.logger,
      apiKey: params.apiKey,
      wsUrl: params.wsUrl,
      symbolSubscriptions: params.symbolSubscriptions,
      name: params.name,
      wsOptions: {
        headers: {
          "X-TD-APIKEY": params.apiKey,
        },
      },
    });
  }

  protected startHealthcheck(): void {
    setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: "heartbeat" }));
      }
    }, 10000);
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
    const event = message.event;

    switch (event) {
      case "heartbeat":
        this.emit("healthcheck", message);
        break;
      case "subscribe-status":
        break;
      case "price":
        const priceMessage = this.dataProcessor.process(message)
        this.emit("priceUpdate", priceMessage);
        break;
      default:
        this.logger.warn(
          `External Websocket Client (${this.getName()}) received unexpected event: (${event}), message: (${message})`,
        );
    }
  }

  public async subscribeToSymbols(symbols: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const subscribeMsg = {
        action: "subscribe",
        params: {
          symbols: symbols.join(","),
        },
      };

      const handleSubscribeStatus = (response: any) => {
        this.removeListener("subscribe-status", handleSubscribeStatus);

        if (response.status === "error") {
          reject(
            new Error(
              `Twelvedata symbol subscription failed: ${JSON.stringify(response)}`,
            ),
          );
        } else {
          this.logger.info(
            `Successfully subscribed to symbols: ${symbols.join(", ")}`,
          );
          if (response.fails && response.fails.length > 0) {
            this.logger.warn(
              `Failed to subscribe to some symbols: ${response.fails.join(", ")}`,
            );
          }
          resolve();
        }
      };

      this.once("subscribe-status", handleSubscribeStatus);

      try {
        this.ws.send(JSON.stringify(subscribeMsg));
      } catch (error) {
        this.removeListener("subscribe-status", handleSubscribeStatus);
        reject(new Error(`Failed to send subscription message: ${error}`));
      }
    });
  }
}
