
import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const handleLoginError = (error: AuthError | Error) => {
  // Log the full error details for debugging
  console.error("Sign in error details:", {
    message: error.message,
    status: 'status' in error ? error.status : undefined,
    name: error.name,
  });

  let errorMessage = "An unexpected error occurred during login";
  
  if (error instanceof AuthError) {
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please confirm your email address before logging in";
    } else if (error.status === 500) {
      errorMessage = "Server error. Please try again in a few minutes";
    } else {
      errorMessage = error.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  return errorMessage;
};

export const createProfile = async (userId: string, fullName: string, role: UserRole) => {
  console.log("Creating profile for user:", { userId, fullName, role });
  
  try {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role: role,
        has_completed_profile: false,
        address: '', // Required field with empty default
      });

    if (insertError) {
      console.error("Error creating profile:", insertError);
      throw insertError;
    }
  } catch (error) {
    console.error("Unexpected error in createProfile:", error);
    throw error;
  }
};

export const fetchUserProfile = async (userId: string) => {
  console.log("Fetching profile for user:", userId);
  
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    console.log("Fetched profile:", profile);
    return profile;
  } catch (error) {
    console.error("Unexpected error in fetchUserProfile:", error);
    throw error;
  }
};
