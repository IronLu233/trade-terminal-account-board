import { type FastifyPluginAsync } from "fastify";
import { z } from "zod";
import si from "systeminformation";
import { getRedisMemoryInfo } from "../services/redis";

const systemInfoSchema = z.object({
  cpu: z.object({
    usage: z.number(),
    cores: z.number(),
  }),
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
  redis: z.object({
    usedMemory: z.number(),
    usedMemoryHuman: z.string(),
    totalSystemMemory: z.number(),
    totalSystemMemoryHuman: z.string(),
  }),
});

const systemInfoRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: systemInfoSchema,
        },
      },
    },
    async () => {
      const [cpuData, memData, fsData] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
      ]);

      // Get root filesystem or first available
      const rootFs = fsData.find((fs) => fs.mount === "/") || fsData[0];
      return {
        cpu: {
          usage: Number(cpuData.currentLoad.toFixed(2)),
          cores: cpuData.cpus.length,
        },
        memory: {
          total: memData.total,
          free: memData.free,
          used: memData.used,
          usagePercentage: Number(
            ((memData.used / memData.total) * 100).toFixed(2)
          ),
        },
        disk: {
          total: rootFs.size,
          free: rootFs.available,
          used: rootFs.used,
          usagePercentage: Number(rootFs.use),
        },
        redis: await getRedisMemoryInfo(),
      };
    }
  );
};

export default systemInfoRoutes;
