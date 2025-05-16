import type { FastifyInstance } from "fastify";
import { configDb } from "config";

export default async function (app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const [workers, accounts] = await Promise.all([configDb.WorkerModel.find(), configDb.AccountModel.find()])

    return {
      workers: workers.map(it => it.toJSON()),
      accounts: accounts.map(it => it.toJSON())
    }
  });
}
