import { redisOptions } from "config";
import Redis from "ioredis";

export const redisChannel = new Redis(redisOptions);

export const redis = new Redis(redisOptions);
