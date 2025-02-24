
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useEffect, useState } from "react";

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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setIsAuthenticated(!!session);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        setAuthChecked(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select()
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated === true && authChecked,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const isLoading = (profileLoading && isAuthenticated) || !authChecked;

  return {
    profile,
    isLoading,
    error,
    isAuthenticated: authChecked ? isAuthenticated : null
  };
}
