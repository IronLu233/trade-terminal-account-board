import { useQuery } from "@tanstack/react-query";

export function useServerConfig() {
  return useQuery<{ accounts: {account: string}[], workers: {name: string}[] }>({
    queryKey: ["serverConfig"],
    queryFn: async () => {
      const response = await fetch("/api/v2/config");
      if (!response.ok) {
        throw new Error("Failed to fetch server config");
      }
      return response.json();
    },
  });
}
