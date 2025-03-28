import { z } from "zod";

export function getCurrentWorkerJobKey(account: string, jobId: string) {
  return `${account}:${jobId}`;
}

export function getQueueNameByAccount(
  account: string,
  workerName = z.string().parse(process.env.WORKER_NAME)
) {
  return `${workerName}💻${account}`;
}

export function getHostAccountInfoFromQueueName(name: string) {
  const [host, account] = name.split("💻");
  return {
    host,
    account,
  };
}

export function getSystemInfoRedisKey(
  host = z.string().parse(process.env.WORKER_NAME)
) {
  return `systemInfo💻${host}`;
}
