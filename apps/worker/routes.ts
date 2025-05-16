import { RedisChannel } from "config";
import { z } from "zod";
import { jobCancelerMap, WORKER_NAME, workers } from "./appState";
import { setupBullMQWorker } from "./worker";
import { getCurrentWorkerJobKey, getQueueNameByAccount, getSystemInfoRedisKey } from "common";
import si from "systeminformation";
import { redis } from "./redis";

export function handleRedisRoute(channel: string, message: string) {
  console.log(`[handleRedisRoute] Received message on channel: ${channel}`);
  switch (channel) {
    case RedisChannel.CreateAccount:
      console.log(`[handleRedisRoute] Handling CreateAccount message: ${message}`);
      return handleCreateWorker(message);
    case RedisChannel.TerminateJob:
      console.log(`[handleRedisRoute] Handling TerminateJob message: ${message}`);
      return handleTerminateJob(message);
    case RedisChannel.RemoveAccount:
      console.log(`[handleRedisRoute] Handling RemoveAccount message: ${message}`);
      return handleRemoveWorker(message);
    default:
      console.log(`[handleRedisRoute] Unhandled channel: ${channel}`);
  }
}

const createWorkerMessageSchema = z.object({
  account: z.string(),
});

function handleCreateWorker(message: string) {
  console.log(`[handleCreateWorker] Processing message: ${message}`);
  try {
    const { account } = createWorkerMessageSchema.parse(JSON.parse(message));
    console.log(`[handleCreateWorker] Creating worker for account: ${account}`);
    workers.push(setupBullMQWorker(account));
    console.log(`[handleCreateWorker] Worker created successfully, total workers: ${workers.length}`);
  } catch (error) {
    console.error(`[handleCreateWorker] Error creating worker:`, error);
  }
}

function handleRemoveWorker(message: string) {
  console.log(`[handleRemoveWorker] Processing message: ${message}`);
  try {
    const { account } = createWorkerMessageSchema.parse(JSON.parse(message));
    console.log(`[handleRemoveWorker] Removing worker for account: ${account}`);
    const workerIndex = workers.findIndex(it => it.name === getQueueNameByAccount(account, process.env.HOST_NAME));

    if (workerIndex !== -1) {
      console.log(`[handleRemoveWorker] Found worker at index ${workerIndex}, closing...`);
      workers[workerIndex].close(true);
    } else {
      console.log(`[handleRemoveWorker] No worker found for account: ${account}`);
    }

    // remove workerIndex in workers.
    if (workerIndex !== -1) {
      workers.splice(workerIndex, 1);
      console.log(`[handleRemoveWorker] Worker removed, remaining workers: ${workers.length}`);
    }
  } catch (error) {
    console.error(`[handleRemoveWorker] Error removing worker:`, error);
  }
}

const TerminateJobSchema = z.object({
  jobId: z.string(),
  account: z.string(),
});
function handleTerminateJob(message: string): void {
  console.log(`[handleTerminateJob] Processing message: ${message}`);
  try {
    const { jobId, account } = TerminateJobSchema.parse(JSON.parse(message));
    const key = getCurrentWorkerJobKey(account, jobId);
    console.log(`[handleTerminateJob] Terminating job with key: ${key}`);
    const aborter = jobCancelerMap.get(key);

    if (aborter) {
      console.log(`[handleTerminateJob] Aborter found, terminating job`);
      aborter();
      jobCancelerMap.delete(key);
      console.log(`[handleTerminateJob] Job terminated and removed from cancelerMap`);
    } else {
      console.log(`[handleTerminateJob] No aborter found for key: ${key}`);
    }
  } catch (error) {
    console.error(`[handleTerminateJob] Error terminating job:`, error);
  }
}

export async function handleUpdateSystemInfo() {
  console.log(`[handleUpdateSystemInfo] Collecting system information...`);
  try {
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

    await redis.set(getSystemInfoRedisKey(hostname2), JSON.stringify(result));
    return true;
  } catch (error) {
    console.error(`[handleUpdateSystemInfo] Error updating system info:`, error);
    return false;
  }
}
