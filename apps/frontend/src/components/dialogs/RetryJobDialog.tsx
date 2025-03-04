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

interface RetryJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobId: string;
  jobName: string;
}

export function RetryJobDialog({
  isOpen,
  onClose,
  onConfirm,
  jobId,
  jobName,
}: RetryJobDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retry Job</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to retry job "{jobName}" (ID: {jobId})? This will create a new attempt for this job.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Retry</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
