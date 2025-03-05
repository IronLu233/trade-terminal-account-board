export interface QueueStats {
  queueName: string;
  running: number;
  successful: number;
  failed: number;
  lastUpdated: Date;
}

export interface Template {
  id: string;
  name: string;
  script: string;
  arguments?: string;
  executionPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobData {
  script: string;
  action: string;
  account: string;
  [key: string]: any; // Allow for additional properties
}

export interface JobReturnValue {
  completedAt?: string;
  [key: string]: any; // Allow for additional properties
}

export interface Job {
  id: string;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  progress: number;
  attempts: number;
  delay: number;
  stacktrace: string[];
  failedReason?: string;
  opts: {
    attempts: number;
    [key: string]: any;
  };
  data: JobData;
  name: string;
  returnValue?: JobReturnValue;
  isFailed: boolean;
  attemptsMade: number;
  maxAttempts: number;
  lastRetryTime?: number;
}

export interface Queue {
  name: string;
  statuses?: JobStatus[];
  counts?: Counts;
  jobs?: Job[];
  pagination?: Pagination;
  readOnlyMode?: boolean;
  allowRetries?: boolean;
  allowCompletedRetries?: boolean;
  isPaused?: boolean;
  type?: Type;
  delimiter?: string;
}

export interface Counts {
  active?: number;
  completed?: number;
  delayed?: number;
  failed?: number;
  paused?: number;
  prioritized?: number;
  waiting?: number;
  'waiting-children'?: number;
}

type Type = 'bullmq';

export interface Pagination {
  pageCount?: number;
  range?: Range;
}

export type JobStatus =
  | 'latest'
  | 'active'
  | 'waiting'
  | 'waiting-children'
  | 'prioritized'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused';
