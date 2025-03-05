
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from 'react-router-dom';

// Define the invoice type explicitly to avoid infinite recursion
interface InvoiceWithRelations {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  milestone?: {
    name: string;
    project?: {
      name: string;
    };
  };
}

export const InvoiceList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['contractor-invoices'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get user profile to determine gc_account_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id, role')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;

      // Query invoices based on gc_account_id instead of contractor_id
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
        .eq('gc_account_id', profile.gc_account_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InvoiceWithRelations[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for invoices');
    
    const channel = supabase
      .channel('invoice-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Invalidate the query to refetch data
          queryClient.invalidateQueries({ queryKey: ['contractor-invoices'] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Handle error with useEffect to avoid render issues
  useEffect(() => {
    if (error) {
      console.error('Error fetching invoices:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invoices. Please try again.",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Milestone</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices?.map((invoice) => (
            <TableRow 
              key={invoice.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <TableCell>{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.milestone?.project?.name}</TableCell>
              <TableCell>{invoice.milestone?.name}</TableCell>
              <TableCell>
                {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>${invoice.amount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge
                  className={
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'pending_payment'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {invoice.status === 'pending_payment' ? 'Pending' : invoice.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
