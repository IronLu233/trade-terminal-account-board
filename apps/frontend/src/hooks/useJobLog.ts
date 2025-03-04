import { useQuery } from '@tanstack/react-query';

interface UseJobLogParams {
  queueName: string;
  jobId: string;
}

/**
 * Hook to fetch job logs for a specific job
 * @param queueName The name of the queue
 * @param jobId The ID of the job
 * @returns Query result containing logs as string[]
 */
export function useJobLog({ queueName, jobId }: UseJobLogParams) {
  return useQuery<string[]>({
    queryKey: ['jobLogs', queueName, jobId],
    queryFn: async () => {
      const response = await fetch(`/api/queues/${queueName}/${jobId}/logs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch job logs: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!queueName && !!jobId,
  });
}
