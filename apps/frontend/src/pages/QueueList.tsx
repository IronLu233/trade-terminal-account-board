import { useState, useEffect } from "react";
import { useQueueList } from "@/hooks/useQueueList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, RefreshCw, ChevronDown, ChevronRight, Activity, CheckCircle, XCircle, LayoutGrid, List, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [expandedQueues, setExpandedQueues] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  // Toggle queue expansion
  const toggleQueueExpansion = (queueName: string) => {
    setExpandedQueues(prev => ({
      ...prev,
      [queueName]: !prev[queueName]
    }));
  };

  // Expand a specific queue
  const expandQueue = (queueName: string) => {
    setExpandedQueues(prev => ({
      ...prev,
      [queueName]: true
    }));
    setSearchQuery(queueName);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle queue select
  const handleQueueSelect = (queueName: string) => {
    expandQueue(queueName);
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
                  onClick={() => {
                    setSearchQuery("");
                    setExpandedQueues({});
                  }}
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle view</span>
              </Button>
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
                {viewMode === 'list' ? (
                  <div className="space-y-4">
                    {sortedQueues.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No queues match your search" : "No queues available"}
                      </div>
                    ) : (
                      sortedQueues.map((queue) => {
                        const isExpanded = expandedQueues[queue.queueName] || false;

                        return (
                          <Collapsible
                            key={queue.queueName}
                            open={isExpanded}
                            onOpenChange={() => toggleQueueExpansion(queue.queueName)}
                            className="border rounded-lg overflow-hidden"
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <div>
                                    <h3 className="font-medium text-lg">{queue.queueName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span>Last updated: {formatDistanceToNow(queue.lastUpdated)} ago</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                      <div className="flex items-center gap-1">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        <span className="font-semibold">{queue.running}</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">Running</span>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-center">
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="font-semibold">{queue.successful}</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">Completed</span>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-center">
                                      <div className="flex items-center gap-1">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        <span className="font-semibold">{queue.failed}</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">Failed</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={queue.running > 0 ? "default" : "outline"} className="ml-2">
                                      {queue.running} active
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Link to={`/queues/jobs/${queue.queueName}`}>View Jobs</Link>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="border-t p-4 bg-muted/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-3">Queue Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Queue Name:</span>
                                        <span className="font-medium">{queue.queueName}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Running Jobs:</span>
                                        <span className="font-medium">{queue.running}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Completed Jobs:</span>
                                        <span className="font-medium">{queue.successful}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Failed Jobs:</span>
                                        <span className="font-medium">{queue.failed}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last Updated:</span>
                                        <span className="font-medium">{formatDistanceToNow(queue.lastUpdated)} ago</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-span-2">
                                    <h4 className="font-medium mb-3">Run Template</h4>
                                    <QueueTemplateSelector queueName={queue.queueName} />
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {sortedQueues.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        {searchQuery ? "No queues match your search" : "No queues available"}
                      </div>
                    ) : (
                      sortedQueues.map((queue) => {
                        const total = queue.running + queue.successful + queue.failed;
                        const successRate = total > 0 ? (queue.successful / total) * 100 : 100;

                        return (
                          <Card key={queue.queueName} className="overflow-hidden">
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
                            <CardContent className="pb-4">
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

                              <div className="space-y-2">
                                <div>
                                  <div className="flex justify-between mb-1 text-xs">
                                    <span>Success Rate</span>
                                    <span>{successRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{ width: `${successRate}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="text-xs h-7 px-2"
                                >
                                  <Link to={`/queues/jobs/${queue.queueName}`}>View Jobs</Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
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
