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
import templateRoutes from "./routes/template";
import systemInfoRoutes from "./routes/system-info";
import queueRoutes from "./routes/queue";
import { setupQueues } from "./queue";
import path from "path";
import fastifyView from "@fastify/view";

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

  const uiBasePath = path.dirname(require.resolve("frontend/package.json"));

  createBullBoard({
    queues: Array.from(queues.values().map((q) => new BullMQAdapter(q))),
    serverAdapter,
    options: {
      uiBasePath:
        process.env.NODE_ENV === "production" ? uiBasePath : undefined,
      uiConfig: {
        boardTitle: "策略管理中心",
      },
    },
  });

  app.register(fastifyView, {
    engine: {
      ejs: require("ejs"),
    },
    root: path.join(uiBasePath, "dist"),
  });

  // Register template routes
  app.register(templateRoutes, { prefix: "/api/v2/template" });
  app.register(systemInfoRoutes, { prefix: "/api/v2/systemInfo" });
  app.register(queueRoutes, { prefix: "/api/v2/queue" });

  serverAdapter.setBasePath("/");
  app.register(serverAdapter.registerPlugin(), {
    prefix: "/",
    basePath: "/",
  });

  // Add catch-all route to handle SPA routing
  app.setNotFoundHandler(async (request, reply) => {
    // Only handle GET requests for the catch-all
    if (request.method === "GET") {
      // For API routes, we should return 404
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not found" });
      }

      // For all other routes, serve the frontend app
      return reply.view("index.ejs", {});
    }

    // Return 404 for non-GET requests
    return reply.code(404).send({ error: "Not found" });
  });
  const port = parseInt(process.env.PORT || "3000", 10);
  await app.listen({ host: "0.0.0.0", port });
  console.log(`For the UI, open http://localhost:${port}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
