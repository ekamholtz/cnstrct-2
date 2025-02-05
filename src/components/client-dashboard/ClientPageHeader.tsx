
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientPageHeaderProps {
  pageTitle: string;
  pageDescription: string;
}

export function ClientPageHeader({ pageTitle, pageDescription }: ClientPageHeaderProps) {
  const { data: profile } = useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{profile?.full_name || 'Client'}</h1>
      <div className="mt-1">
        <h2 className="text-xl font-semibold text-gray-700">{pageTitle}</h2>
        <p className="text-gray-600">{pageDescription}</p>
      </div>
    </div>
  );
}
