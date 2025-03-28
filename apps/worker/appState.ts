import { Worker } from "bullmq";
import z from "zod";
export const workerMap = new Map<string, Worker>();

export const jobCancelerMap = new Map<string, () => void>();

export const workers: Worker[] = [];

export const WORKER_NAME = z.string().parse(process.env.WORKER_NAME);
