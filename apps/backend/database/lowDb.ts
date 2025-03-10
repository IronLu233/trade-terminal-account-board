import { DataFile } from "lowdb/node";
import YAML from "yaml";
import path from "node:path";

type Config = {
  accounts: string[];
};

export const configDb = new DataFile<Config>(
  path.join(__dirname, "../config.yaml"),
  {
    parse: YAML.parse,
    stringify: YAML.stringify,
  }
);
