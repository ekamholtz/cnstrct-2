
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientPageHeader } from "./ClientPageHeader";

export function ClientDashboardHeader() {
  return (
    <ClientPageHeader 
      pageTitle="Dashboard"
      pageDescription="View your projects and track progress"
    />
  );
}
