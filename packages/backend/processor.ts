import { Worker } from "bullmq";
import { redisOptions } from "./redis";
import type { JobPayload } from "./types";
import { spawn } from "child_process";

export function setupBullMQProcessor(queueName: string) {
  new Worker<JobPayload, { completedAt: Date }>(
    queueName,
    async (job) => {
      return new Promise((resolve, reject) => {
        const { script, account, action } = job.data;

        const argv = [script, "--account", account];
        if (action) {
          argv.push("--action", action);
        }
        const child = spawn("python", argv, {
          cwd: process.env.SCRIPT_PWD,
        });

        let stderr = "";

        child.stderr.on("data", (data) => {
          stderr += data;
        });

        child.stdout.on("data", (data) => {
          job.log(data);
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
