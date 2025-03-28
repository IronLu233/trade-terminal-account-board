import { type FastifyPluginAsync } from "fastify";
import { boolean, z } from "zod";
import si from "systeminformation";
import { redis } from "../services/redis";
import { configDb, type Config } from "config";
import { getSystemInfoRedisKey } from "common";

const systemInfoSchema = z.object({
  cpu: z.object({
    usage: z.number(),
    cores: z.number(),
  }),
  hostname: z.string(),
  memory: z.object({
    total: z.number(),
    free: z.number(),
    used: z.number(),
    usagePercentage: z.number(),
  }),
  disk: z.object({
    total: z.number(),
    free: z.number(),
    used: z.number(),
    usagePercentage: z.number(),
  }),
});

const systemInfoRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",

    async () => {
      const {
        customer: { hosts },
      } = (await configDb.read()) as Config;

      const machineHosts = hosts.map((it) => it.host);

      const infoStrings = await Promise.all(
        machineHosts.map((host) => redis.get(getSystemInfoRedisKey(host)))
      );

      return infoStrings
        .filter(Boolean)
        .map((it) => systemInfoSchema.parse(JSON.parse(it!)));
    }
  );
};

export default systemInfoRoutes;
