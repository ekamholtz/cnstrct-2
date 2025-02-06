
import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const handleLoginError = (error: AuthError) => {
  console.error("Sign in error details:", {
    message: error.message,
    status: error.status,
    name: error.name
  });

  let errorMessage = "An unexpected error occurred during login";
  if (error.message) {
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please confirm your email address before logging in";
    } else {
      errorMessage = error.message;
    }
  }
  return errorMessage;
};

export const createProfile = async (userId: string, fullName: string, role: string) => {
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName,
      role: role,
      has_completed_profile: false,
    });

  if (insertError) {
    console.error("Error creating profile:", insertError);
    throw insertError;
  }
};

export const fetchUserProfile = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    throw profileError;
  }

  return profile;
};
