import { Job } from '@/types/queue';
import { useQuery, useMutation } from '@tanstack/react-query';

export interface JobDetailResponse {
  job: Job;
  status: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed';
}

export const useJobDetail = (queueName: string, jobId: string) => {
  return useQuery({
    queryKey: ['job', queueName, jobId],
    queryFn: async (): Promise<JobDetailResponse> => {
      try {
        const response = await fetch(`/api/queues/${queueName}/${jobId}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: JobDetailResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching job details:', error);
        throw error;
      }
    },
    refetchInterval: 5_000,
    enabled: !!queueName && !!jobId, // Only run the query if both parameters are provided
  });
};

export const useRetryJob = (
  queueName: string,
  jobId: string,
  queueStatus: string,
) => {
  return useMutation({
    mutationFn: async () => {
      debugger;
      const response = await fetch(
        `/api/queues/${queueName}/${jobId}/retry/${queueStatus}`,
        {
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to retry job');
      }

      return response.json();
    },
  });
};

export const useTerminateJob = (queueName: string, jobId: string) => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/v2/queue/${queueName}/${jobId}/terminate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Add empty object as body
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel job');
      }

      return response.json();
    },
  });
};
