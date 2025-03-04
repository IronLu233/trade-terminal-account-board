import TemplateList from '@/components/templates/TemplateList';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplates } from '@/hooks/useTemplates';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex flex-col gap-4">
        <p>There was an error loading the templates: {error.message}</p>
        <Button size="sm" onClick={resetErrorBoundary} className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="rounded-md border">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
            <Skeleton className="h-9 w-[120px]" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Templates() {
  const { data: templates = [], isLoading, error, refetch } = useTemplates();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage your message queue templates
          </p>
        </div>

        <LoadingState />
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => refetch()}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage your message queue templates
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Failed to load templates: {error.message}</p>
              <Button size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <TemplateList templates={templates} />
        )}
      </div>
    </ErrorBoundary>
  );
}
