import { hostname } from "os";

export function getCurrentWorkerJobKey(account: string, jobId: string) {
  return `${account}:${jobId}`;
}

export function getQueueNameByAccount(account: string, host = hostname()) {
  return `${host}💻${account}`;
}

export function getHostAccountInfoFromQueueName(name: string) {
  const [host, account] = name.split("💻");
  return {
    host,
    account,
  };
}

export function getSystemInfoRedisKey(
  host = process.env.HOSTNAME || hostname()
) {
  return `systemInfo💻${host}`;
}
