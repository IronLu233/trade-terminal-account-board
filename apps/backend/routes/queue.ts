import { type FastifyPluginAsync } from "fastify";
import {
  getQueueByName,
  getQueueList,
  getQueueWithJobs,
  createQueue,
} from "../services/queue";
import { z } from "zod";
import type { Job } from "bullmq";
import { type JobPayload } from "../utils/types";

const queueRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all queues
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: z.object({
            list: z.array(
              z.object({
                name: z.string(),
                counts: z.record(z.number()),
                latestJobUpdatedTime: z.number().nullable().optional(),
              })
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const queues = await getQueueList();
      return { list: queues };
    }
  );

  fastify.post<{
    Body: {
      queueName: string;
    };
  }>(
    "/",
    {
      schema: {
        body: z.object({
          queueName: z.string().min(1),
        }),
        response: {
          201: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { queueName } = request.body;
        await createQueue(queueName);
        return reply.code(201).send({
          success: true,
          message: `Queue "${queueName}" has been created successfully`,
        });
      } catch (error) {
        reply.code(400);
        return { error: (error as Error).message };
      }
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
        response: {
          200: z.object({
            name: z.string(),
            counts: z.record(z.number()),
            lastUpdatedTime: z.number().nullable().optional(),
            jobs: z.array(z.any()), // Using any since Job type is complex
          }),
          404: z.object({
            error: z.string(),
          }),
        },
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
        response: {
          200: z.any(),
          404: z.object({
            error: z.string(),
          }),
        },
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
        response: {
          200: z.any(),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { queueName, jobId } = request.params;
      const queue = getQueueByName(queueName);

      if (!queue) {
        reply.code(404);
        return { error: `Queue with name "${queueName}" not found` };
      }

      const { logs } = await queue.getJobLogs(jobId);
      return logs;
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

        const jobData = job.data as JobPayload;
        const pid = jobData.pid;

        if (!pid) {
          return reply.code(404).send({ error: "No PID found for this job" });
        }

        // Send SIGINT signal (Ctrl+C) to the process
        process.kill(pid, "SIGINT");
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
};

export default queueRoutes;
