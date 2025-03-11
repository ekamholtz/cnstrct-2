import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/use-toast";
import { useClientInvoices } from "@/components/client-dashboard/hooks/useClientInvoices";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Invoice } from "@/components/project/invoice/types";

// Define extended invoice type that includes milestone and project info
interface ClientInvoice extends Invoice {
  milestone_details?: {
    name: string;
    project?: {
      name: string;
    };
  };
}

// Define the structure of the data returned by useClientInvoices
interface ClientInvoicesData {
  invoices: ClientInvoice[];
  totalPending: number;
}

export default function ClientInvoicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: invoiceData, isLoading, error } = useClientInvoices() as { 
    data: ClientInvoicesData | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Please log in again to continue.",
          });
          navigate('/auth');
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to auth');
          navigate('/auth');
          return;
        }

        // Log user information for debugging
        console.log('Session found for user:', session.user.id);
        console.log('User email:', session.user.email);
        
        // Verify user role
        const { data: profile, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          console.log('User role:', profile?.role);
          
          // Redirect if not a homeowner
          if (profile?.role !== 'homeowner') {
            console.log('User is not a homeowner, redirecting to dashboard');
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader 
          title="Invoices" 
          description="View and manage your invoices"
        />
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader 
          title="Invoices" 
          description="View and manage your invoices"
        />
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load invoices. Please try again later.
            {error instanceof Error ? ` Error: ${error.message}` : ''}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader 
        title="Invoices" 
        description="View and manage your invoices"
      />
      
      {/* Display summary information */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Pending</h3>
            <p className="text-3xl font-bold text-cnstrct-orange mt-2">
              ${invoiceData?.totalPending?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
            <p className="text-3xl font-bold text-cnstrct-navy mt-2">
              {invoiceData?.invoices?.length || 0}
            </p>
          </div>
        </div>
      </div>
      
      {/* Display invoice list */}
      {(!invoiceData?.invoices || invoiceData.invoices.length === 0) ? (
        <Alert>
          <AlertDescription>
            No invoices found. When contractors create invoices for your projects, they will appear here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Milestone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceData.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.project_name || invoice.milestone_details?.project?.name || 'Unknown Project'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.milestone_name || invoice.milestone_details?.name || 'Unknown Milestone'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${Number(invoice.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {invoice.status === 'pending_payment' ? 'Pending Payment' : invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.invoice_number || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
