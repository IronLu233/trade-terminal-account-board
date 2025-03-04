import { useState } from "react";
import { Template } from "@/types/queue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Edit, MoreHorizontal, Search, Trash2, Play } from "lucide-react";
import TemplateDialog from "./TemplateDialog";
import TemplateRunDialog from "./TemplateRunDialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateTemplate, useUpdateTemplate, useDeleteTemplate, TemplatePayload } from "@/hooks/useTemplates";

interface TemplateListProps {
  templates: Template[];
}

export default function TemplateList({ templates }: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Mutations
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = async (updatedTemplate: TemplatePayload, id: string) => {
    try {
      await updateMutation.mutateAsync({ id, ...updatedTemplate });
      toast({
        title: "Template updated",
        description: "The template has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const handleCreateSuccess = async (newTemplate: TemplatePayload) => {
    try {
      await createMutation.mutateAsync(newTemplate);
      toast({
        title: "Template created",
        description: "The new template has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>
              Manage your message queue templates
            </CardDescription>
          </div>
          <TemplateDialog
            mode="create"
            onSuccess={handleCreateSuccess}
            isSubmitting={createMutation.isPending}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1 max-w-3xl">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead className="w-[200px]">Created</TableHead>
                  <TableHead className="w-[200px]">Updated</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No templates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{format(template.createdAt, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(template.updatedAt, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <TemplateRunDialog
                            template={template}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 mr-1">
                                <Play className="h-4 w-4" />
                                <span className="sr-only">Run template</span>
                              </Button>
                            }
                          />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <TemplateDialog
                                  mode="edit"
                                  template={template}
                                  trigger={
                                    <Button variant="ghost" className="w-full justify-start px-2">
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </Button>
                                  }
                                  onSuccess={(updatedTemplate) => handleEditSuccess(updatedTemplate, template.id)}
                                  isSubmitting={updateMutation.isPending}
                                />
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-start px-2 text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this template? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90"
                                      onClick={() => handleDelete(template.id)}
                                      disabled={deleteMutation.isPending}
                                    >
                                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
