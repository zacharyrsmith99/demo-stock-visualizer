import WebSocket from "ws";
import {
  BaseWebSocketClient,
  BaseWebSocketClientParams,
} from "./externalWebSocketClientBase";

export default class TwelvedataWebSocketClient extends BaseWebSocketClient {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeatResponse: number = Date.now();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 10000;

  constructor(params: BaseWebSocketClientParams) {
    if (!params.apiKey) {
      throw new Error("API key is required for twelvedata websocket!");
    }

    super({
      ...params,
      wsOptions: {
        ...params.wsOptions,
        headers: {
          "X-TD-APIKEY": params.apiKey,
        },
      },
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.reconnectAttempts = 0;
      const connectWithRetry = () => {
        this.logger.info(
          `Attempting to connect to WebSocket URL: ${this.wsUrl}`,
        );
        this.ws = new WebSocket(this.wsUrl, this.wsOptions);

        this.ws.on("open", () => {
          this.logger.info(
            `Connected to external WebSocket (${this.getName()}) successfully!`,
          );
          this.setupEventListeners();
          this.startHealthcheck();
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on("error", (error) => {
          this.logger.error(`WebSocket connection error: ${error.message}`);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.logger.info(
              `Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`,
            );
            setTimeout(connectWithRetry, this.reconnectDelay);
          } else {
            this.logger.error(`Max reconnection attempts reached. Giving up.`);
            reject(
              new Error(
                `Failed to connect after ${this.maxReconnectAttempts} attempts`,
              ),
            );
          }
        });
      };

      connectWithRetry();
    });
  }

  protected setupEventListeners(): void {
    this.ws.on("message", (data: WebSocket.Data) => {
      this.handleMessage(data);
    });

    this.ws.on("close", () => {
      this.logger.info(`WebSocket connection closed for ${this.getName()}`);
    });

    this.ws.on("error", (error: Error) => {
      this.emit("error", `WebSocket Error: ${error}`);
    });
  }

  protected startHealthcheck(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
      this.checkHeartbeatResponse();
    }, 10000);
  }

  private sendHeartbeat(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "heartbeat" }));
      this.logger.debug("Sent heartbeat to Twelvedata WebSocket");
    } else {
      this.logger.warn(
        "Could not send heartbeat to Twelvedata WebSocket, the WebSocket is not open!",
      );
    }
  }

  private checkHeartbeatResponse(): void {
    const currentTime = Date.now();
    if (currentTime - this.lastHeartbeatResponse > 30000) {
      this.logger.error(
        "No heartbeat response received in the last 30 seconds",
      );
      this.emit("error", new Error("Heartbeat timeout"));
    }
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
        this.lastHeartbeatResponse = Date.now();
        this.logger.debug("Received heartbeat from Twelvedata WebSocket");
        this.emit("healthcheck", message);
        break;
      case "subscribe-status":
        break;
      case "price":
        this.emit("priceUpdate", this.dataProcessor.process(message));
        break;
      default:
        this.logger.warn(
          `External Websocket Client (${this.getName()}) received unexpected event: (${event}), message: (${message})`,
        );
    }
  }

  public async subscribeToSymbols(): Promise<void> {
    return new Promise((resolve, reject) => {
      const subscribeMsg = {
        action: "subscribe",
        params: {
          symbols: this.symbolSubscriptions.join(","),
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
            `Successfully subscribed to symbols: ${this.symbolSubscriptions.join(", ")}`,
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

  public getSymbolSubscriptions(): string[] {
    return this.symbolSubscriptions;
  }

  public async close(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    return super.close();
  }
}
