import { useQuery } from "@tanstack/react-query";
import { Config } from "config";

export function useServerConfig() {
  return useQuery<Config>({
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
