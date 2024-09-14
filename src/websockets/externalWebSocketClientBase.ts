import WebSocket from "ws";
import { EventEmitter } from "events";
import { BaseProcessor } from "../processors/baseProcessor";
import getDataProcessor from "../processors/getDataProcessor";
import BaseLogger from "../utils/logger";

export interface BaseWebSocketClientParams {
  logger: BaseLogger;
  apiKey: string;
  wsUrl: string;
  symbolSubscriptions: string[];
  name: string;
  wsOptions?: WebSocket.ClientOptions;
  maxListeners?: number;
}

export abstract class BaseWebSocketClient extends EventEmitter {
  protected ws!: WebSocket;
  protected apiKey: string;
  protected logger: BaseLogger;
  protected symbolSubscriptions: string[];
  protected name: string;
  protected dataProcessor: BaseProcessor;
  protected wsUrl: string;
  protected wsOptions?: WebSocket.ClientOptions;
  private logListenersIntervalId: NodeJS.Timeout | null = null;

  constructor(params: BaseWebSocketClientParams) {
    super();
    this.apiKey = params.apiKey;
    this.logger = params.logger;
    this.symbolSubscriptions = params.symbolSubscriptions;
    this.dataProcessor = getDataProcessor(params.name, this.logger);
    this.wsUrl = params.wsUrl;
    this.name = params.name;
    this.wsOptions = params.wsOptions;
    this.setMaxListeners(50);
    this.startPeriodicListenerLogging(5 * 60 * 1000);
  }

  public getName(): string {
    return this.name;
  }

  private startPeriodicListenerLogging(intervalMs: number): void {
    this.logListenersIntervalId = setInterval(() => {
      this.logAllListeners();
    }, intervalMs);
  }

  private logAllListeners(): void {
    const events = this.eventNames();
    this.logger.info(`Current listeners for ${this.name}:`);
    events.forEach((event) => {
      const eventName = typeof event === "string" ? event : String(event);
      const listeners = this.listeners(event);
      this.logger.info(`  ${eventName}: ${listeners.length} listener(s)`);
      listeners.forEach((listener, index) => {
        this.logger.info(
          `    Listener ${index + 1}: ${listener.name || "Anonymous"}`,
        );
      });
    });
  }

  public stopPeriodicListenerLogging(): void {
    if (this.logListenersIntervalId) {
      clearInterval(this.logListenersIntervalId);
      this.logListenersIntervalId = null;
    }
  }

  protected abstract setupEventListeners(): void;

  protected abstract startHealthcheck(): void;

  public abstract start(): Promise<void>;

  protected abstract handleMessage(data: WebSocket.Data): void;

  public abstract subscribeToSymbols(symbols: string[]): Promise<void>;

  public getSymbolSubscriptions(): string[] {
    return this.symbolSubscriptions;
  }

  public async close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.stopPeriodicListenerLogging();

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
