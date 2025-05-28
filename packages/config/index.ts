import YAML from "yaml";
import path from "path";
import * as mongoose from "mongoose";
import { DataFile } from "lowdb/node";

export * from "./env";

export { redisOptions } from "./redis";

export enum RedisChannel {
  CreateAccount = "👷:create-account",
  TerminateJob = "🔚:terminate-job",
  GetSystemInfo = "📊:system-info",
  RemoveAccount = '❌:remove-account'
}

const accountSchema = new mongoose.Schema({
  account: {type: String, required: true}
})

const AccountModel = mongoose.model('account', accountSchema);

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true }
})

const WorkerModel = mongoose.model('worker', workerSchema);

export const configDb = {
  AccountModel,
  WorkerModel
}
