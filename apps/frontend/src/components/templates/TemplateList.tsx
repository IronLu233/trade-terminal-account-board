import { useState } from "react";
import { Template } from "@/types/queue";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Edit, MoreHorizontal, Search, Trash2, Play } from "lucide-react";
import TemplateDialog from "./TemplateDialog";
import { useToast } from "@/hooks/use-toast";

interface TemplateListProps {
  templates: Template[];
}

export default function TemplateList({ templates: initialTemplates }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(template => template.id !== id));
  };

  const handleEditSuccess = (updatedTemplate: any, id: string) => {
    setTemplates(templates.map(template => 
      template.id === id 
        ? { 
            ...template, 
            ...updatedTemplate, 
            updatedAt: new Date() 
          } 
        : template
    ));
  };

  const handleCreateSuccess = (newTemplate: any) => {
    const template: Template = {
      id: `temp-${Date.now()}`, // In a real app, this would come from the backend
      name: newTemplate.name,
      description: newTemplate.description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      queueName: newTemplate.queueName,
      script: newTemplate.script,
      action: newTemplate.action,
      executionPath: newTemplate.executionPath
    };
    
    setTemplates([...templates, template]);
  };

  const handleRunTemplate = (template: Template) => {
    // In a real app, this would make an API call to run the template
    toast({
      title: "Template Executed",
      description: `Template "${template.name}" has been queued for execution.`,
      duration: 3000,
    });
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
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
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
                    <TableCell className="hidden md:table-cell">{template.description}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(template.createdAt, 'MMM d, yyyy')}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(template.updatedAt, 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="default" 
                              size="icon" 
                              className="h-8 w-8 bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <Play className="h-4 w-4" />
                              <span className="sr-only">Run template</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Run Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to run this template?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRunTemplate(template)}
                              >
                                Run
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

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
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
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
      </CardContent>
    </Card>
  );
}