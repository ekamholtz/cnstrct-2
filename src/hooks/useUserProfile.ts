
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useEffect, useState, useCallback } from "react";

type UserRole = Database["public"]["Enums"]["user_role"];

type Profile = {
  id: string;
  role: UserRole;
  has_completed_profile: boolean;
  full_name: string | null;
  company_name: string | null;
  website: string | null;
  license_number: string | null;
};

export function useUserProfile() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  }, []);

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession]);

  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select()
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const isLoading = profileLoading || isAuthenticated === null;

  return {
    profile,
    isLoading,
    error,
    isAuthenticated
  };
}
