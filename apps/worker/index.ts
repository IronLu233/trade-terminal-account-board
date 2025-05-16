import { configDb, RedisChannel, Env } from "config";
import { WORKER_NAME, workers } from "./appState";
import { closeAllWorkers, setupBullMQWorker } from "./worker";
import { handleRedisRoute, handleUpdateSystemInfo } from "./routes";
import { redisChannel } from "./redis";
import mongoose from "mongoose";

async function main() {
  await mongoose.connect(Env.MONGODB_URL)

  const accounts = await configDb.AccountModel.find()

  workers.push(...accounts.map(({ account }) => setupBullMQWorker(account)));

  await redisChannel.subscribe(
    RedisChannel.CreateAccount,
    RedisChannel.TerminateJob,
    RedisChannel.RemoveAccount
  );

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
