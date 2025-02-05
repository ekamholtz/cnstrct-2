
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText } from "lucide-react";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export function ClientInvoiceSummary() {
  const { toast } = useToast();
  
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['client-invoices-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No user found');
      }

      console.log('Step 1: Starting query with user:', user.id);

      // First get the client details for this user
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .single();

      if (clientError) {
        console.error('Step 1 Error - Failed to fetch client:', clientError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch client information",
        });
        throw clientError;
      }

      console.log('Step 2: Found client:', client);

      // Get projects for this client
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', client.id);

      if (projectsError) {
        console.error('Step 3 Error - Failed to fetch projects:', projectsError);
        throw projectsError;
      }

      console.log('Step 3: Found projects:', projects);

      if (!projects?.length) {
        console.log('No projects found for client');
        return { invoices: [], totalPending: 0 };
      }

      // Get milestones for these projects
      const projectIds = projects.map(p => p.id);
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id, name, project_id')
        .in('project_id', projectIds);

      if (milestonesError) {
        console.error('Step 4 Error - Failed to fetch milestones:', milestonesError);
        throw milestonesError;
      }

      console.log('Step 4: Found milestones:', milestones);

      if (!milestones?.length) {
        console.log('No milestones found for projects');
        return { invoices: [], totalPending: 0 };
      }

      // Get all pending invoices for total calculation
      const milestoneIds = milestones.map(m => m.id);
      const { data: allPendingInvoices, error: pendingError } = await supabase
        .from('invoices')
        .select('amount')
        .in('milestone_id', milestoneIds)
        .eq('status', 'pending_payment');

      if (pendingError) throw pendingError;

      // Calculate total pending amount from all invoices
      const totalPending = allPendingInvoices?.reduce((sum, inv) => 
        sum + Number(inv.amount), 0) || 0;

      // Get only 3 pending invoices for display
      const { data: displayInvoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          status,
          created_at,
          milestone_id,
          milestone:milestone_id (
            id,
            name,
            project:project_id (
              id,
              name
            )
          )
        `)
        .in('milestone_id', milestoneIds)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: true })
        .limit(3);

      if (invoiceError) {
        console.error('Step 5 Error - Failed to fetch invoices:', invoiceError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch invoices",
        });
        throw invoiceError;
      }

      console.log('Step 5: Final result:', { displayInvoices, totalPending });
      return { 
        invoices: displayInvoices || [],
        totalPending
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { invoices = [], totalPending = 0 } = invoiceData || {};

  return (
    <div className="space-y-4">
      <Link to="/invoices" className="block">
        <Card className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Pending Payments</span>
              </div>
              <span className="text-lg font-semibold text-yellow-800">
                ${totalPending.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="bg-white rounded-lg border divide-y">
        {invoices?.map((invoice) => (
          <Link
            key={invoice.id}
            to={`/project/${invoice.milestone?.project?.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-4">
              <FileText className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <div className="font-medium text-gray-900">
                  {invoice.milestone?.project?.name}
                </div>
                <div className="text-sm text-gray-500">
                  {invoice.milestone?.name}
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-medium">
                  ${Number(invoice.amount).toLocaleString()}
                </div>
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </Link>
        ))}
        {(!invoices || invoices.length === 0) && (
          <div className="p-4 text-center text-gray-500">
            No invoices found.
          </div>
        )}
      </div>
    </div>
  );
}
