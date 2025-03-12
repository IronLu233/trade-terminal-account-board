import { Worker } from "bullmq";
import { redisOptions } from "../config/redis";
import type { JobPayload } from "../utils/types";
import { spawn } from "child_process";
import logger from "../utils/logger";

export function setupBullMQProcessor(queueName: string) {
  logger.info(`Setting up BullMQ processor for queue: ${queueName}`);

  new Worker<JobPayload, { completedAt: Date }>(
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
          executionPath: executionPath || process.env.SCRIPT_PWD,
        });

        const child = spawn("pipenv", argv, {
          cwd: executionPath || process.env.SCRIPT_PWD,
        });

        let stderr = "";

        child.stderr.on("data", (data: Buffer) => {
          stderr += `${data.toString()}`;
          logger.warn(`Job ${job.id} stderr:`, { stderr: data.toString() });
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
        });
        return { jobId: `This is the return value of job (${job.id})` };
      });
    },
    { connection: redisOptions }
  );
}
