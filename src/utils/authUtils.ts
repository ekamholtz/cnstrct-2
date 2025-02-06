
import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const handleLoginError = (error: AuthError | Error) => {
  // Enhanced error logging
  console.error("Sign in error details:", {
    message: error.message,
    status: 'status' in error ? error.status : undefined,
    name: error.name,
    stack: error.stack,
    fullError: error
  });

  let errorMessage = "An unexpected error occurred during login";
  
  if (error instanceof AuthError) {
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please confirm your email address before logging in";
    } else if (error.status === 500) {
      errorMessage = "Server error. Please try again in a few minutes. If the problem persists, contact support.";
      // Additional logging for 500 errors
      console.error("Server error details:", {
        error,
        timestamp: new Date().toISOString(),
        additionalInfo: error.message
      });
    } else {
      errorMessage = error.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
    // Log unexpected errors
    console.error("Unexpected error type:", {
      error,
      type: error.constructor.name
    });
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
      console.error("Error creating profile:", {
        error: insertError,
        userId,
        fullName,
        role,
        timestamp: new Date().toISOString()
      });
      throw insertError;
    }
  } catch (error) {
    console.error("Unexpected error in createProfile:", {
      error,
      userId,
      fullName,
      role,
      timestamp: new Date().toISOString()
    });
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
      console.error("Error fetching profile:", {
        error: profileError,
        userId,
        timestamp: new Date().toISOString()
      });
      throw profileError;
    }

    console.log("Fetched profile:", profile);
    return profile;
  } catch (error) {
    console.error("Unexpected error in fetchUserProfile:", {
      error,
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};
