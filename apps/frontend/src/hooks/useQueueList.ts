import { parseJobWithData } from '@/lib/utils';
import {
  JobList,
  QueueDetailResponse,
  QueueDetails,
  Job,
  JobStatus,
} from '@/types/queue';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { JobJson } from 'bullmq';

interface FetchQueuesResponse {
  queues: JobList;
}

interface UseQueueListOptions {
  hostname: string;
  enabled?: boolean;
}

const fetchQueues = async (hostname: string): Promise<FetchQueuesResponse> => {
  const url = `/api/v2/queue?hostname=${hostname}`;
  const response = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch queues');
  }

  const data: { list: JobList } = await response.json();

  return {
    queues: data.list.map((it) => ({
      ...it,
      lastJob: it.lastJob && parseJobWithData(it.lastJob as unknown as JobJson),
    })),
  };
};

export const useQueueList = ({ hostname, enabled }: UseQueueListOptions) => {
  return useQuery({
    queryKey: ['queues', hostname],
    queryFn: () => fetchQueues(hostname),
    staleTime: 5000,
    refetchInterval: 10000,
    enabled: enabled,
  });
};

/**
 * 提供一个函数用于使队列列表缓存失效
 * @returns 使队列列表缓存失效的函数
 */
export const useInvalidateQueueList = () => {
  const queryClient = useQueryClient();

  const invalidateQueueList = () => {
    return queryClient.invalidateQueries({ queryKey: ['queues'] });
  };

  return { invalidateQueueList };
};

interface UseQueueDetailOptions {
  activeQueue?: string;
}

/**
 * Hook to fetch details for a specific queue including its jobs
 * @param options Options containing the queue name
 * @returns Query result with queue details and jobs grouped by status
 */
export function useQueueDetail({ activeQueue }: UseQueueDetailOptions = {}) {
  return useQuery({
    queryKey: ['queue', activeQueue],
    queryFn: async (): Promise<QueueDetails> => {
      if (!activeQueue) {
        throw new Error('Queue name is required');
      }

      const response = await fetch(`/api/v2/queue/${activeQueue}`, {
        headers: {
          accept: 'application/json',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch queue details: ${response.statusText}`,
        );
      }

      const data: QueueDetailResponse = await response.json();

      // Simplify job grouping to just completed, active, and failed
      const jobsByStatus: Record<JobStatus, Job[]> = {
        latest: data.jobs.map(parseJobWithData) || [],
        // Active: jobs that are not finished (no finishedOn) and are being processed or waiting
        active:
          data.jobs?.filter((job) => !job.finishedOn).map(parseJobWithData) ||
          [],
        // Completed: jobs that are finished successfully (have finishedOn and not failed)
        completed:
          data.jobs
            ?.filter((job) => job.finishedOn && !job.failedReason)
            .map(parseJobWithData) || [],
        // Failed: jobs that have a failedReason
        failed:
          data.jobs
            ?.filter((job) => !!job.failedReason)
            .map(parseJobWithData) || [],
        // Keep empty arrays for other statuses to maintain type compatibility
        delayed: [],
        waiting: [],
        'waiting-children': [],
        prioritized: [],
        paused: [],
      };

      return {
        name: data.name,
        counts: data.counts || {},
        lastUpdatedTime: data.lastUpdatedTime,
        isPaused: Boolean(data.counts?.paused && data.counts.paused > 0),
        type: 'default', // Default queue type
        allowRetries: true, // Default value
        readOnlyMode: false, // Default value
        jobs: data.jobs.map(parseJobWithData) || [],
        jobsByStatus,
      };
    },
    enabled: Boolean(activeQueue),
    staleTime: 5000,
    refetchInterval: 10000,
  });
}

export function useCreateQueue() {
  const queryClient = useQueryClient();

  /**
   * Create a new queue with the specified name
   * @param name The name of the queue to create (also used as --account parameter)
   * @returns Promise with the created queue response
   */
  const createQueue = async (name: string) => {
    const response = await fetch(`/api/v2/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ queueName: name }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create queue');
    }

    const data = await response.json();

    // Invalidate queues cache to refresh the list
    queryClient.invalidateQueries({ queryKey: ['queues'] });

    return data;
  };

  return { createQueue };
}
