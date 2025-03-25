import { logger, type JobPayload } from "common";
import { Worker } from "bullmq";
import { configDb, redisOptions, RedisChannel, Env } from "config";
import { spawn } from "child_process";
import Redis from "ioredis";
import z from "zod";

export function setupBullMQWorker(queueName: string) {
  logger.info(`Setting up BullMQ worker for queue: ${queueName}`);

  const worker = new Worker<JobPayload, { completedAt: Date }>(
    queueName,
    async (job) => {
      logger.info(`Starting job ${job.id} from queue ${queueName}`, {
        jobId: job.id,
        data: job.data,
      });

      return new Promise((resolve, reject) => {
        const { script, arguments: args, executionPath } = job.data;

        const argv = [
          "run",
          "python3",
          "-u",
          script,
          "--account",
          job.queueName,
        ];
        if (args) {
          // Properly split arguments by any whitespace and filter out empty strings
          const parsedArgs = args.match(/\S+/g) || [];
          argv.push(...parsedArgs);
        }

        logger.debug(`Spawning Python process for job ${job.id}`, {
          script,
          argv,
          executionPath: executionPath || Env.SCRIPT_PWD,
        });

        const child = spawn("pipenv", argv, {
          cwd: executionPath || Env.SCRIPT_PWD,
        });

        let stderr = "";

        child.stderr.on("data", (data: Buffer) => {
          stderr = `${data.toString()}`;
          logger.warn(`Job ${job.id} stderr:`, { stderr: data.toString() });
          job.log(`${new Date().toISOString()}[WARN]${data.toString()}`);
        });

        child.stdout.on("data", (data: Buffer) => {
          job.log(`${new Date().toISOString()}[INFO]${data.toString()}`);
        });

        child.on("close", (code) => {
          if (code === 0) {
            logger.info(`Job ${job.id} completed successfully`);
            resolve({ completedAt: new Date() });
          } else {
            logger.error(`Job ${job.id} failed with code ${code}`, { stderr });
            reject(new Error(stderr));
          }
        });

        job.updateData({
          ...job.data,
          pid: child.pid,
          command: ["pipenv", ...argv].join(" "),
        });
        return { jobId: `This is the return value of job (${job.id})` };
      });
    },
    {
      connection: redisOptions,
      maxStalledCount: 0,
      concurrency: 10,
      stalledInterval: 300_000,
    }
  );

  return worker;
}

const createWorkerMessageSchema = z.object({
  queueName: z.string(),
});

const workerInstances: Worker<JobPayload>[] = [];

function closeAllWorkers() {
  logger.info("close all workers");
  return workerInstances.map((worker) => worker.close(true));
}

function handleCreateWorker(message: string) {
  const { queueName } = createWorkerMessageSchema.parse(JSON.parse(message));
  workerInstances.push(setupBullMQWorker(queueName));
}

async function main() {
  const config = await configDb.read();
  const workers = config!.accounts.map(setupBullMQWorker);
  workerInstances.push(...workers);

  const redis = new Redis(redisOptions);

  await redis.subscribe(RedisChannel.CreateWorker);
  redis.on("message", (channel, message) => {
    switch (channel) {
      case RedisChannel.CreateWorker:
        return handleCreateWorker(message);
    }
  });

  process.on("exit", (code) => {
    closeAllWorkers();
  });

  process.on("SIGINT", () => {
    closeAllWorkers();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    closeAllWorkers();
    process.exit(0);
  });
}

main();
