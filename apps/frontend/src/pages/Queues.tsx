import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MOCK_JOBS, MOCK_QUEUES } from "@/data/mockData";
import JobsTable from "@/components/queues/JobsTable";
import QueueCombobox from "@/components/queues/QueueCombobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { JobStatus } from "@/types/queue";

function ErrorFallback() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        There was an error loading the queue data. Please try refreshing the page.
      </AlertDescription>
    </Alert>
  );
}

export default function Queues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queueParam = searchParams.get("queue");
  const statusParam = searchParams.get("status") as JobStatus | null;
  
  // Default to "all" if none is specified
  const defaultQueue = queueParam || "all";
  const [activeQueue, setActiveQueue] = useState(defaultQueue);
  const [activeStatus, setActiveStatus] = useState<JobStatus>(statusParam || "all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update URL when queue changes
  const handleQueueChange = (queue: string) => {
    setActiveQueue(queue);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("queue", queue);
      return newParams;
    });
  };

  // Simulate refreshing data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Update active queue and status when URL params change
  useEffect(() => {
    if (queueParam) {
      setActiveQueue(queueParam);
    }
    
    if (statusParam && ["all", "completed", "running", "failed"].includes(statusParam)) {
      setActiveStatus(statusParam);
    }
  }, [queueParam, statusParam]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Details</h1>
          <p className="text-muted-foreground">
            View and manage jobs in your message queues
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>
                Monitor and manage jobs across all queues
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <QueueCombobox 
                queues={MOCK_QUEUES} 
                value={activeQueue} 
                onChange={handleQueueChange} 
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <JobsTable 
              jobs={MOCK_JOBS} 
              queueName={activeQueue === "all" ? undefined : activeQueue}
              initialStatus={activeStatus}
            />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}