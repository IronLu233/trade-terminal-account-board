import { Job, Queue as QueueMQ, type JobJson } from "bullmq";

import { redisOptions, configDb, RedisChannel } from "config";
import { redis } from "../services/redis";
import { pick } from "lodash-es";

const queueMap = new Map<string, QueueMQ>();

const createQueueMQ = (name: string) =>
  new QueueMQ(name, { connection: redisOptions });

export async function setupQueues() {
  const { accounts } = (await configDb.read()) as { accounts: string[] };
  for (const account of accounts) {
    queueMap.set(account, createQueueMQ(account));
  }

  return Array.from(queueMap.values());
}

export function getQueueByName(queueName: string) {
  return queueMap.get(queueName);
}

async function getQueueLatestUpdatedTime(queue: QueueMQ) {
  const jobs: Job[] = await queue.getJobs(["active", "completed", "failed"]);
  jobs.sort(
    (a, b) => (b.asJSON().processedOn || 0) - (a.asJSON().processedOn || 0)
  );
  const latestJob = jobs[0];
  return latestJob?.asJSON().processedOn;
}

export async function getQueueWithJobs(queueName: string) {
  const queue = getQueueByName(queueName);

  if (!queue) {
    throw new Error(`Queue with name "${queueName}" not found`);
  }

  const jobs = await queue.getJobs();
  return {
    name: queue.name,
    counts: await queue.getJobCounts(),
    lastUpdatedTime: await getQueueLatestUpdatedTime(queue),
    jobs,
  };
}

export async function getQueueListJson() {
  const queues = Array.from(queueMap.values());
  const result = [];

  for (const q of queues) {
    const [[lastActiveJob], [lastCompletedJob], [lastFailedJob]] =
      (await Promise.all([
        await q.getJobs("active", 0, 1),
        await q.getJobs("completed", 0, 1),
        await q.getJobs("failed", 0, 1),
      ])) as [[Job], [Job], [Job]];

    // Find the latest job among active, completed, and failed jobs
    const lastJob = [lastActiveJob, lastCompletedJob, lastFailedJob]
      .filter(Boolean)
      .sort(
        (a, b) => (b.asJSON().processedOn || 0) - (a.asJSON().processedOn || 0)
      )[0];

    const jobJson = lastJob?.asJSON();

    if (jobJson && jobJson.failedReason) {
      // Truncate failedReason
      jobJson.failedReason = "...";
    }

    result.push({
      name: q.name,
      counts: await q.getJobCounts(),
      latestJobUpdatedTime: await getQueueLatestUpdatedTime(q),
      lastJob: {
        ...pick(jobJson, [
          "name",
          "id",
          "finishedOn",
          "processedOn",
          "failedReason",
          "data",
        ]),
      },
    });
  }

  return result;
}

export function getQueueList() {
  return Array.from(queueMap.values());
}

export async function createQueue(name: string) {
  const originConfig = await configDb.read();

  if (queueMap.has(name)) {
    throw new Error(`Queue with name "${name}" already exists`);
  }

  await configDb.write({
    ...originConfig,
    accounts: [...originConfig!.accounts, name],
  });

  const queue = createQueueMQ(name);
  queueMap.set(name, queue);
  redis.publish(RedisChannel.CreateWorker, JSON.stringify({ queueName: name }));
  return queue;
}
