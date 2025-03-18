import type { FastifyPluginAsync } from "fastify";
import { getQueueList } from "../services/queue";
import { Job } from "bullmq";

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  const queues = getQueueList();

  fastify.get("/recentJobs", async (request, reply) => {
    try {
      const sevenDayAgo = Date.now() - 24 * 60 * 60 * 1000 * 7;
      let allJobs: Job[] = [];

      // Get jobs from all queues
      for (const queue of queues) {
        const jobs = await queue.getJobs(["active", "failed"]);
        allJobs = [...allJobs, ...jobs];
      }

      // Filter jobs within last 24 hours
      const recentJobs = allJobs.filter((job) => {
        const processedOn = job.processedOn || 0;
        return processedOn >= sevenDayAgo;
      });

      // Sort jobs: active first, then by processedOn time
      recentJobs.sort((a, b) => {
        const aState = a.failedReason ? "failed" : "active";
        const bState = b.failedReason ? "failed" : "active";

        if (aState !== bState) {
          return aState === "active" ? -1 : 1;
        }

        // Same status, sort by processedOn time (oldest first)
        const aTime = a.processedOn || 0;
        const bTime = b.processedOn || 0;
        return aTime - bTime;
      });

      // Convert to JSON format
      const jsonJobs = recentJobs.map((job) => ({
        ...job.asJSON(),
        queueName: job.queueName,
      }));

      return reply.send(jsonJobs);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch recent jobs" });
    }
  });
};

export default dashboardRoutes;
