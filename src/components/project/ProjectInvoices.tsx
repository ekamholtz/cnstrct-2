import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "pending_payment" | "paid" | "cancelled";
  created_at: string;
  milestone: {
    name: string;
    project: {
      name: string;
    };
  };
}

interface ProjectInvoicesProps {
  projectId: string;
}

const paymentSchema = z.object({
  payment_method: z.enum(["cc", "check", "transfer", "cash"], {
    required_error: "Please select a payment method",
  }),
  payment_date: z.date({
    required_error: "Please select a payment date",
  }),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function ProjectInvoices({ projectId }: ProjectInvoicesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date(),
    },
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      console.log('Fetching invoices for project:', projectId);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          milestone:milestone_id (
            name,
            project:project_id (
              name
            )
          )
        `)
        .eq('milestone.project_id', projectId);

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      console.log('Fetched invoices:', data);
      return data as Invoice[];
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ 
      invoiceId, 
      payment_method, 
      payment_date 
    }: { 
      invoiceId: string; 
      payment_method: string; 
      payment_date: Date;
    }) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method,
          payment_date: payment_date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      toast({
        title: "Success",
        description: "Invoice has been marked as paid",
      });
    },
    onError: (error) => {
      console.error('Error marking invoice as paid:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark invoice as paid. Please try again.",
      });
    },
  });

  const onSubmit = async (invoiceId: string, data: PaymentFormData) => {
    await markAsPaidMutation.mutateAsync({
      invoiceId,
      payment_method: data.payment_method,
      payment_date: data.payment_date,
    });
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Project Invoices</h2>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          <span className="text-lg font-medium">
            Total: ${invoices?.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.milestone.name}</TableCell>
                <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.status === 'paid' && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {invoice.status === 'paid'
                        ? 'Paid'
                        : invoice.status === 'cancelled'
                        ? 'Cancelled'
                        : 'Pending Payment'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                      >
                        Mark as Paid
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mark Invoice as Paid</AlertDialogTitle>
                        <AlertDialogDescription>
                          Enter payment details for invoice #{invoice.invoice_number}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => onSubmit(invoice.id, data))} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="payment_method"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="cc">Credit Card</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="payment_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Date</FormLabel>
                                <FormControl>
                                  <input
                                    type="date"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={format(field.value, 'yyyy-MM-dd')}
                                    onChange={(e) => field.onChange(new Date(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => form.reset()}>Cancel</AlertDialogCancel>
                            <Button type="submit">Confirm Payment</Button>
                          </AlertDialogFooter>
                        </form>
                      </Form>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}