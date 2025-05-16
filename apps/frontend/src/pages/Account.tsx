import { useState } from "react";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, type Account } from "@/hooks/useAccount";
import { useToast } from "@/hooks/use-toast";
import { useInvalidateQueueList } from "@/hooks/useQueueList";

// shadcn UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form validation schema
const accountFormSchema = z.object({
  account: z.string().min(1, "Account name cannot be empty"),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountPage() {
  const { data, isLoading, error, refetch } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();
  const { invalidateQueueList } = useInvalidateQueueList();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  // Create account form
  const createForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      account: "",
    },
  });

  // Edit account form
  const editForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      account: "",
    },
  });

  // Handle create account
  const handleCreateSubmit = async (values: AccountFormValues) => {
    try {
      await createAccount.mutateAsync(values);
      toast({
        title: "Success",
        description: `Account ${values.account} has been created`,
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      await invalidateQueueList();
    } catch (err) {
      toast({
        title: "Failed to create",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Handle edit account
  const handleEditSubmit = async (values: AccountFormValues) => {
    if (!editingAccount) return;

    try {
      await updateAccount.mutateAsync({
        id: editingAccount._id,
        data: values,
      });
      toast({
        title: "Success",
        description: `Account ${values.account} has been updated`,
      });
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      await invalidateQueueList();
    } catch (err) {
      toast({
        title: "Failed to update",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Handle delete account
  const handleDelete = async () => {
    if (!deleteAccountId) return;

    try {
      await deleteAccount.mutateAsync(deleteAccountId);
      toast({
        title: "Success",
        description: "Account has been deleted",
      });
      setDeleteAccountId(null);
      await invalidateQueueList();
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    editForm.reset({
      account: account.account,
    });
    setIsEditDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Management</h1>
            <p className="text-muted-foreground">Manage accounts in the system</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="h-10 px-4 py-2 border-b">
                <Skeleton className="h-5 w-full" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
                  <Skeleton className="h-5 w-48" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Management</h1>
          <p className="text-muted-foreground">Manage accounts in the system</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>Error loading account data: {error instanceof Error ? error.message : "Unknown error"}</p>
            <Button size="sm" onClick={() => refetch()} className="w-fit">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Management</h1>
          <p className="text-muted-foreground">Manage accounts in the system</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a new account. Account name must be unique.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAccount.isPending}>
                    {createAccount.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account List</CardTitle>
          <CardDescription>
            All available accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.accounts && data.accounts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.accounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>{account.account}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteAccountId(account._id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete account "{account.account}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteAccountId(null)}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteAccount.isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">No accounts available</p>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit account dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Modify account information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingAccount(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAccount.isPending}>
                  {updateAccount.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
