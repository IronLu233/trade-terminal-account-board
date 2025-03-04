import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
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
import { initializeDatabase } from "./database/data-source";
import templateRoutes from "./routes/templates";
import systemInfoRoutes from "./routes/system-info";
import { setupQueues } from "./queue";
import path from "path";

function readQueuesFromConfig() {
  try {
    return ACCOUNTS.map((q) => q.trim());
  } catch (e) {
    return [];
  }
}

const run = async () => {
  // Initialize database connection
  await initializeDatabase();
  const queues = setupQueues(readQueuesFromConfig(), redisOptions);

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
      uiBasePath:
        process.env.NODE_ENV === "production"
          ? path.dirname(require.resolve("frontend/package.json"))
          : undefined,
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

  // Register template routes
  app.register(templateRoutes, { prefix: "/api/templates" });
  app.register(systemInfoRoutes, { prefix: "/api/systemInfo" });

  const port = parseInt(process.env.PORT || "3000", 10);
  await app.listen({ host: "0.0.0.0", port });
  console.log(`For the UI, open http://localhost:${port}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
