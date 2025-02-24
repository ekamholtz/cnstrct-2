
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<Profile | null> => {
      console.log("Fetching user profile...");
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session fetch error:", sessionError);
        throw sessionError;
      }
      
      if (!session?.user) {
        console.log("No session found");
        return null;
      }

      console.log("Session found, fetching profile...");
      const { data, error } = await supabase
        .from("profiles")
        .select()
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }

      console.log("Profile data:", data);
      return data;
    },
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const isLoading = profileLoading || isAuthenticated === null;

  return {
    profile,
    isLoading,
    error,
    isAuthenticated
  };
}
