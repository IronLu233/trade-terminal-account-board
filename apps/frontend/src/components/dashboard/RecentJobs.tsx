import { useRecentJobs } from "@/hooks/useJobDetail";
import { getHostAccountInfoFromQueueName } from "common/misc";
import { Job } from "@/types/queue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTerminateJob } from "@/hooks/useJobDetail";
import { useToast } from "@/hooks/use-toast";
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

export default function RecentJobs() {
  const { data: jobs, isLoading, error, refetch } = useRecentJobs();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const [terminatingJob, setTerminatingJob] = useState<{id: string, queueName: string} | null>(null);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);

  const terminateJobMutation = useTerminateJob(
    terminatingJob?.queueName || '',
    terminatingJob?.id || ''
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusIcon = (job: Job) => {
    if (job.failedReason) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (job.processedOn && !job.finishedOn) {
      return <PlayCircle className="h-4 w-4 text-blue-500" />;
    }
    if (job.finishedOn) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (job: Job) => {
    if (job.failedReason) return "Failed";
    if (job.processedOn && !job.finishedOn) return "Active";
    if (job.finishedOn) return "Completed";
    return "Waiting";
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Failed":
        return "destructive";
      case "Active":
        return "secondary";
      case "Completed":
        return "default"; // Changed from "success" to "default" since success variant doesn't exist
      default:
        return "default";
    }
  };

  const handleJobClick = (job: Job) => {
    if (job.id && job.queueName) {
      navigate(`/queues/jobs/${job.queueName}/${job.id}`);
    }
  };

  const handleTerminateClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (job.id && job.queueName) {
      setTerminatingJob({ id: job.id, queueName: job.queueName });
      setIsTerminateDialogOpen(true);
    }
  };

  const handleTerminateJob = async () => {
    if (!terminatingJob) return;

    try {
      await terminateJobMutation.mutateAsync();
      await refetch();

      toast({
        title: "Job terminated",
        description: `Job #${terminatingJob.id} has been successfully terminated.`,
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
      setIsTerminateDialogOpen(false);
      setTerminatingJob(null);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load recent jobs. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>
            Jobs that have been processed in the last 7 days
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading jobs...</span>
          </div>
        ) : !jobs?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent jobs found
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const status = getStatusText(job);
              const isActive = status === "Active";
              return (
                <div
                  key={`${job.queueName}-${job.id}`}
                  className="p-4 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleJobClick(job)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        {getStatusIcon(job)}
                        <span className="font-medium ml-2">{job.name}</span>
                        <Badge variant={getStatusColor(status)} className="ml-2">
                          {status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <span>Template: {job.data?.templateName || "N/A"}</span>
                        {job.queueName && (
                          <>
                            <span className="ml-3 px-2 py-0.5 bg-muted rounded-sm text-xs">
                              Host: {getHostAccountInfoFromQueueName(job.queueName).host}
                            </span>
                            <span className="ml-2 px-2 py-0.5 bg-muted rounded-sm text-xs">
                              Account: {getHostAccountInfoFromQueueName(job.queueName).account}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm text-muted-foreground">
                        {job.processedOn
                          ? `Started ${formatDistanceToNow(job.processedOn)} ago`
                          : "Not started yet"}
                      </div>
                      {isActive && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 px-2"
                                onClick={(e) => handleTerminateClick(e, job)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Terminate
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* 终止作业确认对话框 */}
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
            <AlertDialogCancel disabled={terminateJobMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateJob}
              disabled={terminateJobMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {terminateJobMutation.isPending ? (
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
    </Card>
  );
}
