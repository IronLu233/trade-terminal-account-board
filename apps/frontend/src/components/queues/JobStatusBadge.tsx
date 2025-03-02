import { Badge } from "@/components/ui/badge";
import { Job } from "@/types/queue";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobStatusBadgeProps {
  status: Job["status"];
}

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          variant: "success" as const,
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
        };
      case "running":
        return {
          label: "Running",
          variant: "default" as const,
          icon: Clock,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
        };
      case "failed":
        return {
          label: "Failed",
          variant: "destructive" as const,
          icon: AlertCircle,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
        };
      default:
        return {
          label: "Unknown",
          variant: "outline" as const,
          icon: AlertCircle,
          className: ""
        };
    }
  };

  const { label, icon: Icon, className } = getStatusConfig();

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 font-medium", className)}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
}