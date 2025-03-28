import { useQuery } from '@tanstack/react-query';

interface SystemInfo {
  hostname: string;
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
}

async function fetchSystemInfo(): Promise<SystemInfo[]> {
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
