import BaseLogger from "../utils/logger";
import { BaseWebSocketClientParams } from "./externalWebSocketClientBase";
import TwelvedataWebSocketClient from "./twelvedata";

export default function getWebSocketClient(
  clientName: string,
  params: BaseWebSocketClientParams,
  logger: BaseLogger,
) {
  switch (clientName) {
    case "twelvedata":
      return new TwelvedataWebSocketClient(params);
    default:
      logger.error(
        `There is no WebSocket Client configured to be obtained for clientName (${clientName})!`,
      );
      throw new Error();
  }
}
