import fastify from "fastify";
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import templateRoutes from "./routes/template";
import systemInfoRoutes from "./routes/system-info";
import queueRoutes from "./routes/queue";
import dashboardRoutes from "./routes/dashboard";
import accountRoutes from "./routes/account";
import configRoutes from './routes/config';
import { setupQueues } from "./services/queue";
import path from "path";
import fastifyStatic from "@fastify/static";
import { Env } from "config";
import mongoose from "mongoose";

const run = async () => {
  // Initialize database connection
  await mongoose.connect(Env.MONGODB_URL)

  await setupQueues();

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
    },

    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  const uiBasePath = path.dirname(require.resolve("frontend/package.json"));

  app.register(fastifyStatic, {
    root: path.join(uiBasePath, "dist"),
    maxAge: "1d",
    immutable: true,
  });

  // Register template routes
  app.register(templateRoutes, { prefix: "/api/v2/template" });
  app.register(systemInfoRoutes, { prefix: "/api/v2/systemInfo" });
  app.register(queueRoutes, { prefix: "/api/v2/queue" });
  app.register(dashboardRoutes, { prefix: "/api/v2/dashboard" });
  app.register(accountRoutes, { prefix: "/api/v2/account" });
  app.register(configRoutes, { prefix: '/api/v2/config' })

  // Add catch-all route to handle SPA routing
  app.setNotFoundHandler(async (request, reply) => {
    // Only handle GET requests for the catch-all
    if (request.method === "GET") {
      // For API routes, we should return 404
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not found" });
      }

      // For all other routes, serve the frontend app
      return reply.sendFile("index.html", { maxAge: 0, immutable: false });
    }

    // Return 404 for non-GET requests
    return reply.code(404).send({ error: "Not found" });
  });
  const port = Env.PORT;
  await app.listen({ host: "0.0.0.0", port });
  console.log(`For the UI, open http://localhost:${port}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
