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
  FormDescription,
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
import { useToast } from "@/hooks/use-toast";
import { Template } from "@/types/queue";

// Define the form schema with Zod
const formSchema = z.object({
  queueName: z.string({
    required_error: "Please select a queue name",
  }),
  script: z.string({
    required_error: "Please select a script",
  }),
  name: z.string().min(3, {
    message: "Template name must be at least 3 characters",
  }),
  description: z.string().optional(),
  action: z.string().optional(),
  executionPath: z.string().optional(),
});

// TypeScript type derived from the schema
type FormValues = z.infer<typeof formSchema>;

interface TemplateDialogProps {
  template?: Template;
  mode: "create" | "edit";
  trigger?: React.ReactNode;
  onSuccess?: (template: FormValues) => void;
}

export default function TemplateDialog({ 
  template, 
  mode = "create", 
  trigger, 
  onSuccess 
}: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditMode = mode === "edit";

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      queueName: "",
      script: "",
      name: "",
      description: "",
      action: "",
      executionPath: "",
    },
  });

  // Update form values when template changes or mode changes
  useEffect(() => {
    if (isEditMode && template) {
      // For edit mode, populate form with template data
      form.reset({
        name: template.name,
        description: template.description || "",
        queueName: template.queueName || "account1", // Assuming this field exists
        script: template.script || "add_leverage_main.py", // Assuming this field exists
        action: template.action || "",
        executionPath: template.executionPath || "",
      });
    } else if (!isEditMode) {
      // For create mode, reset to defaults
      form.reset({
        queueName: "",
        script: "",
        name: "",
        description: "",
        action: "",
        executionPath: "",
      });
    }
  }, [template, isEditMode, form, open]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Log the form data (in a real app, this would be sent to an API)
      console.log("Form submitted:", data);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Show success toast
      toast({
        title: isEditMode ? "Template updated" : "Template created",
        description: isEditMode 
          ? `Template "${data.name}" has been updated successfully.`
          : `Template "${data.name}" has been created successfully.`,
        duration: 3000,
      });
      
      // Reset form and close dialog
      if (!isEditMode) {
        form.reset();
      }
      setOpen(false);
    } catch (error) {
      // Show error toast
      toast({
        title: isEditMode ? "Failed to update template" : "Failed to create template",
        description: "There was an error. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
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
                  <FormDescription>
                    A descriptive name for this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter template description" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of the template's purpose
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="queueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Queue Name</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a queue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="account1">account1</SelectItem>
                      <SelectItem value="account2">account2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The queue where this template will be applied
                  </FormDescription>
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
                      <SelectItem value="add_leverage_main.py">add_leverage_main.py</SelectItem>
                      <SelectItem value="execution_main_v3.py">execution_main_v3.py</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The script to execute in the queue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter an action" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Specific action to perform (optional)
                  </FormDescription>
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
                    />
                  </FormControl>
                  <FormDescription>
                    Custom execution path if needed
                  </FormDescription>
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