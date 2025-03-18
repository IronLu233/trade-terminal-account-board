import type { RedisOptions } from "bullmq";
import { Env } from "./env";

export const redisOptions: RedisOptions = {
  port: Number(Env.REDIS_PORT!) || 6379,
  host: Env.REDIS_HOST || "localhost",
  password: Env.REDIS_PASS || "",
};
