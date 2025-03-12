
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  gc_account_id: string;
}

export function TeamMembersDebug() {
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);

  // Get current user's GC account ID
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-debug'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('role, gc_account_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Store the GC account ID for using in the team members query
      setGcAccountId(data.gc_account_id);
      
      return data;
    }
  });

  // Fetch team members for the current GC account
  const { data: teamData, isLoading: isLoadingTeam, isError: teamMembersError, refetch } = useQuery({
    queryKey: ['team-members-debug', gcAccountId],
    queryFn: async () => {
      if (!gcAccountId) return { teamMembers: [], isGCAdmin: false, isPlatformAdmin: false };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { teamMembers: [], isGCAdmin: false, isPlatformAdmin: false };

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const { data: teamMembers, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, gc_account_id')
        .eq('gc_account_id', gcAccountId);

      if (error) throw error;

      return {
        teamMembers: teamMembers.map((member: any) => ({
          id: member.id,
          gc_account_id: member.gc_account_id,
          full_name: member.full_name,
          email: member.email,
          role: member.role,
          company_name: member.company_name,
          phone_number: member.phone_number,
          address: member.address,
          license_number: member.license_number,
          website: member.website,
          bio: member.bio,
          has_completed_profile: member.has_completed_profile,
          account_status: member.account_status,
          created_at: member.created_at,
          updated_at: member.updated_at
        })),
        isGCAdmin: userProfile?.role === 'gc_admin',
        isPlatformAdmin: userProfile?.role === 'platform_admin',
        refetch
      };
    },
    enabled: !!gcAccountId
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Team Members Debug Info</h3>
      
      {teamMembersError ? (
        <div className="text-red-600 mb-2">Error loading team members</div>
      ) : isLoadingTeam ? (
        <div>Loading team members...</div>
      ) : (
        <div>
          <p className="mb-2">Current GC Account ID: <span className="font-mono">{gcAccountId || 'None'}</span></p>
          <p className="mb-2">Number of team members: {teamData?.teamMembers?.length || 0}</p>
          
          <div className="overflow-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">ID</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Email</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {teamData?.teamMembers?.map((member: TeamMember) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1 font-mono">{member.id}</td>
                    <td className="border border-gray-300 px-2 py-1">{member.full_name}</td>
                    <td className="border border-gray-300 px-2 py-1">{member.email}</td>
                    <td className="border border-gray-300 px-2 py-1">{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
