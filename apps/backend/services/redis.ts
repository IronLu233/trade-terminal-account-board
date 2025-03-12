import Redis from "ioredis";
import { redisOptions } from "../config/redis";
// Helper function to get Redis memory information

export async function getRedisMemoryInfo(): Promise<Record<
  string,
  any
> | null> {
  const redis = new Redis({
    host: redisOptions.host,
    port: redisOptions.port,
    password: redisOptions.password,
  });
  const info = await redis.info("memory");

  // Parse Redis INFO output
  const parsedInfo: Record<string, string> = {};
  info.split("\r\n").forEach((line) => {
    if (line && !line.startsWith("#")) {
      const [key, value] = line.split(":");
      if (key && value) {
        parsedInfo[key] = value;
      }
    }
  });

  return {
    usedMemory: Number(parsedInfo["used_memory"]),
    usedMemoryHuman: parsedInfo["used_memory_human"],
    totalSystemMemory: Number(parsedInfo["total_system_memory"]),
    totalSystemMemoryHuman: parsedInfo["total_system_memory_human"],
  };
}
