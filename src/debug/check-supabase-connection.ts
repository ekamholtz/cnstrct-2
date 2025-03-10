import { supabase } from "@/integrations/supabase/client";

/**
 * This is a debug utility to check the Supabase connection
 * Run this with ts-node or similar to check if Supabase is configured correctly
 */
async function checkSupabaseConnection() {
  console.log("Checking Supabase connection...");
  
  // Check if we can connect to Supabase
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error("Error connecting to Supabase:", error);
      return;
    }
    
    console.log("Successfully connected to Supabase!");
    console.log("Connection details:");
    // Use the environment variable instead of accessing the protected property
    console.log("- URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "URL not available");
    
    // Check authentication status
    const { data: authData } = await supabase.auth.getSession();
    if (authData.session) {
      console.log("- Authenticated: Yes");
      console.log("- User ID:", authData.session.user.id);
      console.log("- Email:", authData.session.user.email);
    } else {
      console.log("- Authenticated: No");
      console.log("\nTo authenticate:");
      console.log("1. Open http://localhost:8082/ in your browser");
      console.log("2. Log in with your Supabase credentials");
    }
  } catch (e) {
    console.error("Exception when connecting to Supabase:", e);
  }
}

// Execute the function
checkSupabaseConnection().catch(console.error);
