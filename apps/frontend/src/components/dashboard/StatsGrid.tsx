import { QueueStats } from "@/types/queue";
import QueueCard from "./QueueCard";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueueList } from "@/hooks/useQueueList";

export default function StatsGrid() {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useQueueList();

  if (error) {
    toast({
      title: "Error loading queues",
      description: "Could not load queue statistics.",
      variant: "destructive",
      duration: 5000,
    });
  }


  const queueStats: QueueStats[] = (data?.queues || [])
    .map(queue => ({
      queueName: queue.name || '',
      running: queue.counts?.active || 0,
      successful: queue.counts?.completed || 0,
      failed: queue.counts?.failed || 0,
      lastUpdated: queue.latestJobUpdatedTime ? new Date(queue.latestJobUpdatedTime) : null
    }))
    .sort((a, b) => {
      // If both have lastUpdated, sort by that (newest first)
      if (a.lastUpdated && b.lastUpdated) {
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }

      // If only one has lastUpdated, that one comes first
      if (a.lastUpdated) return -1;
      if (b.lastUpdated) return 1;

      // If neither has lastUpdated, sort by name alphabetically
      return a.queueName.localeCompare(b.queueName);
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Queue Statistics</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        {queueStats.map((queue) => (
          <QueueCard key={queue.queueName} queue={queue} />
        ))}
      </div>
    </div>
  );
}
