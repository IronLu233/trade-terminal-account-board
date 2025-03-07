import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQueueDetail } from "../hooks/useQueueList";
import { format } from "date-fns";

// shadcn UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Job, JobStatus } from "@/types/queue";

// Add import for RetryJobDialog and useRetryJob
import { RetryJobDialog } from "@/components/dialogs/RetryJobDialog";
import { useRetryJob } from "@/hooks/useJobDetail";

// Add this import at the top with other imports
import { QueueTemplateSelector } from "@/components/QueueTemplateSelector";

export default function QueueDetail() {
  const { queueName } = useParams<{ queueName: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") as JobStatus || "latest";
  const [currentTab, setCurrentTab] = useState<JobStatus>(statusParam);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setSearchParams({ status: currentTab });
  }, [currentTab, setSearchParams]);

  // Use the new useQueueDetail hook
  const { data: queueDetail, error, refetch, isLoading } = useQueueDetail({
    activeQueue: queueName
  });

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get jobs filtered by current tab
  const jobs = queueDetail?.jobsByStatus?.[currentTab] || [];
  const counts = queueDetail?.counts || {};

  // Calculate total jobs
  const totalJobs =
    (counts.active || 0) +
    (counts.waiting || 0) +
    (counts.completed || 0) +
    (counts.failed || 0) +
    (counts.delayed || 0) +
    (counts.paused || 0) +
    (counts.prioritized || 0) +
    (counts["waiting-children"] || 0);

  // Calculate success rate
  const successRate = totalJobs > 0
    ? ((counts.completed || 0) / totalJobs) * 100
    : 0;

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) => {
    return job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.data?.account?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.data?.script?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toString().includes(searchQuery.toLowerCase());
  });

  if (isLoading && !queueDetail) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-24" />
                ))}
              </div>
              <div className="flex justify-between mb-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="border rounded-md">
                <div className="p-4 border-b">
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-4" />
                    ))}
                  </div>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border-b">
                    <div className="grid grid-cols-5 gap-4">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Skeleton key={j} className="h-4" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/queues")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Queues
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load queue data: {(error as Error).message || "Unknown error occurred"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!queueDetail) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/queues")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Queues
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Queue not found</AlertTitle>
          <AlertDescription>
            The queue "{queueName}" does not exist or you don't have access to it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/queues")}
          className="flex items-center gap-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queues
        </Button>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Queue Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{queueName}</CardTitle>
          <CardDescription>
            Queue information and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-sm font-medium mb-2">Queue Status</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={queueDetail.isPaused ? "outline" : "default"}>
                    {queueDetail.isPaused ? "Paused" : "Active"}
                  </Badge>
                  <Badge variant="outline">{queueDetail.type || "N/A"}</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Job Success Rate</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {successRate.toFixed(1)}% Complete Rate
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {counts.completed || 0} / {totalJobs} jobs
                    </span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Job Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      <span className="text-xl font-semibold">{counts.active || 0}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xl font-semibold">{counts.completed || 0}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Completed</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xl font-semibold">{counts.failed || 0}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Failed</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-xl font-semibold">{counts.delayed || 0}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Delayed</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Run Template</h3>
              <QueueTemplateSelector queueName={queueName || ''} />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Job Results</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm">{counts.completed || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="text-sm">{counts.failed || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Delayed</span>
                  <span className="text-sm">{counts.delayed || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Allow Retries</span>
                  <span className="text-sm">{queueDetail.allowRetries ? "Yes" : "No"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Read Only</span>
                  <span className="text-sm">{queueDetail.readOnlyMode ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>
            All jobs in the {queueName} queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="latest" value={currentTab} onValueChange={setCurrentTab as never}>
            <TabsList className="grid grid-cols-4 mb-6 h-10 gap-1">
              <TabsTrigger value="latest" className="flex items-center justify-center h-full">
                <div className="flex items-center">
                  Latest
                </div>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center justify-center h-full">
                <div className="flex items-center">
                  Active
                </div>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center justify-center h-full">
                <div className="flex items-center">
                  Completed
                </div>
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center justify-center h-full">
                <div className="flex items-center">
                  Failed
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by name, ID or account..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="latest" className="space-y-4">
              <JobsTable jobs={filteredJobs} queueName={queueName || ''} refetch={refetch} currentTab={currentTab} />
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <JobsTable jobs={filteredJobs} queueName={queueName || ''} refetch={refetch} currentTab={currentTab} />
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <JobsTable jobs={filteredJobs} queueName={queueName || ''} refetch={refetch} currentTab={currentTab} />
            </TabsContent>

            <TabsContent value="failed" className="space-y-4">
              <JobsTable jobs={filteredJobs} queueName={queueName || ''} refetch={refetch} currentTab={currentTab} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// JobsTable component to display job data
function JobsTable({ jobs, queueName, refetch, currentTab }: {
  jobs: Job[],
  queueName: string,
  refetch: () => Promise<any>,
  currentTab: JobStatus
}) {
  const [retryJobId, setRetryJobId] = useState<string | null>(null);
  const retryJob = useRetryJob(queueName, retryJobId || '', currentTab);

  const handleRetryConfirm = async () => {
    if (!retryJobId) return;

    try {
      await retryJob.mutateAsync();
      refetch(); // Refetch the jobs list
    } catch (error) {
      console.error('Failed to retry job:', error);
    } finally {
      setRetryJobId(null);
    }
  };

  // Get the job being retried
  const jobToRetry = jobs.find(job => job.id === retryJobId);

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No jobs found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          No jobs match your current filters.
        </p>
      </div>
    );
  }

  const getStatusBadge = (job: any) => {
    if (job.isFailed) {
      return <Badge variant="destructive">Failed</Badge>;
    } else if (job.finishedOn) {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    } else if (job.delay > 0) {
      return <Badge variant="outline">Delayed</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss");
  };

  const calculateDuration = (job: any) => {
    if (!job.processedOn || !job.finishedOn) return "N/A";
    const duration = job.finishedOn - job.processedOn;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Script</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.id}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                <Link
                  to={`/queues/jobs/${queueName}/${job.id}`}
                  className="text-blue-500 hover:text-blue-700 hover:underline"
                >
                  {job.name}
                </Link>
              </TableCell>
              <TableCell>{job.data?.script || "N/A"}</TableCell>
              <TableCell>{formatDate(job.timestamp)}</TableCell>
              <TableCell>
                {job.returnvalue?.completedAt
                  ? format(new Date(job.returnvalue.completedAt), "yyyy-MM-dd HH:mm:ss")
                  : "N/A"}
              </TableCell>
              <TableCell>{calculateDuration(job)}</TableCell>
              <TableCell>{getStatusBadge(job)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/queues/jobs/${queueName}/${job.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRetryJobId(job.id)}>
                      Retry Job
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Remove Job</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {jobToRetry && (
        <RetryJobDialog
          isOpen={!!retryJobId}
          onClose={() => setRetryJobId(null)}
          onConfirm={handleRetryConfirm}
          jobId={jobToRetry.id}
          jobName={jobToRetry.name}
        />
      )}
    </div>
  );
}
