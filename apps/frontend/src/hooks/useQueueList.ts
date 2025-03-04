import { JobStatus, Queue } from '@/types/queue';
import { useQuery } from '@tanstack/react-query';

interface FetchQueuesResponse {
  queues: Queue[];
}

export interface Pagination {
  pageCount?: number;
  range?: Range;
}

export interface Range {
  start?: number;
  end?: number;
}

interface UseQueueListParams {
  page?: number;
  jobsPerPage?: number;
  activeQueue?: string;
  status?: JobStatus;
}

const fetchQueues = async ({
  page = 1,
  jobsPerPage = 10,

  // if activeQueue provides, job list will return in that queue item
  activeQueue,
  status,
}: UseQueueListParams): Promise<FetchQueuesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    jobsPerPage: jobsPerPage.toString(),
  });

  if (activeQueue) {
    params.append('activeQueue', activeQueue);
  }
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`/api/queues?${params.toString()}`, {
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

  return response.json();
};

export const useQueueList = (params: UseQueueListParams = {}) => {
  return useQuery({
    queryKey: ['queues', params],
    queryFn: () => fetchQueues(params),
    staleTime: 5000,
    refetchInterval: 10000,
  });
};
