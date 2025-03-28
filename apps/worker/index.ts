import { configDb, redisOptions, RedisChannel } from "config";
import Redis from "ioredis";
import { hostname } from "os";
import { workers } from "./appState";
import { closeAllWorkers, setupBullMQWorker } from "./worker";
import { handleRedisRoute, handleUpdateSystemInfo } from "./routes";
import { redisChannel } from "./redis";

async function main() {
  const config = await configDb.read();
  if (!config) {
    throw new Error(
      "Configuration not found. Please copy config.example.yaml to config.yaml and update the configuration."
    );
  }

  const {
    provider: { accounts },
  } = config;

  workers.push(...accounts.map(setupBullMQWorker));

  await redisChannel.subscribe(`${RedisChannel.CreateWorker} in ${hostname}`);

  redisChannel.on("message", handleRedisRoute);

  const systemInfoInterval = setInterval(async () => {
    try {
      await handleUpdateSystemInfo();
    } catch (e) {
      console.log(e);
    }
  }, 5000);

  process.on("exit", (code) => {
    closeAllWorkers();
    clearInterval(systemInfoInterval);
  });

  process.on("SIGINT", () => {
    closeAllWorkers();
    clearInterval(systemInfoInterval);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    closeAllWorkers();
    clearInterval(systemInfoInterval);
    process.exit(0);
  });
}

main();
