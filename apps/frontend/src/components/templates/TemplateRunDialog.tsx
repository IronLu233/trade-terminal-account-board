import { useState, useEffect } from "react";
import { Template } from "@/types/queue";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRunTemplate } from "@/hooks/useTemplates";
import { useQueueList } from "@/hooks/useQueueList";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface TemplateRunDialogProps {
  template: Template;
  trigger?: React.ReactNode;
}

const formSchema = z.object({
  queueName: z.string({
    required_error: "Please select a queue.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function TemplateRunDialog({ template, trigger }: TemplateRunDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const runMutation = useRunTemplate();
  const { data: queuesData, isLoading: isLoadingQueues } = useQueueList();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      queueName: "", // Initialize with empty string
    },
  });

  // Set the first queue as default when queues load and dialog opens
  useEffect(() => {
    if (open && queuesData?.queues.length && !form.getValues("queueName")) {
      form.setValue("queueName", queuesData.queues[0].name);
    }
  }, [queuesData, open, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await runMutation.mutateAsync({
        templateId: Number(template.id),
        queueName: values.queueName,
      });

      toast({
        title: "Template executed",
        description: `Template "${template.name}" has been executed successfully on queue "${values.queueName}".`,
      });

      // Navigate to job details page
      navigate(`/queues/jobs/${values.queueName}/${result.jobId}`);
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to execute template",
        variant: "destructive",
      });
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      form.reset({ queueName: queuesData?.queues?.length ? queuesData.queues[0].name : "" });
    }
    setOpen(newOpen);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
      <Play className="h-4 w-4" />
      <span className="sr-only">Run template</span>
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Run Template: {template.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Select a queue to run this template on. This will create new jobs based on the template configuration.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="queueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Queue</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingQueues || runMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a queue" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingQueues ? (
                          <SelectItem value="loading" disabled>Loading queues...</SelectItem>
                        ) : (
                          queuesData?.queues.map(queue => (
                            <SelectItem key={queue.name} value={queue.name}>
                              {queue.name}
                            </SelectItem>
                          ))
                        )}
                        {!isLoadingQueues && (!queuesData?.queues || queuesData.queues.length === 0) && (
                          <SelectItem value="none" disabled>No queues available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                disabled={runMutation.isPending || isLoadingQueues || !form.getValues("queueName")}
              >
                {runMutation.isPending ? "Running..." : "Run"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
