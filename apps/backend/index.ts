import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { Queue as QueueMQ } from "bullmq";
import fastify from "fastify";
import { setupBullMQProcessor } from "./processor";
import { redisOptions } from "./redis";
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import ACCOUNTS from "./accounts.json";
import path from "path";

const createQueueMQ = (name: string) =>
  new QueueMQ(name, { connection: redisOptions });

function readQueuesFromConfig() {
  try {
    return ACCOUNTS.map((q) => q.trim());
  } catch (e) {
    return [];
  }
}

const run = async () => {
  const queues = new Map(
    readQueuesFromConfig().map((q) => [q, createQueueMQ(q)])
  );

  queues.forEach((q) => {
    setupBullMQProcessor(q.name);
  });

  const app = fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(import("@fastify/swagger"), {
    transform: jsonSchemaTransform,
  });
  await app.register(import("@fastify/swagger-ui"), {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  const serverAdapter = new FastifyAdapter();

  createBullBoard({
    queues: Array.from(queues.values().map((q) => new BullMQAdapter(q))),
    serverAdapter,
    options: {
      uiBasePath: path.dirname(require.resolve("frontend/package.json")),
      uiConfig: {
        boardTitle: "策略管理中心",
      },
    },
  });

  serverAdapter.setBasePath("/");
  app.register(serverAdapter.registerPlugin(), {
    prefix: "/",
    basePath: "/",
  });

  const port = 3000;
  await app.listen({ host: "0.0.0.0", port });
  // eslint-disable-next-line no-console
  console.log(`For the UI, open http://localhost:${port}`);
};

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
