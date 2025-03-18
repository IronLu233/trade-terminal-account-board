export type JobPayload = {
  script: string;
  arguments?: string;
  executionPath?: string;
  pid?: number;
  command?: string;
};
