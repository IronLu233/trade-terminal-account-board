import { useState } from "react";
import { useCreateQueue } from "@/hooks/useQueueList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface CreateQueueDialogProps {
  trigger?: React.ReactNode;
}

export function CreateQueueDialog({ trigger }: CreateQueueDialogProps) {
  const [open, setOpen] = useState(false);
  const [queueName, setQueueName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createQueue } = useCreateQueue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueName.trim()) return;

    setIsSubmitting(true);
    try {
      await createQueue(queueName.trim());
      toast.success(`Queue "${queueName}" created successfully`);
      setQueueName("");
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to create queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button>
      <PlusCircle className="mr-2 h-4 w-4" />
      Create Queue
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Queue</DialogTitle>
            <DialogDescription>
              Create a new queue to process jobs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="queueName" className="w-24">
                Queue Name
              </Label>
              <Input
                id="queueName"
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
                className="flex-1"
                autoFocus
                required
              />
            </div>
            <Alert className="bg-muted">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                The queue name will also be used as the <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-foreground font-mono">--account</code> parameter.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Queue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
