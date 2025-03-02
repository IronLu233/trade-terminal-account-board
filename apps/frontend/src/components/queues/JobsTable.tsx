import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Job, JobStatus } from "@/types/queue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import JobStatusBadge from "./JobStatusBadge";

interface JobsTableProps {
  jobs: Job[];
  queueName?: string;
  initialStatus?: JobStatus;
}

export default function JobsTable({ jobs, queueName, initialStatus = "all" }: JobsTableProps) {
  const [statusFilter, setStatusFilter] = useState<JobStatus>(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update status filter when initialStatus prop changes
  useEffect(() => {
    if (initialStatus) {
      setStatusFilter(initialStatus);
    }
  }, [initialStatus]);

  // Filter jobs based on status and search query
  const filteredJobs = jobs
    .filter((job) => {
      if (!queueName || job.queueName === queueName) {
        if (statusFilter === "all") {
          return true;
        }
        return job.status === statusFilter;
      }
      return false;
    })
    .filter((job) =>
      job.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-3xl">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as JobStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
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
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Job Name</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[200px]">Queue</TableHead>
                <TableHead className="w-[200px]">Created</TableHead>
                <TableHead className="w-[150px]">Duration</TableHead>
                <TableHead className="w-[200px]">Parameters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No jobs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/queues/jobs/${job.id}`}
                        className="hover:underline text-primary"
                      >
                        {job.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>
                      {job.queueName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {format(job.createdAt, "MMM d, yyyy")}
                        </span>
                        <span className="text-xs">
                          {formatDistanceToNow(job.createdAt)} ago
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.status === "running" ? (
                        <span className="text-xs text-muted-foreground">
                          Running for{" "}
                          {formatDistanceToNow(job.createdAt, { addSuffix: false })}
                        </span>
                      ) : job.duration ? (
                        <span className="text-xs text-muted-foreground">
                          {(job.duration / 1000).toFixed(1)}s
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {job.parameters ? (
                          <span className="text-xs text-muted-foreground">
                            {Object.keys(job.parameters).join(', ')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
