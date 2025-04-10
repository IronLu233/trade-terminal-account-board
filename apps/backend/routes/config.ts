import type { FastifyInstance } from "fastify";
import { configDb } from "config";

export default async function (app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const config = await configDb.read();
    return config;
  });
}
