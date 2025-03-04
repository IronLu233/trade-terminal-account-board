import StatsGrid from '@/components/dashboard/StatsGrid';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { useNavigate } from 'react-router-dom'; // Add this import

function ErrorFallback() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        There was an error loading the dashboard data. Please try refreshing the page.
      </AlertDescription>
    </Alert>
  );
}

export default function Dashboard() {
  const { data: systemInfo, isLoading, error } = useSystemInfo();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your message queues in real-time
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !systemInfo ? (
              <div>Loading system information...</div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load system information
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>CPU Usage</span>
                    <span>{systemInfo.cpu.usage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${systemInfo.cpu.usage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Memory Usage</span>
                    <span>{systemInfo.memory.usagePercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${systemInfo.memory.usagePercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Disk Space</span>
                    <span>{systemInfo.disk.usagePercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${systemInfo.disk.usagePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <StatsGrid  />
      </div>
    </ErrorBoundary>
  );
}
