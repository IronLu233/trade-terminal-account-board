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
  pid?: number;
  command?: string;
  templateName: string;
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

  lastJob?: Job;
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
  jobs: JobJson[];
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
export type Job = Omit<JobJson, 'data'> & {
  data: JobData;
  queueName?: string;
};

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
