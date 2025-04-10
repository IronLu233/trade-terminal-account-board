import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueueList } from "@/hooks/useQueueList";
import { useServerConfig } from "@/hooks/useServerConfig";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, RefreshCw, Activity, CheckCircle, XCircle, X, FileText, Clock, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import { QueueTemplateSelector } from "@/components/QueueTemplateSelector";
// import { CreateQueueDialog } from "@/components/queues/CreateQueueDialog";
import { Badge } from "@/components/ui/badge";
import { getJobStatus } from "@/lib/utils";
import { debounce } from "lodash-es";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Fuse from 'fuse.js';

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeWorker, setActiveWorker] = useState<string>("");

  const { data: configData, isLoading: isConfigLoading, isError: isConfigError } = useServerConfig();
  const workers = configData?.customer?.workers || [];
  const firstWorker = workers[0]?.name;

  const { data, isLoading, refetch, isFetching } = useQueueList({
    hostname: activeWorker
  });

  const queues = data?.queues || [];

  // Set active worker when config loads
  useEffect(() => {
    if (firstWorker && !activeWorker) {
      setActiveWorker(firstWorker);
    }
  }, [firstWorker, activeWorker]);

  // Memoize transformed queues
  const transformedQueues = useMemo(() =>
    queues.map(queue => {
      const lastJob = queue.lastJob ? {
        id: queue.lastJob.id,
        status: getJobStatus(queue.lastJob),
        createdAt: queue.lastJob.processedOn,
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
        lastJob,
        host: queue.host || "unknown",
        account: queue.account || "unknown"
      };
    }), [queues]);

  // Set up fuzzy search with Fuse.js
  const fuseOptions = {
    keys: ['queueName', 'account', 'lastJob.templateName'],
    threshold: 0.4,
    includeScore: true
  };

  // Memoize Fuse instance
  const fuse = useMemo(() =>
    new Fuse(transformedQueues, fuseOptions),
    [transformedQueues]
  );

  // Memoize filtered queues
  const filteredQueues = useMemo(() =>
    debouncedSearchQuery
      ? fuse.search(debouncedSearchQuery).map(result => result.item)
      : transformedQueues,
    [debouncedSearchQuery, fuse, transformedQueues]
  );

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Debounce the search to reduce lag
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
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

  if (isConfigError) {
    return <ErrorFallback />;
  }

  if (isConfigLoading) {
    return <div className="text-center py-8">Loading configuration...</div>;
  }

  // Render queue card for reuse
  const renderQueueCard = (queue: typeof transformedQueues[0]) => (
    <Card key={queue.queueName} className="overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center w-full p-4">
        <div className="flex items-center flex-grow mb-4 md:mb-0">
          <div className="flex-grow">
            <Link
              to={`/queues/jobs/${queue.queueName}`}
              className="text-lg font-medium hover:underline text-primary"
            >
              {queue.account}
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
  );

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
          {/* <CreateQueueDialog /> */}
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
                <div className="relative w-full sm:w-64">
                  <Input
                    placeholder="Search queues..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {searchQuery ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSearch}
                        className="h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Search className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
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
              <div className="space-y-6">
                {workers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No workers available
                  </div>
                ) : (
                  <Tabs
                    defaultValue={activeWorker}
                    value={activeWorker}
                    onValueChange={setActiveWorker}
                    className="w-full"
                  >
                    <TabsList className="mb-4 overflow-x-auto whitespace-nowrap flex w-full">
                      {workers.map(worker => (
                        <TabsTrigger key={worker.name} value={worker.name} className="px-4">
                          {worker.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value={activeWorker} className="space-y-6">
                      <div className="space-y-4">
                        {filteredQueues.map(queue => renderQueueCard(queue))}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                  {debouncedSearchQuery && (
                    <div>
                      Searching for "{debouncedSearchQuery}" - {filteredQueues.length} results found
                      <Button
                        variant="link"
                        size="sm"
                        onClick={clearSearch}
                        className="px-1 h-auto text-sm"
                      >
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
