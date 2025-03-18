import { parseJobWithData } from '@/lib/utils';
import { Job } from '@/types/queue';
import { useQuery, useMutation } from '@tanstack/react-query';
import { JobJson } from 'bullmq';

export const useJobDetail = (queueName: string, jobId: string) => {
  return useQuery({
    queryKey: ['job', queueName, jobId],
    queryFn: async (): Promise<Job> => {
      try {
        const response = await fetch(`/api/v2/queue/${queueName}/${jobId}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: JobJson = await response.json();
        return parseJobWithData(data);
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
        `/api/v2/queue/${queueName}/${jobId}/retry/${queueStatus}`,
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

export const useRecentJobs = () => {
  return useQuery({
    queryKey: ['recentJobs'],
    queryFn: async (): Promise<Job[]> => {
      try {
        const response = await fetch('/api/v2/dashboard/recentJobs');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: JobJson[] = await response.json();
        return data.map((job) => parseJobWithData(job));
      } catch (error) {
        console.error('Error fetching recent jobs:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
export const useRemoveJob = () => {
  return useMutation({
    mutationFn: async ({
      queueName,
      jobId,
    }: {
      queueName: string;
      jobId: string;
    }) => {
      const response = await fetch(`/api/v2/queue/${queueName}/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove job');
      }

      return response.json();
    },
  });
};
