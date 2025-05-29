import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTemplates, useRunTemplate } from "@/hooks/useTemplates";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface QueueTemplateSelectorProps {
  queueName: string;
}

export function QueueTemplateSelector({ queueName }: QueueTemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const { data: templates = [], isLoading } = useTemplates();
  const runTemplateMutation = useRunTemplate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate()

  // Auto-select first template when templates are loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id.toString());
    } else if (templates.length === 0) {
      // Reset selection if there are no templates
      setSelectedTemplateId("");
    }
  }, [templates]);

  const handleRunTemplate = async () => {
    if (!selectedTemplateId) return;

    try {
      const result = await runTemplateMutation.mutateAsync({
        templateId: Number(selectedTemplateId),
        queueName,
      });

      if (result.jobId) {
        // Show success toast notification with link to job details
        toast({
          title: "Template executed",
          description: (
            <div>
              The template has been successfully added to the queue.{" "}
                <button
                onClick={() => navigate(`/queues/jobs/${queueName}/${result.jobId}`)}
                className="underline text-primary hover:text-primary/80"
                >
                View job details
                </button>
            </div>
          ),
        });

        // Refetch queue data to update the counts
        queryClient.invalidateQueries({ queryKey: ['queue'] });
        // Reset the selected template
        setSelectedTemplateId(templates[0].id.toString());
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run template",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Select
        value={selectedTemplateId}
        onValueChange={setSelectedTemplateId}
        disabled={isLoading || runTemplateMutation.isPending}
      >
        <SelectTrigger className="flex-grow">
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.length === 0 ? (
            <div className="py-2 px-2 text-sm text-muted-foreground">No templates available</div>
          ) : (
            templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        className="min-w-9"
        disabled={!selectedTemplateId || runTemplateMutation.isPending}
        onClick={handleRunTemplate}
      >
        <Play className={`h-4 w-4 ${runTemplateMutation.isPending ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
