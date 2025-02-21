
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
      .select()
      .eq('id', userId)
      .single();

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
      .select()
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
