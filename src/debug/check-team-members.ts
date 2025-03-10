import { supabase } from "@/integrations/supabase/client";

/**
 * This is a debug utility to check the team members directly from the database
 * Run this with ts-node or similar to check the database state
 */
async function checkTeamMembers() {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("No authenticated user found");
    console.log("\nIMPORTANT: This script requires authentication to work.");
    console.log("Please follow these steps:");
    console.log("1. Open http://localhost:8082/ in your browser");
    console.log("2. Log in with your Supabase credentials");
    console.log("3. Once logged in, the browser's console will show detailed debugging information");
    console.log("4. Check the TeamMembersDebug component on the dashboard for visual debugging");
    console.log("\nAlternatively, you can use the Supabase CLI to run this script with proper authentication.");
    return;
  }

  console.log("Current user ID:", user.id);

  // Get the current user's profile
  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Error fetching current user profile:", profileError);
    return;
  }

  console.log("Current user profile:", currentUserProfile);
  
  if (!currentUserProfile.gc_account_id) {
    console.error("Current user doesn't have a gc_account_id");
    return;
  }

  // Get all profiles with the same gc_account_id
  const { data: teamProfiles, error: teamError } = await supabase
    .from('profiles')
    .select('*')
    .eq('gc_account_id', currentUserProfile.gc_account_id);

  if (teamError) {
    console.error("Error fetching team profiles:", teamError);
    return;
  }

  console.log(`Found ${teamProfiles.length} team members with gc_account_id ${currentUserProfile.gc_account_id}:`);
  teamProfiles.forEach((profile, index) => {
    console.log(`Team member ${index + 1}:`, {
      id: profile.id,
      name: profile.full_name,
      role: profile.role,
      gc_account_id: profile.gc_account_id
    });
  });

  // Check if the gc_account exists
  const { data: gcAccount, error: gcError } = await supabase
    .from('gc_accounts')
    .select('*')
    .eq('id', currentUserProfile.gc_account_id)
    .single();

  if (gcError) {
    console.error("Error fetching GC account:", gcError);
    return;
  }

  console.log("GC account:", gcAccount);
}

// Execute the function
checkTeamMembers().catch(console.error);
