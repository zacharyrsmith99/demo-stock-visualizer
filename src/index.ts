import { createLightship } from "lightship";
import createServer from "./server";

async function start() {
  const kubernetesHandler = await createLightship({
    shutdownDelay: 0,
    gracefulShutdownTimeout: 60000,
  });

  const server = await createServer(kubernetesHandler);

  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`backend-stock-visualizer-service running on port ${port}`);
    kubernetesHandler.signalReady();
  });
}

start();
