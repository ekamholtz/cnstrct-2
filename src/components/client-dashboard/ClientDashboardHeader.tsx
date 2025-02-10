
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientPageHeader } from "./ClientPageHeader";

export function ClientDashboardHeader() {
  const { data: profile } = useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <ClientPageHeader 
      pageTitle="Dashboard"
      pageDescription="View your projects and track progress"
    />
  );
}
