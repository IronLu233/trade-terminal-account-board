import {
  getCurrentWorkerJobKey,
  getQueueNameByAccount,
  logger,
  type JobPayload,
} from "common";
import { Worker } from "bullmq";
import { Env, redisOptions } from "config";
import { spawn } from "child_process";
import { jobCancelerMap, workers } from "./appState";
import { hostname } from "os";
export function setupBullMQWorker(account: string) {
  logger.info(
    `Setting up BullMQ worker for queue: ${account} in ${process.env.HOST_NAME || hostname()}`
  );

  const worker = new Worker<JobPayload, { completedAt: Date }>(
    getQueueNameByAccount(account, process.env.HOST_NAME || hostname()),
    async (job) => {
      logger.info(`Starting job ${job.id} from queue ${account}`, {
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
          stdio: ["pipe", "pipe", "pipe"],
          // onExit(subprocess, exitCode, signalCode, error) {
          //   const key = getCurrentWorkerJobKey(account, job.id!);
          //   jobCancelerMap.delete(key);
          //   if (exitCode === 0) {
          //     logger.info(`Job ${job.id} completed successfully`);
          //     resolve({ completedAt: new Date() });
          //   } else {
          //     logger.error(
          //       `Job ${job.id} failed with code ${exitCode} ${signalCode}`
          //     );
          //     reject(error);
          //   }
          // },
        });

        const textDecoder = new TextDecoder();

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

        jobCancelerMap.set(
          getCurrentWorkerJobKey(account, job.id!),
          async () => {
            if (child.exitCode === null) {
              child.kill();
            }
          }
        );

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
      stalledInterval: 120000,
    }
  );

  return worker;
}

export function closeAllWorkers() {
  logger.info("close all workers");
  return workers.map((worker) => worker.close(true));
}
