
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InvoiceList } from "@/components/invoice-dashboard/InvoiceList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const InvoiceDashboard = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data.role;
    },
  });

  const isGeneralContractor = userRole === 'gc_admin';

  useEffect(() => {
    if (!isGeneralContractor) {
      navigate('/client-dashboard');
    }
  }, [isGeneralContractor, navigate]);

  if (!isGeneralContractor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto py-8 mt-16">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
            <Button onClick={() => navigate('/invoice/create')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </CardHeader>
          <CardContent>
            <InvoiceList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceDashboard;
