
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText } from "lucide-react";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export function ClientInvoiceSummary() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Starting invoice fetch for user:', user.id);

      // First, get the client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, email, name')
        .eq('user_id', user.id)
        .single();

      if (clientError) {
        console.error('Error finding client:', clientError);
        throw clientError;
      }

      console.log('Found client:', clientData);

      // Get projects directly with milestones and their invoices
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          milestones!inner (
            id,
            name,
            status,
            invoices (
              *
            )
          )
        `)
        .eq('client_id', clientData.id);

      if (projectError) {
        console.error('Error finding projects:', projectError);
        throw projectError;
      }

      console.log('Projects with milestones and invoices:', projects);

      // Flatten the nested structure to get all invoices
      const allInvoices = projects?.flatMap(project => 
        project.milestones?.flatMap(milestone => 
          milestone.invoices?.map(invoice => ({
            ...invoice,
            milestone: {
              id: milestone.id,
              name: milestone.name,
              project: {
                id: project.id,
                name: project.name,
                client: {
                  id: clientData.id
                }
              }
            }
          }))
        )
      ).filter(Boolean) || [];

      console.log('Processed invoices:', allInvoices);
      return allInvoices;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPending = invoices
    ?.filter(inv => inv.status === 'pending_payment')
    .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

  return (
    <div className="space-y-4">
      <Card className="bg-yellow-50 border-yellow-200">
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
