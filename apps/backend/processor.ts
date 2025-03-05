import { Worker } from "bullmq";
import { redisOptions } from "./redis";
import type { JobPayload } from "./types";
import { spawn } from "child_process";

export function setupBullMQProcessor(queueName: string) {
  new Worker<JobPayload, { completedAt: Date }>(
    queueName,
    async (job) => {
      return new Promise((resolve, reject) => {
        const { script, arguments: args, executionPath } = job.data;

        const argv = ["-u", script, "--account", job.queueName];
        if (args) {
          // Properly split arguments by any whitespace and filter out empty strings
          const parsedArgs = args.match(/\S+/g) || [];
          argv.push(...parsedArgs);
        }

        console.log(argv);

        const child = spawn(process.env.PYTHON_EXEC_BIN || "python", argv, {
          cwd: executionPath || process.env.SCRIPT_PWD,
        });

        let stderr = "";

        child.stderr.on("data", (data: Buffer) => {
          stderr += `${data.toString()}`;
          job.log(`${new Date().toISOString()}[ERROR]${data.toString()}`);
        });

        child.stdout.on("data", (data: Buffer) => {
          job.log(`${new Date().toISOString()}[INFO]${data.toString()}`);
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve({ completedAt: new Date() });
          } else {
            reject(new Error(stderr));
          }
        });
        return { jobId: `This is the return value of job (${job.id})` };
      });
    },
    { connection: redisOptions }
  );
}
