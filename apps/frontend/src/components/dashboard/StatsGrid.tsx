import { useState, useEffect } from "react";
import { QueueStats } from "@/types/queue";
import QueueCard from "./QueueCard";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StatsGridProps {
  initialQueues: QueueStats[];
  refreshInterval?: number;
}

export default function StatsGrid({ 
  initialQueues, 
  refreshInterval = 30000 
}: StatsGridProps) {
  const [queues, setQueues] = useState<QueueStats[]>(initialQueues);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { toast } = useToast();

  // Function to simulate fetching updated data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate by updating the lastUpdated and randomizing some numbers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedQueues = queues.map(queue => ({
        ...queue,
        running: Math.max(0, queue.running + Math.floor(Math.random() * 5) - 2),
        successful: queue.successful + Math.floor(Math.random() * 10),
        failed: queue.failed + (Math.random() > 0.8 ? 1 : 0),
        lastUpdated: new Date()
      }));
      
      setQueues(updatedQueues);
      setLastRefreshed(new Date());
      
      // Removed toast notification for data refresh
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update queue statistics.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    const intervalId = setInterval(refreshData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [queues, refreshInterval]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Queue Statistics</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map((queue) => (
          <QueueCard key={queue.queueName} queue={queue} />
        ))}
      </div>
    </div>
  );
}