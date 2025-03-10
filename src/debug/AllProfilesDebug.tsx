import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const AllProfilesDebug = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [gcAccounts, setGcAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAllProfiles, setShowAllProfiles] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No authenticated user found");
          setLoading(false);
          return;
        }

        // Get current user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError(`Error fetching user profile: ${profileError.message}`);
          setLoading(false);
          return;
        }

        setCurrentUser(userProfile);
        console.log("Current user profile:", userProfile);

        // Get all profiles
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*');

        if (allProfilesError) {
          setError(`Error fetching profiles: ${allProfilesError.message}`);
          setLoading(false);
          return;
        }

        setProfiles(allProfiles || []);
        console.log(`Found ${allProfiles?.length || 0} profiles`);

        // Get all GC accounts
        const { data: allGcAccounts, error: gcAccountsError } = await supabase
          .from('gc_accounts')
          .select('*');

        if (gcAccountsError) {
          setError(`Error fetching GC accounts: ${gcAccountsError.message}`);
          setLoading(false);
          return;
        }

        setGcAccounts(allGcAccounts || []);
        console.log(`Found ${allGcAccounts?.length || 0} GC accounts`);

        // Since we can't use admin API to get users, we'll just use the profile data
        // In a real app, you would store emails in the profiles table or use a different approach
        const profilesWithEmail = allProfiles?.map(profile => {
          // Generate a placeholder email based on the user's name
          const placeholderEmail = profile.full_name 
            ? `${profile.full_name.toLowerCase().replace(/\s+/g, '.')}@example.com`
            : `user-${profile.id.substring(0, 8)}@example.com`;
            
          return {
            ...profile,
            email: placeholderEmail
          };
        });

        setProfiles(profilesWithEmail || []);

        // Detailed logging of profiles with the same gc_account_id as current user
        if (userProfile?.gc_account_id) {
          const sameGcAccountProfiles = allProfiles?.filter(
            p => p.gc_account_id === userProfile.gc_account_id
          );
          
          console.log(`Found ${sameGcAccountProfiles?.length || 0} profiles with the same gc_account_id (${userProfile.gc_account_id}):`);
          
          sameGcAccountProfiles?.forEach((profile, index) => {
            console.log(`Profile ${index + 1}:`, {
              id: profile.id,
              full_name: profile.full_name,
              role: profile.role,
              gc_account_id: profile.gc_account_id,
              // Check if the gc_account_id strings are exactly equal
              exact_match: profile.gc_account_id === userProfile.gc_account_id,
              // Check if the gc_account_id strings are equal after trimming
              trimmed_match: profile.gc_account_id?.trim() === userProfile.gc_account_id?.trim(),
              // Check if the gc_account_id strings are equal after converting to lowercase
              lowercase_match: profile.gc_account_id?.toLowerCase() === userProfile.gc_account_id?.toLowerCase(),
              // Check the string lengths
              gc_account_id_length: profile.gc_account_id?.length,
              current_user_gc_account_id_length: userProfile.gc_account_id?.length
            });
          });
        }
      } catch (e) {
        console.error("Error in all profiles debug:", e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group profiles by gc_account_id
  const profilesByGcAccount: Record<string, any[]> = {};
  profiles.forEach(profile => {
    const gcAccountId = profile.gc_account_id || 'No GC Account';
    if (!profilesByGcAccount[gcAccountId]) {
      profilesByGcAccount[gcAccountId] = [];
    }
    profilesByGcAccount[gcAccountId].push(profile);
  });

  // Find the GC account details for each group
  const gcAccountDetails: Record<string, any> = {};
  gcAccounts.forEach(account => {
    gcAccountDetails[account.id] = account;
  });

  return (
    <Card className="mt-8 border-blue-300">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-blue-500">All Profiles Debug</CardTitle>
          <button 
            onClick={() => setShowAllProfiles(!showAllProfiles)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded"
          >
            {showAllProfiles ? "Hide All Profiles" : "Show All Profiles"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-100 p-3 rounded-md">
              <h3 className="font-bold mb-2">Error</h3>
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Current User</h3>
            {loading ? (
              <p>Loading...</p>
            ) : currentUser ? (
              <div className="text-sm">
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>Name:</strong> {currentUser.full_name || 'N/A'}</p>
                <p><strong>Role:</strong> {currentUser.role || 'N/A'}</p>
                <p><strong>GC Account ID:</strong> {currentUser.gc_account_id || 'N/A'}</p>
                <p><strong>GC Account ID Length:</strong> {currentUser.gc_account_id?.length || 0}</p>
                <p><strong>GC Account ID (Hex):</strong> {typeof currentUser.gc_account_id === 'string' ? 
                  Array.from(currentUser.gc_account_id as string).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ') : 
                  'Not available'}</p>
              </div>
            ) : (
              <p>No user data available</p>
            )}
          </div>

          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Profiles by GC Account</h3>
            {loading ? (
              <p>Loading...</p>
            ) : Object.keys(profilesByGcAccount).length > 0 ? (
              <div>
                <p className="mb-2">Found {profiles.length} profiles across {Object.keys(profilesByGcAccount).length} GC accounts:</p>
                
                {/* First show the current user's GC account */}
                {currentUser?.gc_account_id && profilesByGcAccount[currentUser.gc_account_id] && (
                  <div className="border-2 border-blue-500 p-2 rounded mb-4">
                    <p className="font-bold text-blue-700">Current User's GC Account: {currentUser.gc_account_id}</p>
                    <p className="text-xs">GC Account Name: {gcAccountDetails[currentUser.gc_account_id]?.name || 'N/A'}</p>
                    <p className="text-xs">Owner ID: {gcAccountDetails[currentUser.gc_account_id]?.owner_id || 'N/A'}</p>
                    <p className="text-xs">Profiles: {profilesByGcAccount[currentUser.gc_account_id].length}</p>
                    
                    <div className="mt-2">
                      <p className="text-xs font-semibold">Team Members:</p>
                      <ul className="text-xs list-disc pl-5">
                        {profilesByGcAccount[currentUser.gc_account_id].map((profile) => (
                          <li key={profile.id} className={profile.id === currentUser.id ? "font-bold" : ""}>
                            {profile.full_name || 'Unnamed'} ({profile.role || 'No role'}) - {profile.email || 'No email'} 
                            {profile.id === currentUser.id ? " (Current User)" : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Show all other GC accounts */}
                {showAllProfiles && Object.entries(profilesByGcAccount)
                  .filter(([gcAccountId]) => gcAccountId !== currentUser?.gc_account_id)
                  .map(([gcAccountId, profiles]) => (
                    <div key={gcAccountId} className="border p-2 rounded mb-2">
                      <p className="font-bold">{gcAccountId}</p>
                      <p className="text-xs">GC Account Name: {gcAccountDetails[gcAccountId]?.name || 'N/A'}</p>
                      <p className="text-xs">Owner ID: {gcAccountDetails[gcAccountId]?.owner_id || 'N/A'}</p>
                      <p className="text-xs">Profiles: {profiles.length}</p>
                      
                      <div className="mt-2">
                        <p className="text-xs font-semibold">Team Members:</p>
                        <ul className="text-xs list-disc pl-5">
                          {profiles.map((profile) => (
                            <li key={profile.id}>
                              {profile.full_name || 'Unnamed'} ({profile.role || 'No role'}) - {profile.email || 'No email'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No profiles found</p>
            )}
          </div>
          
          {/* Show all GC accounts */}
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">All GC Accounts</h3>
            {loading ? (
              <p>Loading...</p>
            ) : gcAccounts.length > 0 ? (
              <div>
                <p className="mb-2">Found {gcAccounts.length} GC accounts:</p>
                <ul className="text-xs list-disc pl-5">
                  {gcAccounts.map((account) => (
                    <li key={account.id} className={account.id === currentUser?.gc_account_id ? "font-bold" : ""}>
                      <strong>ID:</strong> {account.id} 
                      <strong> Name:</strong> {account.name || 'Unnamed'} 
                      <strong> Owner:</strong> {account.owner_id || 'No owner'}
                      {account.id === currentUser?.gc_account_id ? " (Current User's GC)" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No GC accounts found</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
