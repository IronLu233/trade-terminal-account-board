import { Job, Queue as QueueMQ, type ConnectionOptions } from "bullmq";

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

  const jobs = await queue.getJobs(["active", "completed", "failed"]);
  return {
    name: queue.name,
    counts: await queue.getJobCounts(),
    lastUpdatedTime: await getQueueLatestUpdatedTime(queue),
    jobs,
  };
}

export async function getQueueList() {
  const queues = Array.from(queueMap.values());
  const result = [];

  for (const q of queues) {
    result.push({
      name: q.name,
      counts: await q.getJobCounts(),
      latestJobUpdatedTime: await getQueueLatestUpdatedTime(q),
    });
  }

  return result;
}
