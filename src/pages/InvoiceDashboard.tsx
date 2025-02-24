
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InvoiceList } from "@/components/invoice-dashboard/InvoiceList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const InvoiceDashboard = () => {
  const { toast } = useToast();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-700">
              {profile?.company_name || profile?.full_name}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Dashboard</h1>
            <p className="text-gray-600">Manage and track all project invoices</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
            <Link to="/invoice/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <InvoiceList />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceDashboard;
