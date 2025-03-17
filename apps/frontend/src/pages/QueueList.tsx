import { useState, useEffect, useRef } from "react";
import { useQueueList } from "@/hooks/useQueueList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, RefreshCw, Activity, CheckCircle, XCircle, X, Calendar, FileText, Clock } from "lucide-react";
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
import { CreateQueueDialog } from "@/components/queues/CreateQueueDialog";
import { Badge } from "@/components/ui/badge";
import { getJobStatus } from "@/lib/utils";

// Helper function to format job timestamp
function formatJobTime(timestamp: number | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
}

// Job status badge styling helper
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'active':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

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
  // Add a state to store the initial queue order
  const [initialQueueOrder, setInitialQueueOrder] = useState<string[]>([]);
  const isFirstSuccessfulLoad = useRef(true);

  const { data, isLoading, isError, refetch, isFetching, error } = useQueueList();
  const queues = data?.queues || [];

  // Transform queue data to match the expected format with latest job info
  const transformedQueues = queues.map(queue => {
    // Parse last job data if available
    const lastJob = queue.lastJob ? {
      id: queue.lastJob.id,
      status: getJobStatus(queue.lastJob),
      createdAt: queue.lastJob.timestamp,
      templateName: typeof queue.lastJob.data === 'string'
        ? JSON.parse(queue.lastJob.data).templateName
        : queue.lastJob.data?.templateName || "Unknown template"
    } : null;

    return {
      queueName: queue.name || "",
      running: queue.counts?.active || 0,
      successful: queue.counts?.completed || 0,
      failed: queue.counts?.failed || 0,
      lastUpdated: queue.latestJobUpdatedTime ? new Date(queue.latestJobUpdatedTime) : null,
      latestJobUpdatedTime: queue.latestJobUpdatedTime || null,
      lastJob
    };
  });

  // Set up the initial queue order once when data first loads successfully
  useEffect(() => {
    if (transformedQueues.length > 0 && isFirstSuccessfulLoad.current) {
      // Sort by latestJobUpdatedTime (newest first), then by name if no timestamp
      const sortedQueueNames = [...transformedQueues]
        .sort((a, b) => {
          // If both have latestJobUpdatedTime, sort by that (newest first)
          if (a.latestJobUpdatedTime && b.latestJobUpdatedTime) {
            return b.latestJobUpdatedTime - a.latestJobUpdatedTime;
          }

          // If only one has latestJobUpdatedTime, that one comes first
          if (a.latestJobUpdatedTime) return -1;
          if (b.latestJobUpdatedTime) return 1;

          // If neither has latestJobUpdatedTime, sort by name alphabetically
          return a.queueName.localeCompare(b.queueName);
        })
        .map(queue => queue.queueName);

      setInitialQueueOrder(sortedQueueNames);
      isFirstSuccessfulLoad.current = false;
    }
  }, [transformedQueues]);

  // Filter queues based on search query
  const filteredQueues = transformedQueues.filter(queue =>
    queue.queueName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort queues based on the initial order rather than re-sorting by running count
  const sortedQueues = [...filteredQueues].sort((a, b) => {
    // If both queues are in our initial order, use that order
    const indexA = initialQueueOrder.indexOf(a.queueName);
    const indexB = initialQueueOrder.indexOf(b.queueName);

    // If both queues were in the initial order, sort by their initial positions
    if (indexA >= 0 && indexB >= 0) {
      return indexA - indexB;
    }

    // If a queue wasn't in the initial order (i.e., it's new), put it at the end
    if (indexA < 0) return 1;
    if (indexB < 0) return -1;

    // Fallback to sorting by running count (should not reach here if initial order is set)
    return b.running - a.running;
  });

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
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Queue List</h1>
            <p className="text-muted-foreground">
              Monitor and manage message queues across your system
            </p>
          </div>
          <CreateQueueDialog />
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
                <div className="space-y-4">
                  {sortedQueues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No queues match your search" : "No queues available"}
                    </div>
                  ) : (
                    sortedQueues.map((queue) => (
                      <Card key={queue.queueName} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center w-full p-4">
                          <div className="flex items-center flex-grow mb-4 md:mb-0">
                            <div className="flex-grow">
                              <Link
                                to={`/queues/jobs/${queue.queueName}`}
                                className="text-lg font-medium hover:underline text-primary"
                              >
                                {queue.queueName}
                              </Link>
                              {queue.lastUpdated && (
                                <div className="text-xs text-muted-foreground">
                                  Last updated: {formatDistanceToNow(queue.lastUpdated)} ago
                                </div>
                              )}

                              {/* Latest Job Information Section */}
                              {queue.lastJob && (
                                <div className="mt-2 text-sm border-l-2 border-gray-200 pl-3">
                                  <div className="font-medium text-gray-700 mb-1">Latest Job</div>
                                  <div className="grid grid-cols-1 gap-1">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-gray-500" />
                                      <span>Created: {formatJobTime(queue.lastJob.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <FileText className="h-3 w-3 text-gray-500" />
                                      <span>Template: {queue.lastJob.templateName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Badge className={getStatusBadgeClass(queue.lastJob.status)}>
                                        {queue.lastJob.status}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        asChild
                                      >
                                        <Link to={`/queues/jobs/${queue.queueName}/${queue.lastJob.id}`}>
                                          View Job
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-between md:justify-end items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <span className="text-sm"><span className="font-medium">{queue.running}</span> running</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm"><span className="font-medium">{queue.successful}</span> completed</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm"><span className="font-medium">{queue.failed}</span> failed</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className="flex-grow md:w-64">
                                <QueueTemplateSelector queueName={queue.queueName} />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="whitespace-nowrap"
                              >
                                <Link to={`/queues/jobs/${queue.queueName}`}>View Jobs</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
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
