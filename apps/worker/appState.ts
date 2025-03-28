import { Worker } from "bullmq";

export const workerMap = new Map<string, Worker>();

export const jobCancelerMap = new Map<string, () => void>();

export const workers: Worker[] = [];
