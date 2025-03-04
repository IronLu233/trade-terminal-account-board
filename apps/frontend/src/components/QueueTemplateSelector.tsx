import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface QueueTemplateSelectorProps {
  queueName: string;
}

export function QueueTemplateSelector({ queueName }: QueueTemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useTemplates();
  const runTemplateMutation = useRunTemplate();
  const { toast } = useToast();

  const handleRunTemplate = async () => {
    if (!selectedTemplateId) return;

    try {
      const result = await runTemplateMutation.mutateAsync({
        templateId: Number(selectedTemplateId),
        queueName,
      });

      // 假设 API 返回的 result 中包含 jobId
      if (result.jobId) {
        toast({
          title: "Template executed",
          description: "The template has been successfully added to the queue.",
        });

        // 导航到新创建的 job 的详情页
        navigate(`/queues/jobs/${queueName}/${result.jobId}`);
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
    <div className="flex items-center gap-2">
      <Select
        value={selectedTemplateId}
        onValueChange={setSelectedTemplateId}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        disabled={!selectedTemplateId || runTemplateMutation.isPending}
        onClick={handleRunTemplate}
      >
        <Play className="h-4 w-4" />
      </Button>
    </div>
  );
}
