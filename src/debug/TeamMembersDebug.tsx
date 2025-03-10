import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserProfile } from '@/components/gc-profile/hooks/useCurrentUserProfile';
import { useTeamMembers } from '@/hooks/useTeamMembers';

/**
 * This component is for debugging the team members issue
 * It directly queries the database and compares with the useTeamMembers hook results
 */
export const TeamMembersDebug = () => {
  const [directDbProfiles, setDirectDbProfiles] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { currentUserProfile, isLoading: isLoadingProfile } = useCurrentUserProfile();
  const { teamMembers, isLoadingTeam, error: teamMembersError } = useTeamMembers();

  // Check Supabase connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          console.error("Debug component - Error connecting to Supabase:", error);
          setConnectionStatus('error');
          setConnectionError(error.message);
          return;
        }
        
        console.log("Debug component - Successfully connected to Supabase");
        setConnectionStatus('connected');
        
        // Get current auth user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          console.log("Debug component - Current auth user:", user);
        } else {
          console.log("Debug component - No authenticated user found");
        }
      } catch (e) {
        console.error("Debug component - Exception when connecting to Supabase:", e);
        setConnectionStatus('error');
        setConnectionError(e instanceof Error ? e.message : String(e));
      }
    };
    
    checkConnection();
  }, []);

  // Direct database check for team members
  useEffect(() => {
    const checkTeamMembers = async () => {
      if (!currentUserProfile?.gc_account_id) {
        console.log("Debug component - No gc_account_id available for direct check");
        return;
      }
      
      try {
        console.log("Debug component - Directly checking database for team members with gc_account_id:", currentUserProfile.gc_account_id);
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('gc_account_id', currentUserProfile.gc_account_id);
          
        if (error) {
          console.error("Debug component - Direct DB check error:", error);
          return;
        }
        
        console.log(`Debug component - Direct DB check found ${profiles?.length || 0} team members`);
        setDirectDbProfiles(profiles || []);
        
        if (profiles && profiles.length > 0) {
          profiles.forEach((profile, index) => {
            console.log(`Debug component - Direct DB Profile ${index + 1}:`, {
              id: profile.id,
              name: profile.full_name,
              role: profile.role,
              gc_account_id: profile.gc_account_id
            });
          });
        }
      } catch (err) {
        console.error("Debug component - Error in direct DB check:", err);
      }
    };
    
    if (connectionStatus === 'connected') {
      checkTeamMembers();
    }
  }, [currentUserProfile?.gc_account_id, connectionStatus]);

  return (
    <Card className="mt-8 border-red-300">
      <CardHeader>
        <CardTitle className="text-red-500">Team Members Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Connection Status</h3>
            <p>Status: {connectionStatus === 'checking' ? 'Checking...' : 
                      connectionStatus === 'connected' ? 'Connected ' : 'Error '}</p>
            {connectionError && <p className="text-red-500">Error: {connectionError}</p>}
          </div>
          
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Current Auth User</h3>
            {currentUser ? (
              <div>
                <p>ID: {currentUser.id}</p>
                <p>Email: {currentUser.email}</p>
                <p>Created: {new Date(currentUser.created_at).toLocaleString()}</p>
              </div>
            ) : (
              <p>No authenticated user found</p>
            )}
          </div>
          
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Current User Profile</h3>
            {isLoadingProfile ? (
              <p>Loading profile...</p>
            ) : currentUserProfile ? (
              <div>
                <p>ID: {currentUserProfile.id}</p>
                <p>Name: {currentUserProfile.full_name}</p>
                <p>Role: {currentUserProfile.role}</p>
                <p>GC Account ID: {currentUserProfile.gc_account_id || 'None'}</p>
              </div>
            ) : (
              <p>No profile found</p>
            )}
          </div>
          
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Team Members from Hook</h3>
            {teamMembersError && (
              <p className="text-red-500 mb-2">Error: {teamMembersError instanceof Error ? teamMembersError.message : String(teamMembersError)}</p>
            )}
            {isLoadingTeam ? (
              <p>Loading team members...</p>
            ) : teamMembers && teamMembers.length > 0 ? (
              <div>
                <p className="mb-2">Found {teamMembers.length} team members:</p>
                <ul className="list-disc pl-5">
                  {teamMembers.map((member, index) => (
                    <li key={index}>
                      {member.full_name} ({member.email || 'No email'}) - {member.role}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No team members found from hook</p>
            )}
          </div>
          
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Team Members from Direct DB Query</h3>
            {directDbProfiles.length > 0 ? (
              <div>
                <p className="mb-2">Found {directDbProfiles.length} team members:</p>
                <ul className="list-disc pl-5">
                  {directDbProfiles.map((profile, index) => (
                    <li key={index}>
                      {profile.full_name || 'No name'} - {profile.role} (ID: {profile.id})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No team members found from direct query</p>
            )}
          </div>
          
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Comparison</h3>
            <p>Team members from hook: {teamMembers?.length || 0}</p>
            <p>Team members from direct DB: {directDbProfiles.length}</p>
            {teamMembers && directDbProfiles.length > 0 && (
              <p>
                Match: {
                  teamMembers.length === directDbProfiles.length ? ' Count matches' : ' Count mismatch'
                }
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
