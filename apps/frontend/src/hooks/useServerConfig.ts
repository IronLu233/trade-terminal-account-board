import { useQuery } from "@tanstack/react-query";

export function useServerConfig() {
  return useQuery<{ accounts: {account: string}[], workers: {name: string}[] }>({
    queryKey: ["serverConfig"],
    queryFn: async () => {
      const response = await fetch("/api/v2/config");
      if (!response.ok) {
        throw new Error("Failed to fetch server config");
      }
      const data = await response.json();

      // 对 workers 按 name 字段进行字母排序 (a-z)
      if (data.workers && Array.isArray(data.workers)) {
        data.workers.sort((a: {name: string}, b: {name: string}) => a.name.localeCompare(b.name));
      }

      return data;
    },
  });
}
