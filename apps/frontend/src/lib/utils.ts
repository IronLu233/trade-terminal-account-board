import { Job, JobData } from '@/types/queue';
import { JobJson } from 'bullmq';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getJobStatus(
  job: JobJson | Job,
): 'failed' | 'completed' | 'active' | 'unknown' {
  if (job.failedReason) {
    return 'failed';
  }

  if (job.finishedOn) {
    return 'completed';
  }

  if (job.processedOn) {
    return 'active';
  }
  return 'unknown';
}

export function parseJobWithData(job: JobJson) {
  return {
    ...job,
    data: (typeof job.data === 'string'
      ? JSON.parse(job.data)
      : job.data) as JobData,
  };
}
