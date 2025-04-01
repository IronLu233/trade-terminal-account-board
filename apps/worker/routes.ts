import { RedisChannel } from "config";
import { z } from "zod";
import { jobCancelerMap, WORKER_NAME, workers } from "./appState";
import { setupBullMQWorker } from "./worker";
import { getCurrentWorkerJobKey, getSystemInfoRedisKey } from "common";
import si from "systeminformation";
import { redis } from "./redis";

export function handleRedisRoute(channel: string, message: string) {
  console.log(channel);
  switch (channel) {
    case RedisChannel.CreateWorker:
      return handleCreateWorker(message);
    case RedisChannel.TerminateJob:
      return handleTerminateJob(message);
  }
}

const createWorkerMessageSchema = z.object({
  queueName: z.string(),
});

function handleCreateWorker(message: string) {
  const { queueName } = createWorkerMessageSchema.parse(JSON.parse(message));
  workers.push(setupBullMQWorker(queueName));
}

const TerminateJobSchema = z.object({
  jobId: z.string(),
  account: z.string(),
});
function handleTerminateJob(message: string): void {
  const { jobId, account } = TerminateJobSchema.parse(JSON.parse(message));
  const key = getCurrentWorkerJobKey(account, jobId);
  console.log(key);
  const aborter = jobCancelerMap.get(key);
  aborter?.();
  jobCancelerMap.delete(key);
}

export async function handleUpdateSystemInfo() {
  const [cpuData, memData, fsData] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
  ]);

  // Get root filesystem or first available
  const rootFs = fsData.find((fs) => fs.mount === "/") || fsData[0];
  const hostname2 = WORKER_NAME;
  const result = {
    hostname: hostname2,
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
  };

  return redis.set(getSystemInfoRedisKey(hostname2), JSON.stringify(result));
}
