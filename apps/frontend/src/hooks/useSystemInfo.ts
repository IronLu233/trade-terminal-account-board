import { useQuery } from '@tanstack/react-query';

interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  redis: {
    usedMemory: number;
    usedMemoryHuman: string;
    totalSystemMemory: number;
    totalSystemMemoryHuman: string;
  };
}

async function fetchSystemInfo(): Promise<SystemInfo> {
  const response = await fetch('/api/v2/systemInfo');
  if (!response.ok) {
    throw new Error('Failed to fetch system info');
  }
  return response.json();
}

export function useSystemInfo() {
  return useQuery({
    queryKey: ['systemInfo'],
    queryFn: fetchSystemInfo,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}
