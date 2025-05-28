import { type FastifyPluginAsync } from "fastify";
import {
  getQueueByName,
  getQueueListJson,
  getQueueWithJobs,
} from "../services/queue";
import { z } from "zod";
import type { Job } from "bullmq";
import { getHostAccountInfoFromQueueName, type JobPayload, PrismaClient } from "common";
import { redisChannel } from "../services/redis";
import { RedisChannel } from "config";

const client = new PrismaClient();

const queueRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all queues
  fastify.get<{
    Querystring: {
      hostname: string;
    };
  }>(
    "/",
    {
      schema: {
        querystring: z.object({
          hostname: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { hostname } = request.query;
      const queues = await getQueueListJson(hostname);
      return { list: queues };
    }
  );

  // Get specific queue by name
  fastify.get<{
    Params: {
      queueName: string;
    };
  }>(
    "/:queueName",
    {
      schema: {
        params: z.object({
          queueName: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { queueName } = request.params;
        const queue = await getQueueWithJobs(queueName);
        return queue;
      } catch (error) {
        reply.code(404);
        return { error: (error as Error).message };
      }
    }
  );

  // Get specific job by ID from a queue
  fastify.get<{
    Params: {
      queueName: string;
      jobId: string;
    };
  }>(
    "/:queueName/:jobId",
    {
      schema: {
        params: z.object({
          queueName: z.string(),
          jobId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { queueName, jobId } = request.params;
        const queue = getQueueByName(queueName);

        if (!queue) {
          reply.code(404);
          return { error: `Queue with name "${queueName}" not found` };
        }

        const job: Job | undefined = await queue.getJob(jobId);

        if (!job) {
          reply.code(404);
          return {
            error: `Job with ID "${jobId}" not found in queue "${queueName}"`,
          };
        }

        return job.asJSON();
      } catch (error) {
        reply.code(404);
        return { error: (error as Error).message };
      }
    }
  );

  fastify.get<{
    Params: {
      queueName: string;
      jobId: string;
    };
  }>(
    "/:queueName/:jobId/logs",
    {
      schema: {
        params: z.object({
          queueName: z.string(),
          jobId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { queueName, jobId } = request.params;
      const queue = getQueueByName(queueName);

      if (!queue) {
        reply.code(404);
        return { error: `Queue with name "${queueName}" not found` };
      }

      const logs = await client.workerLog.findMany({
        where: { jobId },
        orderBy: { timestamp: "desc" },
        take: 100,
      });

      return logs.map(log => log.message).reverse();
    }
  );

  // Terminate a specific job by ID from a queue
  fastify.post<{
    Params: {
      queueName: string;
      jobId: string;
    };
  }>(
    "/:queueName/:jobId/terminate",
    {
      schema: {
        params: z.object({
          queueName: z.string(),
          jobId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { queueName, jobId } = request.params;

      try {
        const queue = getQueueByName(queueName);

        if (!queue) {
          return reply
            .code(404)
            .send({ error: `Queue '${queueName}' not found` });
        }

        const job: Job = await queue.getJob(jobId);

        if (!job) {
          return reply.code(404).send({ error: `Job '${jobId}' not found` });
        }

        const jobData = job.data as JobPayload;
        const pid = jobData.pid;

        if (!pid) {
          return reply.code(404).send({ error: "No PID found for this job" });
        }

        // Also publish a message to Redis channel for worker-side termination
        const account = getHostAccountInfoFromQueueName(queueName).account;

        await redisChannel.publish(
          RedisChannel.TerminateJob,
          JSON.stringify({
            jobId,
            account,
          })
        );

        return reply.send({
          success: true,
          message: `SIGINT signal sent to process ${pid}`,
        });
      } catch (error) {
        return reply.code(500).send({
          error: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  );

  // Delete a specific job by ID from a queue
  fastify.delete<{
    Params: {
      queueName: string;
      jobId: string;
    };
  }>(
    "/:queueName/:jobId",
    {
      schema: {
        params: z.object({
          queueName: z.string(),
          jobId: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { queueName, jobId } = request.params;

      try {
        const queue = getQueueByName(queueName);

        if (!queue) {
          return reply
            .code(404)
            .send({ error: `Queue '${queueName}' not found` });
        }

        const job: Job = await queue.getJob(jobId);

        if (!job) {
          return reply.code(404).send({ error: `Job '${jobId}' not found` });
        }

        await job.remove();

        return reply.send({
          success: true,
          message: `Job ${jobId} has been removed from queue ${queueName}`,
        });
      } catch (error) {
        return reply.code(500).send({
          error: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  );
};

export default queueRoutes;
