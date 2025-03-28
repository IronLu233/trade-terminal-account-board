import YAML from "yaml";
import path from "path";
import { DataFile } from "lowdb/node";

export * from "./env";

export type Config = {
  provider: {
    accounts: string[];
  };
  customer: {
    workers: Array<{
      name: string;
    }>;
  };
};

export { redisOptions } from "./redis";

export enum RedisChannel {
  CreateWorker = "👷:create-worker",
  TerminateJob = "🔚:terminate-job",
  GetSystemInfo = "system-info",
}

export const configDb = new DataFile<Config>(
  path.join(__dirname, "./config.yaml"),
  {
    parse: YAML.parse,
    stringify: YAML.stringify,
  }
);
