import { useRecentJobs } from "@/hooks/useJobDetail";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function RecentJobs() {
  const { data: jobs, isLoading, error, refetch } = useRecentJobs();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
                          <span className="ml-3 px-2 py-0.5 bg-muted rounded-sm text-xs">
                            {job.queueName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.processedOn
                        ? `Started ${formatDistanceToNow(job.processedOn)} ago`
                        : "Not started yet"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
