
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HomeownerProfileHeader } from "@/components/homeowner-profile/HomeownerProfileHeader";
import { HomeownerProfileForm } from "@/components/homeowner-profile/HomeownerProfileForm";
import { useQuery } from "@tanstack/react-query";

export default function HomeownerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['homeowner-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Add email from auth user to profile data
      return {
        ...data,
        email: user.email
      };
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkSession();
  }, [navigate]);

  if (isLoading || !profile) return null;

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <HomeownerProfileHeader 
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
        />
        <HomeownerProfileForm 
          profile={profile}
          isEditing={isEditing}
          onCancel={() => setIsEditing(false)}
          onSave={() => setIsEditing(false)}
        />
      </div>
    </DashboardLayout>
  );
}
