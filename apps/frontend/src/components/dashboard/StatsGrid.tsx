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

  const queueStats: QueueStats[] = (data?.queues || []).map(queue => ({
    queueName: queue.name || '',
    running: queue.counts?.active || 0,
    successful: queue.counts?.completed || 0,
    failed: queue.counts?.failed || 0,
    lastUpdated: new Date()
  }));

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
