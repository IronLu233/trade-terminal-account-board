import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MOCK_JOBS } from "@/data/mockData";
import { Job } from "@/types/queue";
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
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JobStatusBadge from "@/components/queues/JobStatusBadge";
import { useToast } from "@/hooks/use-toast";

// Helper function to parse log entries
const parseLogEntry = (log: string) => {
  // Check if log entry has timestamp format [HH:MM:SS]
  const timestampMatch = log.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
  
  if (timestampMatch) {
    return {
      timestamp: timestampMatch[1],
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
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");
  const [copied, setCopied] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [errorSearchQuery, setErrorSearchQuery] = useState("");
  const [errorLevelFilters, setErrorLevelFilters] = useState<string[]>(["ERROR", "WARN"]);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate API call to fetch job details
    const fetchJob = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const foundJob = MOCK_JOBS.find(j => j.id === jobId);
        
        if (foundJob) {
          // Enhance mock logs with timestamps for demonstration
          if (foundJob.logs) {
            const enhancedLogs = foundJob.logs.map((log, index) => {
              // Only add timestamps to logs that don't already have them
              if (!log.match(/^\[\d{2}:\d{2}:\d{2}\]/)) {
                const date = new Date(foundJob.createdAt.getTime() + index * 2000);
                const timestamp = `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}]`;
                return `${timestamp} ${log}`;
              }
              return log;
            });
            
            foundJob.logs = enhancedLogs;
          }
          
          setJob(foundJob);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If job is running, add a new log entry
      if (job && job.status === "running" && job.logs) {
        const date = new Date();
        const timestamp = `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}]`;
        const newLog = `${timestamp} [INFO] Processing data batch ${Math.floor(Math.random() * 3) + 3}/5`;
        
        const updatedJob = { 
          ...job,
          logs: [...job.logs, newLog]
        };
        setJob(updatedJob);
        
        // Scroll to bottom of logs
        setTimeout(() => {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      toast({
        title: "Job refreshed",
        description: "Latest job information has been loaded.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh job information.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
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
    if (!job || !job.logs) return;
    
    const logText = job.logs.join('\n');
    copyToClipboard(logText);
  };

  const copyErrorLogs = () => {
    if (!job || !job.logs) return;
    
    const errorLogs = job.logs.filter(log => isErrorLog(log));
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
  const getFilteredLogs = () => {
    if (!job || !job.logs) return [];
    
    return job.logs.filter(log => 
      log.toLowerCase().includes(logSearchQuery.toLowerCase())
    );
  };

  // Filter error logs based on search query and level filters
  const getFilteredErrorLogs = () => {
    if (!job || !job.logs) return [];
    
    return job.logs.filter(log => {
      // Check if it's an error log
      if (!isErrorLog(log)) return false;
      
      // Apply search filter
      if (!log.toLowerCase().includes(errorSearchQuery.toLowerCase())) return false;
      
      // Apply level filters
      if (errorLevelFilters.length > 0) {
        return errorLevelFilters.some(level => log.includes(`[${level}]`));
      }
      
      return true;
    });
  };

  const toggleErrorLevelFilter = (level: string) => {
    setErrorLevelFilters(current => 
      current.includes(level)
        ? current.filter(l => l !== level)
        : [...current, level]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
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
                The job you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();
  const filteredErrorLogs = getFilteredErrorLogs();

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
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
      
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
                
                {job.status !== "running" && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {job.status === "completed" ? "Completed" : "Failed"}: {format(job.updatedAt, "MMM d, yyyy HH:mm:ss")}
                    </span>
                  </div>
                )}
                
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
                      className="absolute top-2 right-2"
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
              <ScrollArea className="h-[400px] w-full rounded-md p-4">
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
                          {showTimestamps || !parsedLog.timestamp ? (
                            <span>{parsedLog.raw}</span>
                          ) : (
                            <span>{parsedLog.content}</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-muted-foreground">
                      {logSearchQuery ? "No logs matching your search" : "No logs available"}
                    </div>
                  )}
                  
                  {job.status === "running" && (
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Job is still running...</span>
                    </div>
                  )}
                  
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </Card>
            
            <div className="mt-2 text-xs text-muted-foreground">
              {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"} {logSearchQuery && "matching filter"}
            </div>
          </CardContent>
        </Card>
        
        {/* Error Logs Section */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Error Logs
              </CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuCheckboxItem
                      checked={errorLevelFilters.includes("ERROR")}
                      onCheckedChange={() => toggleErrorLevelFilter("ERROR")}
                    >
                      ERROR
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={errorLevelFilters.includes("WARN")}
                      onCheckedChange={() => toggleErrorLevelFilter("WARN")}
                    >
                      WARN
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={errorLevelFilters.includes("DEBUG")}
                      onCheckedChange={() => toggleErrorLevelFilter("DEBUG")}
                    >
                      DEBUG
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyErrorLogs}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy error logs</p>
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
                placeholder="Search error logs..."
                className="pl-8 pr-8"
                value={errorSearchQuery}
                onChange={(e) => setErrorSearchQuery(e.target.value)}
              />
              {errorSearchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-5 w-5"
                  onClick={() => setErrorSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {filteredErrorLogs.length > 0 ? (
              <div className="space-y-3">
                {filteredErrorLogs.map((log, index) => {
                  const parsedLog = parseLogEntry(log);
                  
                  return (
                    <Alert key={index} variant="destructive" className="text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="font-mono">
                        {parsedLog.timestamp && (
                          <span className="text-xs opacity-70">[{parsedLog.timestamp}] </span>
                        )}
                        {parsedLog.level && `[${parsedLog.level}]`}
                      </AlertTitle>
                      <AlertDescription className="font-mono mt-1">
                        {parsedLog.content}
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-1">No Errors Found</h3>
                <p className="text-sm">
                  {errorSearchQuery || errorLevelFilters.length < 3 
                    ? "No error logs match your current filters" 
                    : "This job has no error logs"}
                </p>
              </div>
            )}
            
            <div className="mt-4 text-xs text-muted-foreground">
              {filteredErrorLogs.length} {filteredErrorLogs.length === 1 ? "error" : "errors"} {(errorSearchQuery || errorLevelFilters.length < 3) && "matching filters"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}