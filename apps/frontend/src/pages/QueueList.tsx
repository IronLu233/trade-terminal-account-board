import { useState, useEffect } from "react";
import { useQueueList } from "@/hooks/useQueueList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, RefreshCw, Activity, CheckCircle, XCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueueTemplateSelector } from "@/components/QueueTemplateSelector";
import { Separator } from "@/components/ui/separator";

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

export default function QueueList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQueueList();
  const queues = data?.queues || [];

  // Transform queue data to match the expected format
  const transformedQueues = queues.map(queue => ({
    queueName: queue.name || "",
    running: queue.counts?.active || 0,
    successful: queue.counts?.completed || 0,
    failed: queue.counts?.failed || 0,
    lastUpdated: new Date(),
  }));

  // Filter queues based on search query
  const filteredQueues = transformedQueues.filter(queue =>
    queue.queueName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort queues by running jobs count (descending)
  const sortedQueues = [...filteredQueues].sort((a, b) => b.running - a.running);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle queue select
  const handleQueueSelect = (queueName: string) => {
    setSearchQuery(queueName);
  };

  // Handle keyboard shortcut to open command dialog
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (isError) {
    return <ErrorFallback />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-8 max-w-[3000px] mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue List</h1>
          <p className="text-muted-foreground">
            Monitor and manage message queues across your system
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Queues</CardTitle>
              <CardDescription>
                View all queues and their statistics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                <Select onValueChange={handleQueueSelect}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select a queue..." />
                  </SelectTrigger>
                  <SelectContent>
                    {transformedQueues.map(queue => (
                      <SelectItem key={queue.queueName} value={queue.queueName}>
                        <div className="flex items-center justify-between w-full">
                          <span>{queue.queueName}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3 text-blue-500" />
                            {queue.running} running
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading queues...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedQueues.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {searchQuery ? "No queues match your search" : "No queues available"}
                    </div>
                  ) : (
                    sortedQueues.map((queue) => {
                      const total = queue.running + queue.successful + queue.failed;
                      const successRate = total > 0 ? (queue.successful / total) * 100 : 100;

                      return (
                        <Card key={queue.queueName}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">
                              <Link
                                to={`/queues/jobs/${queue.queueName}`}
                                className="hover:underline text-primary"
                              >
                                {queue.queueName}
                              </Link>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Last updated: {formatDistanceToNow(queue.lastUpdated)} ago
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="pb-2">
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <Activity className="h-4 w-4 text-blue-500" />
                                  <span className="font-semibold">{queue.running}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Running</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="font-semibold">{queue.successful}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Completed</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="font-semibold">{queue.failed}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Failed</span>
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="flex-col items-stretch gap-2 pt-0">
                            <Separator className="mb-2" />
                            <QueueTemplateSelector queueName={queue.queueName} />
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="w-full mt-1"
                            >
                              <Link to={`/queues/jobs/${queue.queueName}`}>View Jobs</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })
                  )}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {sortedQueues.length} of {transformedQueues.length} queues
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
