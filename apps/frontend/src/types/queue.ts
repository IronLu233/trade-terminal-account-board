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
  description: string;
  createdAt: Date;
  updatedAt: Date;
  queueName?: string;
  script?: string;
  action?: string;
  executionPath?: string;
}

export interface Job {
  id: string;
  name: string;
  queueName: string;
  status: 'completed' | 'running' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  duration?: number;
  errorMessage?: string;
  command?: string;
  parameters?: Record<string, any>;
  logs?: string[];
}

export type JobStatus = 'all' | 'completed' | 'running' | 'failed';