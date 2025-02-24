
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<Profile | null> => {
      console.log("Fetching user profile...");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("No session found");
        return null;
      }

      console.log("Session found, fetching profile...");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }

      console.log("Profile data:", data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2,
  });

  // Subscribe to auth state changes to invalidate profile cache
  supabase.auth.onAuthStateChange(() => {
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
  });

  return {
    profile,
    isLoading,
    error,
  };
}
