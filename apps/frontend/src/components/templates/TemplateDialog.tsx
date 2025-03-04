import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Pencil } from "lucide-react";
import { Template } from "@/types/queue";
import { TemplatePayload } from "@/hooks/useTemplates";
import scripts from "@/scripts.json";

// Define the form schema with Zod
const formSchema = z.object({
  script: z.string({
    required_error: "Please select a script",
  }),
  name: z.string().min(3, {
    message: "Template name must be at least 3 characters",
  }),
  parameter: z.string().optional(),
  executionPath: z.string().optional(),
});

// TypeScript type derived from the schema
type FormValues = z.infer<typeof formSchema>;

interface TemplateDialogProps {
  template?: Template;
  mode: "create" | "edit";
  trigger?: React.ReactNode;
  onSuccess?: (template: TemplatePayload) => Promise<void>;
  isSubmitting?: boolean;
}

export default function TemplateDialog({
  template,
  mode = "create",
  trigger,
  onSuccess,
  isSubmitting = false
}: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = mode === "edit";

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      script: "",
      name: "",
      parameter: "",
      executionPath: "",
    },
  });

  // Update form values when template changes or mode changes
  useEffect(() => {
    if (isEditMode && template) {
      // For edit mode, populate form with template data
      form.reset({
        name: template.name,
        script: template.script,
        parameter: template.parameter || "",
        executionPath: template.executionPath || "",
      });
    } else if (!isEditMode) {
      // For create mode, reset to defaults
      form.reset({
        script: "",
        name: "",
        parameter: "",
        executionPath: "",
      });
    }
  }, [template, isEditMode, form, open]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (onSuccess) {
      await onSuccess(data);
      setOpen(false);
      if (!isEditMode) {
        form.reset();
      }
    }
  };

  const defaultTrigger = isEditMode ? (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Pencil className="h-4 w-4" />
      <span className="sr-only">Edit template</span>
    </Button>
  ) : (
    <Button className="w-full md:w-auto">
      <Plus className="mr-2 h-4 w-4" />
      New Template
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Template" : "Create New Template"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modify the template details. Click save when you're done."
              : "Add a new message queue template. Click add when you're done."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter template name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="script"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Script</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a script" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {scripts.map((script) => (
                        <SelectItem key={script.fileName} value={script.fileName}>
                          {script.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parameter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parameter (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter parameter"
                      {...field}
                      disabled={isSubmitting}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="executionPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Execution Path (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter execution path"
                      {...field}
                      disabled={isSubmitting}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? (isEditMode ? "Saving..." : "Adding...")
                  : (isEditMode ? "Save Changes" : "Add Template")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
