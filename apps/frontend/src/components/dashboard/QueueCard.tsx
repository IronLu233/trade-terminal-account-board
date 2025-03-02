import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueueStats } from "@/types/queue";
import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface QueueCardProps {
  queue: QueueStats;
}

export default function QueueCard({ queue }: QueueCardProps) {
  const { queueName, running, successful, failed, lastUpdated } = queue;

  const total = running + successful + failed;
  const successRate = total > 0 ? (successful / total) * 100 : 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-lg font-medium">
          <Link
            to={`/queues?queue=${queueName}`}
            className="hover:underline text-primary"
          >
            {queueName}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 gap-4">
          <Link
            to={`/queues?queue=${queueName}&status=running`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <Activity className="h-5 w-5 text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold group-hover:text-primary transition-colors">{running}</span>
            <span className="text-xs text-muted-foreground">Running</span>
          </Link>
          <Link
            to={`/queues?queue=${queueName}&status=completed`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <CheckCircle className="h-5 w-5 text-green-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold group-hover:text-primary transition-colors">{successful}</span>
            <span className="text-xs text-muted-foreground">Successful</span>
          </Link>
          <Link
            to={`/queues?queue=${queueName}&status=failed`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <XCircle className="h-5 w-5 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold group-hover:text-primary transition-colors">{failed}</span>
            <span className="text-xs text-muted-foreground">Failed</span>
          </Link>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {formatDistanceToNow(lastUpdated)} ago
        </div>
      </CardContent>
    </Card>
  );
}
