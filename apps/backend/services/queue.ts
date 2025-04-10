import { Job, Queue as QueueMQ } from "bullmq";

import { redisOptions, configDb, RedisChannel } from "config";
import { redisChannel } from "../services/redis";
import { pick } from "lodash-es";
import { getHostAccountInfoFromQueueName, getQueueNameByAccount } from "common";

const queueMap = new Map<string, QueueMQ>();

const createQueueMQ = (name: string) =>
  new QueueMQ(name, { connection: redisOptions });

export async function setupQueues() {
  const {
    provider: { accounts },
    customer: { workers },
  } = (await configDb.read())!;

  const queueNames = accounts.flatMap((account) =>
    workers.map((host) => getQueueNameByAccount(account, host.name))
  );

  for (const name of queueNames) {
    queueMap.set(name, createQueueMQ(name));
  }

  return Array.from(queueMap.values());
}

export function getQueueByName(queueName: string) {
  return queueMap.get(queueName);
}

export async function getQueuesByAccount(account: string) {
  const {
    customer: { workers },
  } = (await configDb.read())!;

  const queueNames = workers.map((host) =>
    getQueueNameByAccount(account, host.name)
  );

  return queueNames.map(getQueueByName);
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

export async function getAccountWithJobs(account: string) {
  const queues = await getQueuesByAccount(account);
  return Promise.all(queues.map((q) => getQueueWithJobs(q!.name)));
}

export async function getQueueListJson(hostName: string) {
  const queues = Array.from(queueMap.values()).filter(queue => {
    const { host } = getHostAccountInfoFromQueueName(queue.name);
    return host === hostName;
  });
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

    const { host, account } = getHostAccountInfoFromQueueName(q.name);

    result.push({
      name: q.name,
      host,
      account,
      counts: await q.getJobCounts(),
      latestJobUpdatedTime: await getQueueLatestUpdatedTime(q),
      lastJob: jobJson && {
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

  return result.sort((a, b) => {
    // 如果两个队列都没有 lastJob，保持原顺序
    if (!a.lastJob && !b.lastJob) return 0;
    // 如果 a 没有 lastJob，排在后面
    if (!a.lastJob) return 1;
    // 如果 b 没有 lastJob，排在后面
    if (!b.lastJob) return -1;

    // 获取任务状态
    const getJobStatus = (job: any) => {
      if (job.finishedOn) return 'completed';
      if (job.failedReason) return 'failed';
      return 'active';
    };

    const statusA = getJobStatus(a.lastJob);
    const statusB = getJobStatus(b.lastJob);

    // 定义状态优先级
    const statusPriority = {
      active: 3,
      completed: 2,
      failed: 1
    };

    // 如果状态不同，按状态优先级排序
    if (statusPriority[statusA] !== statusPriority[statusB]) {
      return statusPriority[statusB] - statusPriority[statusA];
    }

    // 如果状态相同，按 processedOn 时间从晚到早排序
    return (b.lastJob.processedOn || 0) - (a.lastJob.processedOn || 0);
  });
}

export function getQueueList() {
  return Array.from(queueMap.values());
}

export async function createQueue(name: string) {
  const originConfig = await configDb.read();

  if (queueMap.has(name)) {
    throw new Error(`Queue with name "${name}" already exists`);
  }

  originConfig!.provider.accounts = [...originConfig!.provider.accounts!, name];

  await configDb.write(originConfig!);

  const queue = createQueueMQ(name);
  queueMap.set(name, queue);
  redisChannel.publish(
    RedisChannel.CreateWorker,
    JSON.stringify({ queueName: name })
  );
  return queue;
}
