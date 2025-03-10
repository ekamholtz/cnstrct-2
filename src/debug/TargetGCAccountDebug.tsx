import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

// Update to match the UUID format from the screenshot
const TARGET_GC_ACCOUNT_ID = "eed9e4ee-3110-4267-80ac-cd8e98be59f3";

export const TargetGCAccountDebug = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [normalizedResults, setNormalizedResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching profiles with gc_account_id: ${TARGET_GC_ACCOUNT_ID}`);
        
        // Try exact match first
        const { data: exactMatchProfiles, error: exactMatchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('gc_account_id', TARGET_GC_ACCOUNT_ID);

        if (exactMatchError) {
          console.error("Error fetching profiles with exact match:", exactMatchError);
          setError(exactMatchError.message);
        } else {
          console.log(`Found ${exactMatchProfiles?.length || 0} profiles with exact match`);
          setProfiles(exactMatchProfiles || []);
        }
        
        // Now try normalized comparison
        // Get all profiles
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (allProfilesError) {
          console.error("Error fetching all profiles:", allProfilesError);
        } else {
          console.log(`Found ${allProfiles?.length || 0} total profiles`);
          
          // Normalize the target UUID
          const normalizeUUID = (uuid: string | null | undefined): string => {
            if (!uuid) return '';
            // Remove all non-alphanumeric characters and convert to lowercase
            return uuid.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          };
          
          const normalizedTargetUUID = normalizeUUID(TARGET_GC_ACCOUNT_ID);
          console.log("Normalized target UUID:", normalizedTargetUUID);
          
          // Filter profiles with normalized comparison
          const matchingProfiles = allProfiles?.filter(p => {
            const normalizedProfileUUID = normalizeUUID(p.gc_account_id);
            const isMatch = normalizedProfileUUID === normalizedTargetUUID;
            
            if (isMatch) {
              console.log(`Found matching profile with normalized UUID: ${p.full_name} (${p.id})`);
              console.log(`  Original UUID: ${p.gc_account_id}`);
              console.log(`  Normalized UUID: ${normalizedProfileUUID}`);
            }
            
            return isMatch;
          });
          
          console.log(`Found ${matchingProfiles?.length || 0} profiles with normalized UUID comparison`);
          setNormalizedResults(matchingProfiles || []);
          
          // If we found more profiles with normalized comparison, use those instead
          if (matchingProfiles && matchingProfiles.length > (exactMatchProfiles?.length || 0)) {
            console.log("Using normalized results as they found more profiles");
            setProfiles(matchingProfiles);
          }
        }
      } catch (e) {
        console.error("Error in target GC account debug:", e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="mt-8 border-red-300">
      <CardHeader>
        <CardTitle className="text-red-500">Target GC Account Debug</CardTitle>
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
            <h3 className="font-bold mb-2">Target GC Account</h3>
            <p className="text-sm mb-2">
              <span className="font-mono">{TARGET_GC_ACCOUNT_ID}</span>
            </p>
            <p className="text-xs mb-2">
              <strong>Normalized:</strong> <span className="font-mono">{TARGET_GC_ACCOUNT_ID.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}</span>
            </p>
          </div>

          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-bold mb-2">Profiles with Target GC Account ID</h3>
            {loading ? (
              <p>Loading...</p>
            ) : profiles.length > 0 ? (
              <div>
                <p className="mb-2">Found {profiles.length} profiles with target GC account ID:</p>
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="border p-2 rounded">
                      <p className="font-bold">{profile.full_name || 'Unnamed'}</p>
                      <p className="text-xs"><strong>ID:</strong> {profile.id}</p>
                      <p className="text-xs"><strong>Role:</strong> {profile.role || 'No role'}</p>
                      <p className="text-xs"><strong>GC Account ID:</strong> {profile.gc_account_id}</p>
                      <p className="text-xs"><strong>Exact Match:</strong> {profile.gc_account_id === TARGET_GC_ACCOUNT_ID ? 'Yes' : 'No'}</p>
                      <p className="text-xs"><strong>Normalized Match:</strong> {profile.gc_account_id?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === TARGET_GC_ACCOUNT_ID.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ? 'Yes' : 'No'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No profiles found with target GC account ID</p>
            )}
          </div>
          
          {normalizedResults.length > 0 && normalizedResults.length !== profiles.length && (
            <div className="bg-yellow-100 p-3 rounded-md">
              <h3 className="font-bold mb-2">Additional Profiles Found with Normalized UUID</h3>
              <p className="mb-2">Found {normalizedResults.length} profiles with normalized UUID comparison:</p>
              <div className="space-y-2">
                {normalizedResults.map((profile) => (
                  <div key={profile.id} className="border p-2 rounded">
                    <p className="font-bold">{profile.full_name || 'Unnamed'}</p>
                    <p className="text-xs"><strong>ID:</strong> {profile.id}</p>
                    <p className="text-xs"><strong>Role:</strong> {profile.role || 'No role'}</p>
                    <p className="text-xs"><strong>GC Account ID:</strong> {profile.gc_account_id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
