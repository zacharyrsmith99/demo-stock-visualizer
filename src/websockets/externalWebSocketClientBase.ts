import WebSocket from "ws";
import { EventEmitter } from "events";
import { BaseProcessor } from "../processors/baseProcessor";
import getDataProcessor from "../processors/getDataProcessor";

export interface BaseWebSocketClientParams {
  logger: any;
  apiKey: string;
  wsUrl: string;
  symbolSubscriptions: string[];
  name: string;
  wsOptions?: WebSocket.ClientOptions;
}

export abstract class BaseWebSocketClient extends EventEmitter {
  protected ws: WebSocket;
  protected apiKey: string | undefined;
  protected logger: any;
  protected symbolSubscriptions: string[];
  protected name: string;
  protected dataProcessor: BaseProcessor;

  constructor(params: BaseWebSocketClientParams) {
    super();
    this.apiKey = params.apiKey;
    this.logger = params.logger;
    this.symbolSubscriptions = params.symbolSubscriptions;

    this.logger.info(`Connecting to WebSocket URL: ${params.wsUrl}`);

    this.dataProcessor = getDataProcessor(params.name, this.logger);

    this.ws = new WebSocket(params.wsUrl, params.wsOptions);

    this.setupEventListeners();

    this.name = params.name;
  }

  public getName(): string {
    return this.name;
  }

  protected setupEventListeners(): void {
    this.ws.on("message", (data: WebSocket.Data) => {
      this.handleMessage(data);
    });

    this.ws.on("error", (error: Error) => {
      this.emit("error", `WebSocket Error: ${error}`);
    });

    this.ws.on("close", () => {
      this.emit("close");
    });
  }

  protected abstract startHealthcheck(): void;

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      this.ws.once("open", async () => {
        clearTimeout(timeout);
        this.logger.info(
          `Connected to external WebSocket (${this.getName()}) successfully!`,
        );
        this.startHealthcheck();
        this.subscribeToSymbols(this.symbolSubscriptions);
        resolve();
      });

      this.ws.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  protected abstract handleMessage(data: WebSocket.Data): void;

  public abstract subscribeToSymbols(symbols: string[]): Promise<void>;

  public async close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.ws.readyState === WebSocket.CLOSED) {
        this.logger.info("WebSocket is already closed.");
        resolve();
        return;
      }

      const closeHandler = () => {
        this.logger.info("WebSocket closed successfully.");
        cleanup();
        resolve();
      };

      const errorHandler = (error: Error) => {
        this.logger.error(`Error during WebSocket closure: ${error}`);
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        this.ws.removeListener("close", closeHandler);
        this.ws.removeListener("error", errorHandler);
        clearTimeout(timeoutFailsafe);
      };

      const timeoutFailsafe = setTimeout(() => {
        this.logger.warn(
          "WebSocket timeout failsafe limit reached. Forcing close.",
        );
        cleanup();
        this.ws.terminate();
        resolve();
      }, 5000);

      this.ws.once("close", closeHandler);
      this.ws.once("error", errorHandler);

      try {
        this.ws.close();
      } catch (error) {
        this.logger.error(`Error initiating WebSocket close: ${error}`);
        cleanup();
        reject(error);
      }
    });
  }
}
