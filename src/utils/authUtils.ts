
import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const handleLoginError = (error: AuthError | Error) => {
  // Enhanced error logging with detailed information
  console.error("Authentication error details:", {
    message: error.message,
    status: 'status' in error ? error.status : undefined,
    name: error.name,
    stack: error.stack,
    fullError: error,
    timestamp: new Date().toISOString()
  });

  let errorMessage = "An unexpected error occurred. Please try again.";
  
  if (error instanceof AuthError) {
    switch (error.message) {
      case "Invalid login credentials":
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
        break;
      case "Email not confirmed":
        errorMessage = "Please confirm your email address before logging in";
        break;
      case "Password recovery initiated":
        errorMessage = "Check your email for password reset instructions";
        break;
      case "Database error querying schema":
        console.error("Database schema error details:", error);
        errorMessage = "The system is experiencing technical difficulties. Please try again in a few moments.";
        break;
      default:
        if (error.message.includes("Database error")) {
          errorMessage = "The system is temporarily unavailable. Please try again in a few moments.";
        } else if (error.status === 500) {
          errorMessage = "The service is currently unavailable. Please try again in a few moments.";
        } else {
          errorMessage = error.message;
        }
    }
  } else if (error instanceof Error) {
    console.error("Unexpected error type in auth flow:", {
      error,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    });
    errorMessage = "Unable to complete your request. Please try again in a few moments.";
  }
  
  return errorMessage;
};

export const createProfile = async (userId: string, fullName: string, role: UserRole) => {
  console.log("Creating profile for user:", { userId, fullName, role });
  
  try {
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, has_completed_profile')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing profile:", checkError);
      throw checkError;
    }

    if (existingProfile) {
      console.log("Profile already exists for user:", userId);
      return existingProfile;
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName || '',
        role: role,
        has_completed_profile: role === 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, full_name, role, has_completed_profile')
      .single();

    if (insertError) {
      console.error("Profile creation failed:", insertError);
      throw insertError;
    }

    console.log("Profile created successfully:", { userId, role });
    return newProfile;
  } catch (error) {
    console.error("Unexpected error in createProfile:", error);
    throw error;
  }
};

export const fetchUserProfile = async (userId: string) => {
  console.log("Fetching profile for user:", userId);
  
  try {
    // First get the user's metadata from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    // Create a basic profile from auth metadata
    const baseProfile = {
      id: userId,
      full_name: user.user_metadata.full_name || '',
      role: user.user_metadata.role as UserRole,
      has_completed_profile: false,
      account_status: 'active'
    };

    try {
      // Attempt to get additional profile data with a minimal query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('has_completed_profile, account_status')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn("Could not fetch additional profile data:", profileError);
        return baseProfile;
      }

      if (!profileData) {
        console.log("No additional profile data found, using base profile");
        return baseProfile;
      }

      // Merge additional profile data with base profile
      return {
        ...baseProfile,
        has_completed_profile: profileData.has_completed_profile,
        account_status: profileData.account_status
      };

    } catch (error) {
      console.warn("Error fetching additional profile data, using base profile:", error);
      return baseProfile;
    }

  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    throw error;
  }
};
