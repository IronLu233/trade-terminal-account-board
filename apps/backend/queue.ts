import { Queue as QueueMQ, type ConnectionOptions } from "bullmq";

const queueMap = new Map<string, QueueMQ>();

const createQueueMQ = (name: string, redisOptions: ConnectionOptions) =>
  new QueueMQ(name, { connection: redisOptions });

export function setupQueues(
  accounts: string[],
  redisOptions: ConnectionOptions
) {
  for (const account of accounts) {
    queueMap.set(account, createQueueMQ(account, redisOptions));
  }

  return Array.from(queueMap.values());
}

export function getQueueByName(queueName: string) {
  return queueMap.get(queueName);
}
