import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueueStats } from "@/types/queue";
import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface QueueCardProps {
  queue: QueueStats;
}

export default function QueueCard({ queue }: QueueCardProps) {
  const { queueName, running, successful, failed, lastUpdated } = queue;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-lg font-medium">
          <Link
            to={`queues/jobs/${queueName}`}
            className="hover:underline text-primary"
          >
            {queueName}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 gap-4">
          <Link
            to={`queues/jobs/${queueName}?status=active`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <Activity className="h-5 w-5 text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold group-hover:text-primary transition-colors">{running}</span>
            <span className="text-xs text-muted-foreground">Running</span>
          </Link>
          <Link
            to={`queues/jobs/${queueName}?status=completed`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <CheckCircle className="h-5 w-5 text-green-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold group-hover:text-primary transition-colors">{successful}</span>
            <span className="text-xs text-muted-foreground">Successful</span>
          </Link>
          <Link
            to={`queues/jobs/${queueName}?status=failed`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <XCircle className="h-5 w-5 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold group-hover:text-primary transition-colors">{failed}</span>
            <span className="text-xs text-muted-foreground">Failed</span>
          </Link>
        </div>

        {/* Add last updated information */}
        <div className="mt-4 pt-3 border-t border-muted flex items-center justify-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {lastUpdated
            ? `Updated ${formatDistanceToNow(lastUpdated)} ago`
            : "No update time available"}
        </div>
      </CardContent>
    </Card>
  );
}
