import { MOCK_TEMPLATES } from '@/data/mockData';
import TemplateList from '@/components/templates/TemplateList';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function ErrorFallback() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        There was an error loading the templates. Please try refreshing the page.
      </AlertDescription>
    </Alert>
  );
}

export default function Templates() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage your message queue templates
          </p>
        </div>

        <TemplateList templates={MOCK_TEMPLATES} />
      </div>
    </ErrorBoundary>
  );
}