import { JobJson } from 'bullmq';

export interface QueueStats {
  queueName: string;
  running: number;
  successful: number;
  failed: number;
  lastUpdated: Date | null;
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

// New interface to match the backend response for a specific queue with its jobs
export type JobList = {
  name: string;
  counts: Counts;
  latestJobUpdatedTime?: number | null;
  jobs: JobJson[];
}[];

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

// Define the interface for the queue detail response from API
export interface QueueDetailResponse {
  name: string;
  counts: Counts;
  lastUpdatedTime?: number | null;
  jobs: Job[];
}

// Enhanced QueueDetails interface with jobsByStatus
export interface QueueDetails {
  name: string;
  counts: Counts;
  lastUpdatedTime?: number | null;
  isPaused: boolean;
  type: string;
  allowRetries: boolean;
  readOnlyMode: boolean;
  jobs: Job[];
  jobsByStatus: Record<JobStatus, Job[]>;
}

// Job interface aligned with backend JobJson
export interface Job {
  name: string;
  data: {
    script: string;
    arguments?: string;
    executionPath?: string;
    pid?: number;
    [key: string]: any;
  };
  opts?: {
    attempts: number;
    [key: string]: any;
  };
  id: string;
  progress: number;
  returnvalue?: {
    completedAt?: string;
    [key: string]: any;
  };
  stacktrace: any[];
  delay: number;
  priority: number;
  attemptsStarted: number;
  attemptsMade: number;
  timestamp: number;
  queueQualifiedName?: string;
  finishedOn?: number;
  processedOn?: number;
  failedReason?: string;
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
