import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Clock,
  Terminal,
  AlertTriangle,
  RefreshCw,
  Clipboard,
  CheckCircle,
  Search,
  X,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import JobStatusBadge from "@/components/queues/JobStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useJobDetail, useTerminateJob } from "@/hooks/useJobDetail";
import { useJobLog } from "@/hooks/useJobLog";
import { getJobStatus } from "@/lib/utils";

// Helper function to parse log entries
const parseLogEntry = (log: string) => {
  // Check if log entry has ISO timestamp format (e.g., 2025-03-05T07:30:06.430Z)
  const timestampMatch = log.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)/);

  if (timestampMatch) {
    const timestamp = new Date(timestampMatch[1].trim());
    return {
      timestamp,
      formattedTimestamp: format(timestamp, "yy-MM-dd HH:mm:ss"),
      content: log.substring(timestampMatch[0].length).trim(),
      raw: log
    };
  }

  // Check if log entry has log level format [INFO], [ERROR], etc.
  const levelMatch = log.match(/^\[(INFO|ERROR|WARN|DEBUG)\]/);

  if (levelMatch) {
    return {
      level: levelMatch[1],
      content: log.substring(levelMatch[0].length).trim(),
      raw: log
    };
  }

  // Default case - no special formatting
  return {
    content: log,
    raw: log
  };
};

// Helper function to determine if a log is an error
const isErrorLog = (log: string) => {
  return log.includes("[ERROR]") ||
         log.includes("Error:") ||
         log.includes("Exception:") ||
         log.toLowerCase().includes("failed") ||
         log.toLowerCase().includes("failure");
};

export default function JobDetails() {
  const { queueName, jobId } = useParams<{ queueName: string, jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [mergedLogs, setMergedLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  // Use the hooks to fetch job details and logs
  const {
    data: jobData,
    isLoading: isLoadingJob,
    isError: isJobError,
    error: jobError,
    refetch: refetchJob,
    isRefetching: isRefetchingJob
  } = useJobDetail(queueName || '', jobId || '');

  const {
    data: jobLogs,
    isLoading: isLoadingLogs,
    isError: isLogsError,
    refetch: refetchLogs,
    isRefetching: isRefetchingLogs
  } = useJobLog({ queueName: queueName || '', jobId: jobId || '' });

  const terminateJobMutation = useTerminateJob(queueName || '', jobId || '');

  // Extract job data and format it for display
  const job = useMemo(() => {
    if (!jobData) return null;

    return {
      id: jobData.id,
      name: jobData.name || 'Job ' + jobData.id,
      status: getJobStatus(jobData),
      queueName: queueName || '',
      createdAt: new Date(jobData.timestamp),
      updatedAt: jobData.finishedOn ? new Date(jobData.finishedOn) : new Date(),
      duration: jobData.finishedOn && jobData.processedOn ?
        jobData.finishedOn - jobData.processedOn : undefined,
      command: jobData.data.command ?? ' ',
      parameters: jobData.data,
      progress: jobData.progress || 0,
      isFailed: !!jobData.failedReason || false,
      failedReason: jobData.failedReason || '',
      stacktrace: Array.isArray(jobData.stacktrace) ? jobData.stacktrace : []
    };
  }, [jobData, queueName]);

  // Merge logs from both sources whenever either changes
  useEffect(() => {
    if (jobLogs) {
      setMergedLogs(jobLogs);
    } else {
      setMergedLogs([]);
    }
  }, [jobLogs]);

  // Auto-scroll to bottom when new logs come in
  useEffect(() => {
    if (!scrollAreaContainerRef.current) return;

    if ((autoScroll && job?.status === "active" && mergedLogs.length > 0) || (job?.status === 'completed' && autoScroll)) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (scrollAreaContainerRef.current) {
          scrollAreaContainerRef.current.scrollTop = scrollAreaContainerRef.current.scrollHeight;
        }
      });
    }
  }, [mergedLogs.length, job?.status]); // Remove autoScroll from dependencies to avoid loops

  // Handle scroll events to determine if user has manually scrolled up
  const handleScroll = () => {
    if (!scrollAreaContainerRef.current) return;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce the scroll handler
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollAreaContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollAreaContainerRef.current;
      // If user scrolled up (not at bottom), disable auto-scroll
      // If user scrolled to bottom, enable auto-scroll
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;

      // Only update if the value actually changed
      setAutoScroll(prev => {
        if (prev !== isAtBottom) {
          return isAtBottom;
        }
        return prev;
      });
    }, 100); // 100ms debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Set up polling for logs if job is active
  useEffect(() => {
    if (job?.status === "active") {
      const intervalId = setInterval(() => {
        refetchLogs();
      }, 3000); // Poll every 3 seconds for active jobs

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [job?.status, refetchLogs]);

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchJob(), refetchLogs()]);

      toast({
        title: "Job refreshed",
        description: "Latest job information has been loaded.",
        duration: 3000,
      });

      // Enable auto-scroll and scroll to bottom
      setAutoScroll(true);
      requestAnimationFrame(() => {
        if (scrollAreaContainerRef.current) {
          scrollAreaContainerRef.current.scrollTop = scrollAreaContainerRef.current.scrollHeight;
        }
      });
    } catch (refreshError) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh job information.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleTerminateJob = async () => {
    if (!queueName || !jobId) return;

    setIsTerminating(true);

    try {
      await terminateJobMutation.mutateAsync();
      await refetchJob();

      toast({
        title: "Job terminated",
        description: `Job #${jobId} has been successfully terminated.`,
        duration: 3000,
      });

    } catch (error) {
      toast({
        title: "Termination failed",
        description: "Could not terminate the job. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsTerminating(false);
      setIsTerminateDialogOpen(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    toast({
      title: "Copied to clipboard",
      description: "The content has been copied to your clipboard.",
      duration: 3000,
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllLogs = () => {
    if (!mergedLogs || mergedLogs.length === 0) {
      toast({
        title: "No logs",
        description: "There are no logs to copy.",
        duration: 3000,
      });
      return;
    }

    const logText = mergedLogs.join('\n');
    copyToClipboard(logText);
  };

  const copyErrorLogs = () => {
    if (!mergedLogs || mergedLogs.length === 0) return;

    const errorLogs = mergedLogs.filter(log => isErrorLog(log));
    if (errorLogs.length === 0) {
      toast({
        title: "No error logs",
        description: "There are no error logs to copy.",
        duration: 3000,
      });
      return;
    }

    const errorLogText = errorLogs.join('\n');
    copyToClipboard(errorLogText);
  };

  // Filter logs based on search query
  const filteredLogs = useMemo(() => {
    if (!mergedLogs || mergedLogs.length === 0) return [];

    if (!logSearchQuery) return mergedLogs;

    return mergedLogs.filter(log =>
      log.toLowerCase().includes(logSearchQuery.toLowerCase())
    );
  }, [mergedLogs, logSearchQuery]);

  const isLoading = isLoadingJob || isLoadingLogs;
  const isRefetching = isRefetchingJob || isRefetchingLogs;
  const isError = isJobError || isLogsError;
  const error = jobError || "Failed to load logs";

  if (isLoading && !job) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (isError || !job) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
              <p className="text-muted-foreground">
                {isError
                  ? `Error loading job: ${error instanceof Error ? error.message : 'Unknown error'}`
                  : "The job you're looking for doesn't exist or has been removed."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

            {job.status === "active" && (
            <TooltipProvider>
              <Tooltip>
              <TooltipTrigger asChild>
                <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsTerminateDialogOpen(true)}
                disabled={isTerminating}
                >
                <X className="mr-2 h-4 w-4" />
                Terminate Job
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Terminate this job</p>
              </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            )}
        </div>
      </div>

      {/* Terminate confirmation dialog */}
      <AlertDialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to terminate this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The job will be stopped and marked as terminated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTerminating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateJob}
              disabled={isTerminating}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isTerminating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Terminating...
                </>
              ) : (
                "Terminate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Job Info Card */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{job.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <JobStatusBadge status={job.status} />
                  <span className="text-sm text-muted-foreground">
                    Queue: {job.queueName}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Started: {format(job.createdAt, "MMM d, yyyy HH:mm:ss")}
                  </span>
                </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {job.status === "completed" ? "Completed" : job.status === "failed" ? "Failed" : "Updated"}: {format(job.updatedAt, "MMM d, yyyy HH:mm:ss")}
                    </span>
                  </div>

                {job.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Duration: {(job.duration / 1000).toFixed(1)} seconds
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Failed Job Error Card */}
        {job.isFailed && (
          <Card className="md:col-span-3 border-red-400 dark:border-red-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Job Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.failedReason && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error Reason</AlertTitle>
                  <AlertDescription className="font-mono text-sm mt-1">
                    {job.failedReason}
                  </AlertDescription>
                </Alert>
              )}

              {job.stacktrace && job.stacktrace.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Stack Trace</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(job.stacktrace.join('\n'))}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy stack trace</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <ScrollArea className="h-[200px] w-full rounded-md bg-muted dark:bg-slate-950 p-4">
                    <div className="font-mono text-sm whitespace-pre-wrap text-red-600 dark:text-red-400">
                      {job.stacktrace.map((line, index) => (
                        <div key={index} className="mb-1">{line}</div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Command Card */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              Command
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="bg-muted p-3 rounded-md font-mono text-sm overflow-x-auto whitespace-pre">
                {job.command}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 transform -translate-y-1/2"
                      onClick={() => job.command && copyToClipboard(job.command)}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy command</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {/* Parameters Card */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-3 rounded-md font-mono text-sm overflow-x-auto whitespace-pre">
              {job.parameters ? JSON.stringify(job.parameters, null, 2) : "No parameters"}
            </div>
          </CardContent>
        </Card>

        {/* Main Execution Logs Section */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg flex items-center">
                <Terminal className="h-5 w-5 mr-2" />
                Execution Logs
                {isRefetching && (
                  <RefreshCw className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTimestamps(!showTimestamps)}
                      >
                        {showTimestamps ? "Hide Timestamps" : "Show Timestamps"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle timestamp display</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyAllLogs}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy all logs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8 pr-8"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
              />
              {logSearchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-5 w-5"
                  onClick={() => setLogSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Card className="bg-muted dark:bg-slate-950 border-none">
                <div
                  ref={scrollAreaContainerRef}
                  onScroll={handleScroll}
                  className="h-[400px] rounded-md p-4 overflow-auto"
                >
                  <div className="font-mono text-sm whitespace-pre-wrap">
                    {filteredLogs && filteredLogs.length > 0 ? (
                      filteredLogs.map((log, index) => {
                        const parsedLog = parseLogEntry(log);
                        const isError = isErrorLog(log);

                        return (
                          <div
                            key={index}
                            className={`mb-1 ${isError ? "text-red-500 dark:text-red-400" : ""}`}
                          >
                            {showTimestamps && parsedLog.timestamp ? (
                              <span>{parsedLog.formattedTimestamp} {parsedLog.content}</span>
                            ) : (
                              <span>{parsedLog.content || parsedLog.raw}</span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-muted-foreground">
                        {logSearchQuery ? "No logs matching your search" : "No logs available"}
                      </div>
                    )}

                    {job.status === "active" && (
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Job is still running... {isLoadingLogs ? "(Loading logs)" : ""}</span>
                      </div>
                    )}

                    {/* We can keep this ref for compatibility but don't need to use it for scrolling */}
                    <div ref={logsEndRef} />
                  </div>
                </div>
            </Card>

            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <div>
                {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"} {logSearchQuery && "matching filter"}
              </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${autoScroll ? "text-green-500" : "text-muted-foreground"}`}>
                    {autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs py-0"
                    onClick={() => {
                      setAutoScroll(true);
                      // Update the scroll to bottom action to use direct scrolling
                      if (scrollAreaContainerRef.current) {
                        scrollAreaContainerRef.current.scrollTop = scrollAreaContainerRef.current.scrollHeight;
                      }
                    }}
                  >
                    Scroll to Bottom
                  </Button>
                </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
